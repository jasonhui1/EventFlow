/**
 * Standalone utility for simulating event flows and generating prompts.
 * These functions are decoupled from Zustand/React state and can run on the server.
 */

/**
 * Get parent nodes (nodes that connect TO a specific node)
 */
export const getParentNodes = (nodeId, nodes, edges) => {
    const parentEdges = edges.filter((edge) => edge.target === nodeId);
    return parentEdges.map((edge) => {
        const parentNode = nodes.find((n) => n.id === edge.source);
        return parentNode ? { node: parentNode, edgeId: edge.id, sourceHandle: edge.sourceHandle } : null;
    }).filter(Boolean);
};

/**
 * Get all inherited prompts from parent nodes (recursive)
 */
const processPrompt = (promptData) => {
    if (Array.isArray(promptData)) {
        return promptData.filter(p => p && p.trim() !== '').join(', ');
    }
    return promptData || '';
};

export const getInheritedPrompts = (nodeId, allEvents, nodes, edges, visited = new Set(), options = {}) => {
    const { originalDisabledSources = null, selectSinglePath = false, randomize = false, allowedEdges = null } = options;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || visited.has(nodeId)) return [];

    visited.add(nodeId);

    const disabledSources = originalDisabledSources !== null
        ? originalDisabledSources
        : (node.data?.disabledInheritedSources || []);

    let parentNodes = getParentNodes(nodeId, nodes, edges);

    if (allowedEdges) {
        parentNodes = parentNodes.filter(({ edgeId }) => allowedEdges.has(edgeId));
    }

    if (selectSinglePath && parentNodes.length > 1) {
        if (randomize) {
            const index = Math.floor(Math.random() * parentNodes.length);
            parentNodes = [parentNodes[index]];
        } else {
            parentNodes = [parentNodes[0]];
        }
    }

    let inheritedPrompts = [];

    for (const { node: parentNode } of parentNodes) {
        const parentInherited = getInheritedPrompts(parentNode.id, allEvents, nodes, edges, visited, {
            ...options,
            originalDisabledSources: disabledSources,
        });
        inheritedPrompts = [...inheritedPrompts, ...parentInherited];

        if (disabledSources.includes(parentNode.id)) continue;

        // Handle reference nodes
        if (parentNode.type === 'referenceNode' && parentNode.data?.referenceId) {
            const referencedEvent = allEvents.find(e => e.id === parentNode.data.referenceId);
            if (referencedEvent && referencedEvent.nodes && referencedEvent.edges) {
                const refEndNode = referencedEvent.nodes.find(n => n.type === 'endNode');
                if (refEndNode) {
                    const refInherited = getInheritedPrompts(
                        refEndNode.id,
                        allEvents,
                        referencedEvent.nodes,
                        referencedEvent.edges,
                        new Set(),
                        {
                            ...options,
                            originalDisabledSources: [],
                        }
                    );
                    inheritedPrompts = [...inheritedPrompts, ...refInherited];
                }
            }
        }

        if (parentNode.data?.inheritedPrompt) {
            inheritedPrompts.push({
                nodeId: parentNode.id,
                nodeLabel: parentNode.data.label || 'Unknown',
                prompt: processPrompt(parentNode.data.inheritedPrompt),
                type: parentNode.type,
            });
        }

        if (parentNode.type === 'groupNode' && parentNode.data?.fixedPrompt) {
            inheritedPrompts.push({
                nodeId: parentNode.id,
                nodeLabel: parentNode.data.label || 'Group',
                prompt: processPrompt(parentNode.data.fixedPrompt),
                type: 'groupNode',
            });
        }
    }

    return inheritedPrompts;
};

/**
 * Get the fully composed prompt for a node
 */
export const getComposedPrompt = (nodeId, allEvents, nodes, edges, currentEventFixedPrompt = '', options = {}) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { parts: [], full: '' };

    const inheritedPrompts = getInheritedPrompts(nodeId, allEvents, nodes, edges, new Set(), {
        selectSinglePath: !options.allowedEdges,
        randomize: options.randomize || false,
        allowedEdges: options.allowedEdges
    });

    const localPrompt = processPrompt(node.data?.localPrompt);
    const nodeInheritedPrompt = processPrompt(node.data?.inheritedPrompt);

    const parts = [];

    if (currentEventFixedPrompt) {
        parts.push({ label: 'Event Fixed Prompt', prompt: currentEventFixedPrompt, type: 'event' });
    }

    inheritedPrompts.forEach((item) => {
        parts.push({ label: `From: ${item.nodeLabel}`, prompt: item.prompt, type: item.type, nodeId: item.nodeId });
    });

    if (options.resolveReferences !== false && node.type === 'referenceNode' && node.data?.referenceId) {
        const refEvent = allEvents.find(e => e.id === node.data.referenceId);
        if (refEvent && refEvent.nodes) {
            const refEndNode = refEvent.nodes.find(n => n.type === 'endNode');
            if (refEndNode) {
                const innerPrompts = getInheritedPrompts(
                    refEndNode.id,
                    allEvents,
                    refEvent.nodes,
                    refEvent.edges || [],
                    new Set(),
                    {
                        selectSinglePath: true,
                        randomize: options.randomize,
                    }
                );

                innerPrompts.forEach(item => {
                    parts.push({
                        label: `(Ref) ${item.nodeLabel}`,
                        prompt: item.prompt,
                        type: 'reference-inner',
                        nodeId: item.nodeId
                    });
                });
            }
        }
    }

    if (localPrompt) {
        parts.push({ label: 'This Event Only', prompt: localPrompt, type: 'local' });
    }

    if (nodeInheritedPrompt) {
        parts.push({ label: 'Carries Forward', prompt: nodeInheritedPrompt, type: 'inherited' });
    }

    if (node.data?.usePerspective) {
        parts.push({ label: 'Perspective', prompt: 'perspective, foreshortening', type: 'shot' });
    }

    const full = parts.map((p) => p.prompt).filter(Boolean).join(', ');

    return { parts, full };
};

