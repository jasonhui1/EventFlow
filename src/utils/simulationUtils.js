/**
 * Standalone utility for simulating event flows and generating prompts.
 * These functions are decoupled from Zustand/React state and can run on the server.
 */

/**
 * Get the mood tier based on current mood value
 */
export const getMoodTier = (moodValue, tiers) => {
    for (const tier of tiers) {
        if (moodValue >= tier.min && moodValue < tier.max) {
            return tier;
        }
    }
    // Edge case: mood exactly at 100
    if (moodValue >= 100) {
        return tiers[tiers.length - 1]; // very_positive
    }
    // Edge case: mood exactly at -100
    if (moodValue <= -100) {
        return tiers[0]; // very_negative
    }
    return tiers[2]; // neutral fallback
};

/**
 * Select a tag from a weighted pool
 */
export const selectWeightedTag = (tags) => {
    if (!tags || tags.length === 0) return null;

    // Build weighted pool
    let weightedPool = [];
    tags.forEach(t => {
        const weight = t.weight || 50;
        for (let i = 0; i < weight; i++) {
            weightedPool.push(t.tag);
        }
    });

    if (weightedPool.length === 0) return tags[0]?.tag || null;

    const randomIndex = Math.floor(Math.random() * weightedPool.length);
    return weightedPool[randomIndex];
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
        parts.push({ label: 'Perspective', prompt: 'perspective', type: 'shot' });
    }

    if (node.data?.cameraAbove && !node.data?.cameraBelow) {
        parts.push({ label: 'Camera Above', prompt: '<from above$>', type: 'shot' });
    }

    if (node.data?.cameraBelow && !node.data?.cameraAbove) {
        parts.push({ label: 'Camera Below', prompt: '<from below$>', type: 'shot' });
    }

    if (node.data?.cameraBelow && node.data?.cameraAbove) {
        parts.push({ label: 'Camera Above or Below', prompt: '<from above$from below$>', type: 'shot' });
    }


    if (node.data?.cameraSide) {
        parts.push({ label: 'Camera Side', prompt: '<from side$>', type: 'shot' });
    }

    const full = parts.map((p) => p.prompt).filter(Boolean).join(', ');

    return { parts, full };
};

/**
 * Simulate an event flow and return an array of resulting prompts
 */
