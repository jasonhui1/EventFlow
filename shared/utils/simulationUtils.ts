/**
 * Standalone utility for simulating event flows and generating prompts.
 * These functions are decoupled from Zustand/React state and can run on the server.
 */
import type { AppNode, AppEdge, StartNode, ReferenceNode, EventNode, GroupNode, IfNode, CarryForwardNode, FieldNode, EndNode } from '../types/graph';
import type { MoodTier, MoodTag, MoodConfig, AppEvent } from '../types/type';

export const isEventNode = (node: AppNode): node is EventNode => node.type === 'eventNode';
export const isCarryForwardNode = (node: AppNode): node is CarryForwardNode => node.type === 'carryForwardNode';
export const isGroupNode = (node: AppNode): node is GroupNode => node.type === 'groupNode';
export const isReferenceNode = (node: AppNode): node is ReferenceNode => node.type === 'referenceNode';
export const isFieldNode = (node: AppNode): node is FieldNode => node.type === 'fieldNode';
export const isStartNode = (node: AppNode): node is StartNode => node.type === 'startNode';
export const isIfNode = (node: AppNode): node is IfNode => node.type === 'ifNode';
export const isEndNode = (node: AppNode): node is EndNode => node.type === 'endNode';

const getNodeLabel = (node: AppNode): string => {
    if (node.type === 'branchNode') return node.data.label;
    if (isEventNode(node)) return node.data.label;
    if (isGroupNode(node)) return node.data.label;
    if (isReferenceNode(node)) return node.data.label;
    if (isStartNode(node)) return node.data.label;
    if (isEndNode(node)) return node.data.label;
    if (isIfNode(node)) return node.data.label;
    if (isCarryForwardNode(node)) return node.data.label;
    if (isFieldNode(node)) return node.data.label;
    return (node as any).type;
};
/**
 * Get the mood tier based on current mood value
 */