/**
 * Simulate an event flow and return an array of resulting prompts
 */
export const simulateEvent = (allEvents, currentNodes, currentEdges, currentEventFixedPrompt = '', incomingContextParts = [], visitedEventIds = new Set()) => {
    const startNodes = currentNodes.filter(n => n.type === 'startNode');

    if (startNodes.length === 0) return [];

    startNodes.sort((a, b) => a.position.y - b.position.y);
    const results = [];
    const visitedNodeIds = new Set();
    const visitedEdgeIds = new Set();
    const queue = [...startNodes];

    while (queue.length > 0) {
        const currentNode = queue.shift();

        if (visitedNodeIds.has(currentNode.id)) continue;
        visitedNodeIds.add(currentNode.id);

        if (currentNode.type === 'referenceNode' && currentNode.data?.referenceId) {
            if (!visitedEventIds.has(currentNode.data.referenceId)) {
                const refEvent = allEvents.find(e => e.id === currentNode.data.referenceId);
                if (refEvent && refEvent.nodes) {
                    const { parts: refPromptParts } = getComposedPrompt(
                        currentNode.id,
                        allEvents,
                        currentNodes,
                        currentEdges,
                        currentEventFixedPrompt,
                        {
                            allowedEdges: visitedEdgeIds,
                            randomize: false,
                            resolveReferences: false
                        }
                    );

                    const newContextParts = [...incomingContextParts, ...refPromptParts];
                    const newVisitedEvents = new Set(visitedEventIds).add(currentNode.data.referenceId);

                    // Deep clone nodes to avoid mutating the original store during simulation
                    // and apply input overrides from the reference node
                    const nodesToSimulate = refEvent.nodes.map(n => ({ ...n, data: { ...n.data } }));
                    const overrides = currentNode.data?.inputOverrides || {};
                    const startNode = nodesToSimulate.find(n => n.type === 'startNode');

                    if (startNode && startNode.data.inputs) {
                        startNode.data.inputs = startNode.data.inputs.map(input => ({
                            ...input,
                            enabled: overrides.hasOwnProperty(input.id) ? overrides[input.id] : input.enabled
                        }));
                    }

                    const innerResults = simulateEvent(
                        allEvents,
                        nodesToSimulate,
                        refEvent.edges || [],
                        refEvent.fixedPrompt || '',
                        newContextParts,
                        newVisitedEvents
                    );
                    results.push(...innerResults);
                }
            }
        } else {
            const hiddenTypes = ['startNode', 'endNode', 'branchNode', 'referenceNode', 'ifNode'];
            if (!hiddenTypes.includes(currentNode.type)) {
                const { parts: localParts } = getComposedPrompt(
                    currentNode.id,
                    allEvents,
                    currentNodes,
                    currentEdges,
                    currentEventFixedPrompt,
                    {
                        allowedEdges: visitedEdgeIds,
                        randomize: false,
                        resolveReferences: false
                    }
                );

                const finalParts = [...incomingContextParts, ...localParts];
                const fullPrompt = finalParts.map(p => p.prompt).filter(Boolean).join(', ');

                results.push({
                    id: `${currentNode.id}-${Math.random().toString(36).substr(2, 9)}`,
                    originalId: currentNode.id,
                    label: currentNode.data?.label || currentNode.type,
                    type: currentNode.type,
                    prompt: fullPrompt,
                    parts: finalParts
                });
            }
        }

        if (currentNode.type === 'endNode') continue;

        const outgoingEdges = currentEdges.filter(e => e.source === currentNode.id);

        if (currentNode.type === 'branchNode') {
            if (outgoingEdges.length > 0) {
                const uniqueHandles = [...new Set(outgoingEdges.map(e => e.sourceHandle))];
                const randomHandle = uniqueHandles[Math.floor(Math.random() * uniqueHandles.length)];
                const selectedEdges = outgoingEdges.filter(e => e.sourceHandle === randomHandle);
                selectedEdges.forEach(edge => {
                    visitedEdgeIds.add(edge.id);
                    const targetNode = currentNodes.find(n => n.id === edge.target);
                    if (targetNode) queue.push(targetNode);
                });
            }
        } else if (currentNode.type === 'ifNode') {
            // Evaluate condition based on Start Node inputs
            const startNode = currentNodes.find(n => n.type === 'startNode');
            const startInputs = startNode?.data?.inputs || [];
            const conditionInputIds = currentNode.data?.conditionInputIds || [];

            // Check if ALL selected inputs are enabled
            const allEnabled = conditionInputIds.length > 0 && conditionInputIds.every(inputId => {
                const input = startInputs.find(i => i.id === inputId);
                return input?.enabled === true;
            });

            // Select the appropriate output handle based on condition result
            const selectedHandle = allEnabled ? 'true_output' : 'false_output';
            const selectedEdges = outgoingEdges.filter(e => e.sourceHandle === selectedHandle);

            selectedEdges.forEach(edge => {
                visitedEdgeIds.add(edge.id);
                const targetNode = currentNodes.find(n => n.id === edge.target);
                if (targetNode) queue.push(targetNode);
            });
        } else {
            outgoingEdges.forEach(edge => {
                visitedEdgeIds.add(edge.id);
                const targetNode = currentNodes.find(n => n.id === edge.target);
                if (targetNode) queue.push(targetNode);
            });
        }
    }
    return results;
};