export const simulateEvent = (
    allEvents,
    currentNodes,
    currentEdges,
    currentEventFixedPrompt = '',
    incomingContextParts = [],
    visitedEventIds = new Set(),
    inputOverrides = {}, // Parameter for top-level input overrides
    moodConfig = null, // Mood configuration: { tiers, tags, initialMoodRange }
    incomingMood = null // Mood carried from parent simulation
) => {
    // Apply input overrides to top-level start nodes if provided
    const processedNodes = currentNodes.map(node => {
        if (node.type === 'startNode' && inputOverrides && Object.keys(inputOverrides).length > 0) {
            return {
                ...node,
                data: {
                    ...node.data,
                    inputs: node.data.inputs?.map(input => ({
                        ...input,
                        enabled: inputOverrides.hasOwnProperty(input.id)
                            ? inputOverrides[input.id]
                            : input.enabled
                    }))
                }
            };
        }
        return node;
    });

    const startNodes = processedNodes.filter(n => n.type === 'startNode');

    if (startNodes.length === 0) return [];

    // Pre-compute which nodes are inside which fieldNode
    // Nodes inside a field should ONLY be processed via field selection, not independent edges
    const fieldNodes = processedNodes.filter(n => n.type === 'fieldNode');
    const nodeToFieldMap = new Map(); // Maps nodeId -> fieldNodeId that contains it
    const unlockedByField = new Set(); // Nodes selected by their parent field (populated upfront)


    // Process all Field Nodes upfront - they are purely spatial containers with no edges
    fieldNodes.forEach(field => {
        const fieldX = field.position?.x || 0;
        const fieldY = field.position?.y || 0;
        const fieldWidth = field.width || field.style?.width || 400;
        const fieldHeight = field.height || field.style?.height || 300;

        // Find child nodes inside this field
        const childNodes = processedNodes.filter(node => {
            if (node.id === field.id || node.type === 'fieldNode') return false;
            const nodeX = node.position?.x || 0;
            const nodeY = node.position?.y || 0;
            return (
                nodeX >= fieldX && nodeX < fieldX + fieldWidth &&
                nodeY >= fieldY && nodeY < fieldY + fieldHeight
            );
        });

        // Map children to their field
        childNodes.forEach(node => {
            nodeToFieldMap.set(node.id, field.id);
        });

        console.log('[FieldNode Simulation] Processing field:', field.id, field.data?.label, 'with', childNodes.length, 'children');

        if (childNodes.length === 0) return;

        // Apply weighted selection upfront
        const selectCount = field.data?.selectCount ?? 1;

        const childWeights = field.data?.childWeights || {};

        // Build weighted pool
        let weightedPool = [];
        childNodes.forEach(child => {
            const weight = childWeights[child.id] || 50;
            for (let i = 0; i < weight; i++) {
                weightedPool.push(child.id);
            }
        });

        // Select N unique children
        const selectedChildIds = new Set();
        const targetCount = Math.min(selectCount, childNodes.length);

        while (selectedChildIds.size < targetCount && weightedPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * weightedPool.length);
            const selectedId = weightedPool[randomIndex];
            selectedChildIds.add(selectedId);
            weightedPool = weightedPool.filter(id => id !== selectedId);
        }

        // Unlock selected children - they'll be reached via normal edge traversal
        selectedChildIds.forEach(childId => {
            unlockedByField.add(childId);
        });

        console.log('[FieldNode Simulation] Selected:', [...selectedChildIds]);
    });

    console.log('[Simulation] Nodes inside fields:', Object.fromEntries(nodeToFieldMap));

    startNodes.sort((a, b) => a.position.y - b.position.y);
    const results = [];
    const visitedNodeIds = new Set();
    const visitedEdgeIds = new Set();
    const queue = [...startNodes]; // Field children are reached via edges, filtered by unlockedByField

    // Initialize mood state
    let currentMood = incomingMood;
    if (currentMood === null && moodConfig) {
        const { min, max } = moodConfig.initialMoodRange || { min: -20, max: 20 };
        currentMood = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log('[Simulation] Initialized mood:', currentMood);
    }

    while (queue.length > 0) {
        const currentNode = queue.shift();

        if (visitedNodeIds.has(currentNode.id)) continue;

        // Check if this node is inside a field and hasn't been unlocked by field selection
        // Instead of skipping entirely, we flag it - blocked nodes still traverse edges but don't appear in results
        const containingFieldId = nodeToFieldMap.get(currentNode.id);
        const isBlockedByField = containingFieldId && !unlockedByField.has(currentNode.id);

        if (isBlockedByField) {
            console.log('[Simulation] Node blocked by field (will traverse but not output):', currentNode.id, currentNode.data?.label);
        }

        visitedNodeIds.add(currentNode.id);

        if (currentNode.type === 'referenceNode' && currentNode.data?.referenceId) {
            if (!visitedEventIds.has(currentNode.data.referenceId)) {
                const refEvent = allEvents.find(e => e.id === currentNode.data.referenceId);
                if (refEvent && refEvent.nodes) {
                    const { parts: refPromptParts } = getComposedPrompt(
                        currentNode.id,
                        allEvents,
                        processedNodes,
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
                        newVisitedEvents,
                        {}, // inputOverrides - use default for inner simulation
                        moodConfig,
                        currentMood // Pass current mood to inner simulation
                    );
                    // Update currentMood from inner results if they affected it
                    if (innerResults.length > 0 && innerResults[innerResults.length - 1].mood !== undefined) {
                        currentMood = innerResults[innerResults.length - 1].mood;
                    }
                    results.push(...innerResults);
                }
            }
        } else {
            const hiddenTypes = ['startNode', 'endNode', 'branchNode', 'referenceNode', 'ifNode', 'carryForwardNode', 'fieldNode'];
            // Skip adding to results if blocked by field, but still process outgoing edges below
            if (!hiddenTypes.includes(currentNode.type) && !isBlockedByField) {
                const { parts: localParts } = getComposedPrompt(
                    currentNode.id,
                    allEvents,
                    processedNodes,
                    currentEdges,
                    currentEventFixedPrompt,
                    {
                        allowedEdges: visitedEdgeIds,
                        randomize: false,
                        resolveReferences: false
                    }
                );

                const finalParts = [...incomingContextParts, ...localParts];

                // Apply mood change for event nodes (skip if mood disabled)
                let moodTag = null;
                if (moodConfig && currentNode.type === 'eventNode' && !currentNode.data?.moodDisabled) {
                    const moodMin = currentNode.data?.moodChangeMin || 0;
                    const moodMax = currentNode.data?.moodChangeMax || 10;
                    // Pick random value within range (inclusive)
                    const moodChange = moodMin === moodMax
                        ? moodMin
                        : Math.floor(Math.random() * (moodMax - moodMin + 1)) + moodMin;
                    currentMood = clamp((currentMood || 0) + moodChange, -100, 100);

                    // Get mood tier and select weighted tag
                    const tier = getMoodTier(currentMood, moodConfig.tiers);
                    const tierTags = moodConfig.tags[tier.id] || [];
                    moodTag = selectWeightedTag(tierTags);

                    console.log('[Simulation] Mood updated:', { moodChange, currentMood, tier: tier.id, moodTag });

                    // Add mood tag to prompt if present
                    if (moodTag) {
                        finalParts.push({ label: 'Mood Expression', prompt: moodTag, type: 'mood' });
                    }
                }

                const fullPrompt = finalParts.map(p => p.prompt).filter(Boolean).join(', ');

                results.push({
                    id: `${currentNode.id}-${Math.random().toString(36).substr(2, 9)}`,
                    originalId: currentNode.id,
                    label: currentNode.data?.label || currentNode.type,
                    type: currentNode.type,
                    prompt: fullPrompt,
                    parts: finalParts,
                    mood: currentMood,
                    moodTag: moodTag
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
                    const targetNode = processedNodes.find(n => n.id === edge.target);
                    if (targetNode) queue.push(targetNode);
                });
            }
        } else if (currentNode.type === 'ifNode') {
            // Evaluate condition based on Start Node inputs
            const startNode = processedNodes.find(n => n.type === 'startNode');
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
                const targetNode = processedNodes.find(n => n.id === edge.target);
                if (targetNode) queue.push(targetNode);
            });
        } else {
            outgoingEdges.forEach(edge => {
                visitedEdgeIds.add(edge.id);
                const targetNode = processedNodes.find(n => n.id === edge.target);
                if (targetNode) queue.push(targetNode);
            });
        }
    }

    return results;
};