export const getMoodTier = (moodValue: number, tiers: MoodTier[]): MoodTier | null => {
    if (!tiers || tiers.length === 0) return null;

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
export const selectWeightedTag = (tags: MoodTag[]): string | null => {
    if (!tags || tags.length === 0) return null;

    let totalWeight = 0;
    for (const t of tags) {
        totalWeight += t.weight ?? 50;
    }

    if (totalWeight <= 0) return tags[0]?.tag || null;

    let random = Math.random() * totalWeight;
    for (const t of tags) {
        const weight = t.weight ?? 50;
        if (random < weight) {
            return t.tag;
        }
        random -= weight;
    }

    return tags[tags.length - 1].tag;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export interface ParentNodeConnection {
    node: AppNode;
    edgeId: string;
    sourceHandle: string | null;
}

/**
 * Get parent nodes (nodes that connect TO a specific node)
 */
export const getParentNodes = (
    nodeId: string,
    nodes: AppNode[],
    edges: AppEdge[]
): ParentNodeConnection[] => {
    const parentEdges = edges.filter((edge) => edge.target === nodeId);
    return parentEdges.map((edge) => {
        const parentNode = nodes.find((n) => n.id === edge.source);
        return parentNode ? { node: parentNode, edgeId: edge.id, sourceHandle: edge.sourceHandle || null } : null;
    }).filter((connection): connection is ParentNodeConnection => connection !== null);
};

/**
 * Get all inherited prompts from parent nodes (recursive)
 */
const processPrompt = (promptData: string | string[] | undefined): string => {
    if (Array.isArray(promptData)) {
        return promptData.filter(p => p && p.trim() !== '').join(', ');
    }
    return promptData || '';
};

export interface InheritedPromptsOptions {
    originalDisabledSources?: string[] | null;
    selectSinglePath?: boolean;
    randomize?: boolean;
    allowedEdges?: Set<string> | null;
}

export interface InheritedPromptResult {
    nodeId: string;
    nodeLabel: string;
    prompt: string;
    type: string;
}

export const getInheritedPrompts = (
    nodeId: string,
    allEvents: AppEvent[],
    nodes: AppNode[],
    edges: AppEdge[],
    visited: Set<string> = new Set<string>(),
    options: InheritedPromptsOptions = {}
): InheritedPromptResult[] => {
    const { originalDisabledSources = null, selectSinglePath = false, randomize = false, allowedEdges = null } = options;

    const node = nodes.find((n) => n.id === nodeId);
    if (!node || visited.has(nodeId)) return [];

    visited.add(nodeId);

    const disabledSources = originalDisabledSources !== null
        ? originalDisabledSources
        : (isEventNode(node) ? node.data.disabledInheritedSources || [] : []);

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

    let inheritedPrompts: InheritedPromptResult[] = [];

    for (const { node: parentNode } of parentNodes) {
        const parentInherited = getInheritedPrompts(parentNode.id, allEvents, nodes, edges, visited, {
            ...options,
            originalDisabledSources: disabledSources,
        });
        inheritedPrompts = [...inheritedPrompts, ...parentInherited];

        if (disabledSources.includes(parentNode.id)) continue;

        // Handle reference nodes
        if (isReferenceNode(parentNode) && parentNode.data.referenceId) {
            const referencedEvent = allEvents.find(e => e.id === parentNode.data.referenceId);
            if (referencedEvent && referencedEvent.nodes && referencedEvent.edges) {
                const refEndNode = referencedEvent.nodes.find(n => n.type === 'endNode');
                if (refEndNode) {
                    const refInherited = getInheritedPrompts(
                        refEndNode.id,
                        allEvents,
                        referencedEvent.nodes,
                        referencedEvent.edges,
                        new Set<string>(),
                        {
                            ...options,
                            originalDisabledSources: [],
                        }
                    );
                    inheritedPrompts = [...inheritedPrompts, ...refInherited];
                }
            }
        }

        if ((isEventNode(parentNode) || isCarryForwardNode(parentNode)) && parentNode.data.inheritedPrompt) {
            inheritedPrompts.push({
                nodeId: parentNode.id,
                nodeLabel: parentNode.data.label || 'Unknown',
                prompt: processPrompt(parentNode.data.inheritedPrompt),
                type: parentNode.type,
            });
        }

        if (isGroupNode(parentNode) && parentNode.data.fixedPrompt) {
            inheritedPrompts.push({
                nodeId: parentNode.id,
                nodeLabel: parentNode.data.label || 'Group',
                prompt: processPrompt(parentNode.data.fixedPrompt),
                type: 'groupNode',
            });
        }
    }

    return inheritedPrompts;
};;

export interface PromptPart {
    label: string;
    prompt: string;
    type: string;
    nodeId?: string;
}

export interface ComposedPromptResult {
    parts: PromptPart[];
    full: string;
}

export interface ComposedPromptOptions {
    globalPrependPrompt?: string;
    globalAppendPrompt?: string;
    incomingContextParts?: PromptPart[];
    resolveReferences?: boolean;
    randomize?: boolean;
    moodTag?: string | null;
    allowedEdges?: Set<string> | null;
}

export interface NodeSimulationResult {
    id: string;
    originalId: string;
    label: string;
    type: string;
    prompt: string;
    parts: PromptPart[];
    mood: number;
    moodTag: string | null;
    fieldId: string | null;
}

export interface SimulationContext {
    allEvents: AppEvent[];
    processedNodes: AppNode[];
    currentEdges: AppEdge[];
    currentEventFixedPrompt: string;
    visitedEdgeIds: Set<string>;
    incomingContextParts: PromptPart[];
    moodConfig: MoodConfig | null;
    currentMood: number | null;
    containingFieldId: string | null;
    globalPrependPrompt: string;
    globalAppendPrompt: string;
    visitedEventIds: Set<string>;
}

/**
 * Get the fully composed prompt for a node
 */
export const getComposedPrompt = (
    nodeId: string,
    allEvents: AppEvent[],
    nodes: AppNode[],
    edges: AppEdge[],
    currentEventFixedPrompt: string = '',
    options: ComposedPromptOptions = {}
): ComposedPromptResult => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { parts: [], full: '' };

    const inheritedPrompts = getInheritedPrompts(nodeId, allEvents, nodes, edges, new Set<string>(), {
        selectSinglePath: !options.allowedEdges,
        randomize: options.randomize || false,
        allowedEdges: options.allowedEdges
    });

    const localPrompt = isEventNode(node) ? processPrompt(node.data.localPrompt) : '';
    const nodeInheritedPrompt = (isEventNode(node) || isCarryForwardNode(node)) 
        ? processPrompt(node.data.inheritedPrompt) 
        : '';

    const parts = [];

    // 1. Global Prepend
    if (options.globalPrependPrompt) {
        parts.push({ label: 'Global Prepend', prompt: options.globalPrependPrompt, type: 'global' });
    }

    // 2. Incoming Context (from parent events)
    if (options.incomingContextParts && options.incomingContextParts.length > 0) {
        parts.push(...options.incomingContextParts);
    }

    // 3. Event Fixed Prompt
    if (currentEventFixedPrompt) {
        parts.push({ label: 'Event Fixed Prompt', prompt: currentEventFixedPrompt, type: 'event' });
    }

    // 4. Inherited Prompts (within event)
    inheritedPrompts.forEach((item) => {
        parts.push({ label: `From: ${item.nodeLabel}`, prompt: item.prompt, type: item.type, nodeId: item.nodeId });
    });

    // 5. Reference Node Inner Prompts
    if (options.resolveReferences !== false && isReferenceNode(node) && node.data.referenceId) {
        const refEvent = allEvents.find(e => e.id === node.data.referenceId);
        if (refEvent && refEvent.nodes) {
            const refEndNode = refEvent.nodes.find(n => n.type === 'endNode');
            if (refEndNode) {
                const innerPrompts = getInheritedPrompts(
                    refEndNode.id,
                    allEvents,
                    refEvent.nodes,
                    refEvent.edges || [],
                    new Set<string>(),
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

    // 6. Local Prompt
    if (localPrompt) {
        parts.push({ label: 'This Event Only', prompt: localPrompt, type: 'local' });
    }

    // 7. Node Inherited Prompt (Carries Forward)
    if (nodeInheritedPrompt) {
        parts.push({ label: 'Carries Forward', prompt: nodeInheritedPrompt, type: 'inherited' });
    }

    // 8. Shot/Perspective
    if (isEventNode(node)) {
        const { usePerspective, cameraAbove, cameraBelow, cameraSide } = node.data;
        if (usePerspective) {
            parts.push({ label: 'Perspective', prompt: 'perspective', type: 'shot' });
        }

        if (cameraAbove && !cameraBelow) {
            parts.push({ label: 'Camera Above', prompt: '<from above$>', type: 'shot' });
        }

        if (cameraBelow && !cameraAbove) {
            parts.push({ label: 'Camera Below', prompt: '<from below$>', type: 'shot' });
        }

        if (cameraBelow && cameraAbove) {
            parts.push({ label: 'Camera Above or Below', prompt: '<from above$from below$>', type: 'shot' });
        }

        if (cameraSide) {
            parts.push({ label: 'Camera Side', prompt: '<from side$>', type: 'shot' });
        }
    }

    // 9. Mood Expression
    if (options.moodTag) {
        parts.push({ label: 'Mood Expression', prompt: options.moodTag, type: 'mood' });
    }

    // 10. Global Append
    if (options.globalAppendPrompt) {
        parts.push({ label: 'Global Append', prompt: options.globalAppendPrompt, type: 'global' });
    }

    const full = parts.map((p) => p.prompt).filter(Boolean).join(', ');

    return { parts, full };
};

// ============================================================================
// SIMULATION HELPER FUNCTIONS
// ============================================================================

/**
 * Process all Field Nodes upfront - compute containment and weighted selection
 * @returns {{ nodeToFieldMap: Map, unlockedByField: Set, fieldSettings: Map }}
 */
interface FieldProcessingResult {
    nodeToFieldMap: Map<string, string>;
    unlockedByField: Set<string>;
    fieldSettings: Map<string, { randomizeOrder: boolean }>;
}

const processFields = (nodes: AppNode[]): FieldProcessingResult => {
    const fieldNodes = nodes.filter(isFieldNode);
    const nodeToFieldMap = new Map<string, string>();  // Maps nodeId -> fieldNodeId
    const unlockedByField = new Set<string>(); // Selected node IDs
    const fieldSettings = new Map<string, { randomizeOrder: boolean }>();   // Maps fieldId -> { randomizeOrder }

    fieldNodes.forEach(field => {
        const fieldBounds = {
            x: field.position.x,
            y: field.position.y,
            width: field.width || field.style?.width || 400,
            height: field.height || field.style?.height || 300
        };

        // Find child nodes inside this field
        const childNodes = nodes.filter(node => {
            if (node.id === field.id || node.type === 'fieldNode') return false;
            const nodeX = node.position.x;
            const nodeY = node.position.y;
            return (
                nodeX >= fieldBounds.x && nodeX < fieldBounds.x + fieldBounds.width &&
                nodeY >= fieldBounds.y && nodeY < fieldBounds.y + fieldBounds.height
            );
        });

        // Map children to their field
        childNodes.forEach(node => nodeToFieldMap.set(node.id, field.id));

        if (childNodes.length === 0) return;

        // Store field settings
        const selectCount = field.data.selectCount ?? 1;
        const randomizeOrder = field.data.randomizeOrder ?? true;
        const childWeights = field.data.childWeights || {};
        fieldSettings.set(field.id, { randomizeOrder });

        // Select N unique children using dynamic cumulative weights
        const targetCount = Math.min(selectCount, childNodes.length);
        const availableNodes = [...childNodes];
        let selectedForThisFieldCount = 0;

        while (selectedForThisFieldCount < targetCount && availableNodes.length > 0) {
            let totalWeight = 0;
            for (const n of availableNodes) {
                totalWeight += childWeights[n.id] ?? 50;
            }

            if (totalWeight <= 0) {
                const idx = Math.floor(Math.random() * availableNodes.length);
                const selected = availableNodes[idx];
                if (!unlockedByField.has(selected.id)) {
                    unlockedByField.add(selected.id);
                    selectedForThisFieldCount++;
                }
                availableNodes.splice(idx, 1);
                continue;
            }

            let random = Math.random() * totalWeight;
            let selectedIdx = -1;
            for (let idx = 0; idx < availableNodes.length; idx++) {
                const weight = childWeights[availableNodes[idx].id] ?? 50;
                if (random < weight) {
                    selectedIdx = idx;
                    break;
                }
                random -= weight;
            }

            if (selectedIdx !== -1) {
                const selected = availableNodes[selectedIdx];
                if (!unlockedByField.has(selected.id)) {
                    unlockedByField.add(selected.id);
                    selectedForThisFieldCount++;
                }
                availableNodes.splice(selectedIdx, 1);
            }
        }

        console.log('[Field]', field.data.label, '→ selected', [...unlockedByField].filter(id => nodeToFieldMap.get(id) === field.id));
    });

    return { nodeToFieldMap, unlockedByField, fieldSettings };
};

/**
 * Shuffle consecutive results from fields with randomizeOrder enabled
 */
const shuffleFieldResults = (
    results: NodeSimulationResult[],
    fieldSettings: Map<string, { randomizeOrder: boolean }>
): void => {
    let i = 0;
    while (i < results.length) {
        const fieldId = results[i].fieldId;
        if (fieldId && fieldSettings.get(fieldId)?.randomizeOrder) {
            // Find run of consecutive results from this field
            let j = i + 1;
            while (j < results.length && results[j].fieldId === fieldId) j++;

            // Fisher-Yates shuffle for results[i..j-1]
            if (j - i > 1) {
                for (let k = j - 1; k > i; k--) {
                    const m = i + Math.floor(Math.random() * (k - i + 1));
                    [results[k], results[m]] = [results[m], results[k]];
                }
            }
            i = j;
        } else {
            i++;
        }
    }
};

/**
 * Build a result object for an event node
 */
const buildNodeResult = (
    node: AppNode,
    context: SimulationContext
): { result: NodeSimulationResult; newMood: number } => {
    const { allEvents, processedNodes, currentEdges, currentEventFixedPrompt,
        visitedEdgeIds, incomingContextParts, moodConfig, currentMood, containingFieldId,
        globalPrependPrompt, globalAppendPrompt } = context;

    let moodTag = null;
    let newMood: number = currentMood !== null ? currentMood : 0;

    // Apply mood change for event nodes
    if (moodConfig && moodConfig.tiers && moodConfig.tags && isEventNode(node) && !node.data.moodDisabled) {
        const moodMin = node.data.moodChangeMin || 0;
        const moodMax = node.data.moodChangeMax || 10;
        const moodChange = moodMin === moodMax
            ? moodMin
            : Math.floor(Math.random() * (moodMax - moodMin + 1)) + moodMin;
        newMood = clamp((currentMood || 0) + moodChange, -100, 100);

        const tier = getMoodTier(newMood, moodConfig.tiers);
        if (tier) {
            const tierTags = moodConfig.tags[tier.id] || [];
            moodTag = selectWeightedTag(tierTags);
        }
    }

    const { parts: finalParts, full } = getComposedPrompt(
        node.id, allEvents, processedNodes, currentEdges, currentEventFixedPrompt,
        {
            allowedEdges: visitedEdgeIds,
            randomize: false,
            resolveReferences: false,
            globalPrependPrompt,
            globalAppendPrompt,
            incomingContextParts,
            moodTag
        }
    );

    return {
        result: {
            id: `${node.id}-${Math.random().toString(36).substring(2, 11)}`,
            originalId: node.id,
            label: getNodeLabel(node),
            type: node.type,
            prompt: full,
            parts: finalParts,
            mood: newMood,
            moodTag,
            fieldId: containingFieldId || null
        },
        newMood
    };
};

/**
 * Apply input overrides to start nodes
 */
const applyInputOverrides = (
    nodes: AppNode[],
    inputOverrides: Record<string, boolean>
): AppNode[] => {
    if (!inputOverrides || Object.keys(inputOverrides).length === 0) return nodes;

    return nodes.map(node => {
        if (node.type !== 'startNode') return node;
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
    });
};

/**
 * Queue target nodes from edges
 */
const followEdges = (
    edges: AppEdge[],
    nodes: AppNode[],
    queue: AppNode[],
    visitedEdgeIds: Set<string>
): void => {
    edges.forEach(edge => {
        visitedEdgeIds.add(edge.id);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode) queue.push(targetNode);
    });
};

/**
 * Get selected edges based on node type (branch picks random, if evaluates condition, default follows all)
 */
const getSelectedEdges = (
    node: AppNode,
    outgoingEdges: AppEdge[],
    processedNodes: AppNode[]
): AppEdge[] => {
    if (node.type === 'branchNode') {
        if (outgoingEdges.length === 0) return [];
        const uniqueHandles = [...new Set(outgoingEdges.map(e => e.sourceHandle))];
        const randomHandle = uniqueHandles[Math.floor(Math.random() * uniqueHandles.length)];
        return outgoingEdges.filter(e => e.sourceHandle === randomHandle);
    }

    if (isIfNode(node)) {
        const startNode = processedNodes.find(isStartNode);
        const startInputs = startNode?.data.inputs || [];
        const conditionInputIds = node.data.conditionInputIds || [];

        const allEnabled = conditionInputIds.length > 0 && conditionInputIds.every(inputId => {
            const input = startInputs.find(i => i.id === inputId);
            return input?.enabled === true;
        });

        const selectedHandle = allEnabled ? 'true_output' : 'false_output';
        return outgoingEdges.filter(e => e.sourceHandle === selectedHandle);
    }

    return outgoingEdges; // Default: follow all edges
};

/**
 * Process a reference node by recursively simulating the referenced event
 * Returns { results: [], newMood } or null if reference should be skipped
 */
const processReferenceNode = (
    refNode: ReferenceNode,
    context: SimulationContext
): { results: NodeSimulationResult[]; newMood: number } | null => {
    const { allEvents, processedNodes, currentEdges, currentEventFixedPrompt,
        visitedEdgeIds, incomingContextParts, visitedEventIds, moodConfig, currentMood,
        globalPrependPrompt, globalAppendPrompt } = context;

    if (!refNode.data.referenceId || visitedEventIds.has(refNode.data.referenceId)) {
        return null; // Skip if no reference or already visited
    }

    const refEvent = allEvents.find(e => e.id === refNode.data.referenceId);
    if (!refEvent?.nodes) return null;

    // Get context parts from current position
    const { parts: refPromptParts } = getComposedPrompt(
        refNode.id, allEvents, processedNodes, currentEdges, currentEventFixedPrompt,
        {
            allowedEdges: visitedEdgeIds,
            randomize: false,
            resolveReferences: false
        }
    );

    const newContextParts = [...incomingContextParts, ...refPromptParts];

    // Inject carry-forward text from the reference node
    if (refNode.data.carryForwardText?.trim()) {
        newContextParts.push({
            label: `Carry Forward (→ ${refNode.data.referenceName || 'Ref'})`,
            prompt: refNode.data.carryForwardText.trim(),
            type: 'inherited',
            nodeId: refNode.id,
        });
    }

    const newVisitedEvents = new Set(visitedEventIds).add(refNode.data.referenceId);

    // Deep clone and apply input overrides
    const nodesToSimulate = refEvent.nodes.map(n => ({ ...n, data: { ...n.data } })) as AppNode[];
    
    const overrides = refNode.data.inputOverrides || {};
    const startNode = nodesToSimulate.find(isStartNode);

    if (startNode?.data.inputs) {
        startNode.data.inputs = startNode.data.inputs.map(input => ({
            ...input,
            enabled: overrides.hasOwnProperty(input.id) ? overrides[input.id] : input.enabled
        }));
    }

    // Recursively simulate
    const innerResults = simulateEvent(
        allEvents, nodesToSimulate, refEvent.edges || [], refEvent.fixedPrompt || '',
        newContextParts, newVisitedEvents, {}, moodConfig, currentMood,
        globalPrependPrompt, globalAppendPrompt
    );

    // Get updated mood from inner simulation
    const newMood = innerResults.length > 0 && innerResults[innerResults.length - 1].mood !== undefined
        ? innerResults[innerResults.length - 1].mood
        : (currentMood !== null ? currentMood : 0);

    return { results: innerResults, newMood };
};

/**
 * Simulate an event flow and return an array of resulting prompts
 */
export const simulateEvent = (
    allEvents: AppEvent[],
    currentNodes: AppNode[],
    currentEdges: AppEdge[],
    contextFixedPrompt: string = '',
    incomingContextParts: PromptPart[] = [],
    visitedEventIds: Set<string> = new Set<string>(),
    inputOverrides: Record<string, boolean> = {},
    moodConfig: MoodConfig | null = null,
    incomingMood: number | null = null,
    globalPrependPrompt: string = '',
    globalAppendPrompt: string = ''
): NodeSimulationResult[] => {
    let currentEventFixedPrompt = contextFixedPrompt;

    // Phase 0: Apply input overrides to start nodes
    const processedNodes = applyInputOverrides(currentNodes, inputOverrides);

    const startNodes = processedNodes.filter(n => n.type === 'startNode');

    if (startNodes.length === 0) return [];

    // Phase 1: Process Field Nodes upfront (spatial containers with weighted selection)
    const { nodeToFieldMap, unlockedByField, fieldSettings } = processFields(processedNodes);

    startNodes.sort((a, b) => a.position.y - b.position.y);
    const results: NodeSimulationResult[] = [];
    const visitedNodeIds = new Set<string>();
    const visitedEdgeIds = new Set<string>();
    const queue: AppNode[] = [...startNodes];
    // Initialize mood state
    let currentMood: number | null = incomingMood;
    if (currentMood === null && moodConfig) {
        const { min, max } = moodConfig.initialMoodRange || { min: -20, max: 20 };
        currentMood = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log('[Simulation] Initialized mood:', currentMood);
    }

    while (queue.length > 0) {
        const currentNode = queue.shift();
        if (!currentNode) continue;
        if (visitedNodeIds.has(currentNode.id)) continue;

        // Check if this node is inside a field and hasn't been unlocked by field selection
        // Instead of skipping entirely, we flag it - blocked nodes still traverse edges but don't appear in results
        const containingFieldId = nodeToFieldMap.get(currentNode.id);
        const isBlockedByField = containingFieldId && !unlockedByField.has(currentNode.id);

        if (isBlockedByField) {
            console.log('[Simulation] Node blocked by field (will traverse but not output):', currentNode.id, currentNode.data?.label);
        }

        visitedNodeIds.add(currentNode.id);

        // Phase 2: Handle reference nodes (recursive simulation)
        if (currentNode.type === 'referenceNode') {
            if (!isBlockedByField) {
                const refResult = processReferenceNode(currentNode, {
                    allEvents, processedNodes, currentEdges, currentEventFixedPrompt,
                    visitedEdgeIds, incomingContextParts, visitedEventIds, moodConfig, currentMood,
                    containingFieldId: containingFieldId || null,
                    globalPrependPrompt, globalAppendPrompt
                });
                if (refResult) {
                    currentMood = refResult.newMood;
                    results.push(...refResult.results);
                }
            }
        }
        // Phase 3: Build result for visible nodes

        else {
            const hiddenTypes = ['startNode', 'endNode', 'branchNode', 'referenceNode', 'ifNode', 'carryForwardNode', 'fieldNode'];
            if (!hiddenTypes.includes(currentNode.type) && !isBlockedByField) {
                // if (!isBlockedByField) {
                const { result, newMood } = buildNodeResult(currentNode, {
                    allEvents, processedNodes, currentEdges, currentEventFixedPrompt,
                    visitedEdgeIds, incomingContextParts, visitedEventIds, moodConfig, currentMood, containingFieldId: containingFieldId || null,
                    globalPrependPrompt, globalAppendPrompt
                });
                currentMood = newMood;
                results.push(result);
            }
        }

        if (currentNode.type === 'endNode') continue;

        // Phase 4: Follow edges to next nodes
        const outgoingEdges = currentEdges.filter(e => e.source === currentNode.id);
        const selectedEdges = getSelectedEdges(currentNode, outgoingEdges, processedNodes);
        followEdges(selectedEdges, processedNodes, queue, visitedEdgeIds);
    }

    // Phase 5: Post-processing - shuffle field results if enabled
    shuffleFieldResults(results, fieldSettings);

    return results;
};
