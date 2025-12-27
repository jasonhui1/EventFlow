import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import * as sim from '../utils/simulationUtils';

// Default node templates
const createEventNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'eventNode',
    position,
    data: {
        label: data.label || 'New Event',
        content: data.content || '',
        localPrompt: data.localPrompt || '', // Only for this event
        inheritedPrompt: data.inheritedPrompt || '', // Carries to future nodes
        usePerspective: data.usePerspective || true, // Add perspective/foreshortening
        disabledInheritedSources: data.disabledInheritedSources || [], // Node IDs to ignore inherited prompts from
        inputs: data.inputs || [{ id: 'trigger', label: 'Trigger' }],
        outputs: data.outputs || [{ id: 'next', label: 'Next' }],
        ...data,
    },
});

const createGroupNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'groupNode',
    position,
    data: {
        label: data.label || 'Event Group',
        fixedPrompt: data.fixedPrompt || '',
        inputs: data.inputs || [{ id: 'start', label: 'Start' }],
        outputs: data.outputs || [{ id: 'end', label: 'End' }],
        ...data,
    },
});

const createBranchNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'branchNode',
    position,
    data: {
        label: data.label || 'Branch',
        condition: data.condition || '',
        inputs: data.inputs || [{ id: 'input', label: 'Input' }],
        outputs: data.outputs || [
            { id: 'branch_a', label: 'Branch A', weight: 50 },
            { id: 'branch_b', label: 'Branch B', weight: 50 },
        ],
        ...data,
    },
});

const createReferenceNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'referenceNode',
    position,
    data: {
        label: data.label || 'Event Reference',
        referenceId: data.referenceId || null,
        referenceName: data.referenceName || 'Select Event...',
        inputs: data.inputs || [{ id: 'trigger', label: 'Trigger' }],
        outputs: data.outputs || [{ id: 'next', label: 'Next' }],
        ...data,
    },
});

const createStartNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'startNode',
    position,
    data: {
        label: data.label || 'Start Flow',
        outputs: [{ id: 'start_output', label: 'Start' }],
        ...data,
    },
});

const createEndNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'endNode',
    position,
    data: {
        label: data.label || 'End Flow',
        inputs: [{ id: 'end_input', label: 'End' }],
        ...data,
    },
});

// Initial demo event
const createInitialEvent = () => ({
    id: uuidv4(),
    name: 'Date Event',
    description: 'A romantic date sequence',
    fixedPrompt: 'casual outfit, sunny day, happy expression',
    nodes: [
        createStartNode({ x: 50, y: 150 }),
        createEndNode({ x: 600, y: 150 })
    ],
    edges: [],
    costumes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

const useStore = create(
    persist(
        (set, get) => ({
            // Events library
            events: [createInitialEvent()],
            currentEventId: null,

            // React Flow state
            nodes: [],
            edges: [],

            // Selected node for properties panel
            selectedNode: null,

            // Context menu state
            contextMenu: null,

            // Session-based confirmation flags (not persisted)
            sessionConfirmDelete: false,
            setSessionConfirmDelete: (value) => set({ sessionConfirmDelete: value }),
            sessionConfirmDeleteNode: false,
            setSessionConfirmDeleteNode: (value) => set({ sessionConfirmDeleteNode: value }),

            // Undo/Redo history
            history: [],
            historyIndex: -1,
            maxHistoryLength: 50,

            // Clipboard for copy/paste
            clipboard: null,

            // Push current state to history
            pushToHistory: () => {
                const state = get();
                const snapshot = {
                    nodes: JSON.parse(JSON.stringify(state.nodes)),
                    edges: JSON.parse(JSON.stringify(state.edges)),
                };

                // Remove any future states if we're not at the end
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push(snapshot);

                // Limit history length
                if (newHistory.length > state.maxHistoryLength) {
                    newHistory.shift();
                }

                set({
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                });
            },

            // Undo action
            undo: () => {
                const state = get();
                if (state.historyIndex > 0) {
                    const prevState = state.history[state.historyIndex - 1];
                    set({
                        nodes: prevState.nodes,
                        edges: prevState.edges,
                        historyIndex: state.historyIndex - 1,
                        selectedNode: null,
                    });
                }
            },

            // Redo action
            redo: () => {
                const state = get();
                if (state.historyIndex < state.history.length - 1) {
                    const nextState = state.history[state.historyIndex + 1];
                    set({
                        nodes: nextState.nodes,
                        edges: nextState.edges,
                        historyIndex: state.historyIndex + 1,
                        selectedNode: null,
                    });
                }
            },

            // Copy selected nodes to clipboard
            copySelectedNodes: () => {
                const state = get();
                const selectedNodes = state.nodes.filter(n => n.selected);
                if (selectedNodes.length === 0) return;

                const selectedNodeIds = selectedNodes.map(n => n.id);
                const relatedEdges = state.edges.filter(
                    e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
                );

                set({
                    clipboard: {
                        nodes: JSON.parse(JSON.stringify(selectedNodes)),
                        edges: JSON.parse(JSON.stringify(relatedEdges)),
                    },
                });
            },

            // Paste nodes from clipboard
            pasteNodes: (offset = { x: 50, y: 50 }) => {
                const state = get();
                if (!state.clipboard) return;

                state.pushToHistory();

                const idMap = {};
                const newNodes = state.clipboard.nodes.map(node => {
                    const newId = uuidv4();
                    idMap[node.id] = newId;
                    return {
                        ...node,
                        id: newId,
                        position: {
                            x: node.position.x + offset.x,
                            y: node.position.y + offset.y,
                        },
                        selected: true,
                        data: { ...node.data },
                    };
                });

                const newEdges = state.clipboard.edges.map(edge => ({
                    ...edge,
                    id: `edge_${uuidv4()}`,
                    source: idMap[edge.source],
                    target: idMap[edge.target],
                }));

                // Deselect existing nodes
                const updatedNodes = state.nodes.map(n => ({ ...n, selected: false }));

                set({
                    nodes: [...updatedNodes, ...newNodes],
                    edges: [...state.edges, ...newEdges],
                });
            },

            // Event Actions
            addEvent: (name = 'New Event') => {
                const newEvent = {
                    id: uuidv4(),
                    name,
                    description: '',
                    fixedPrompt: '',
                    nodes: [
                        createStartNode({ x: 50, y: 150 }),
                        createEndNode({ x: 600, y: 150 })
                    ],
                    edges: [],
                    costumes: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    events: [...state.events, newEvent],
                    currentEventId: newEvent.id,
                    nodes: newEvent.nodes,
                    edges: [],
                }));
                return newEvent.id;
            },

            deleteEvent: (eventId) => {
                set((state) => {
                    const newEvents = state.events.filter((e) => e.id !== eventId);
                    const newCurrentId = state.currentEventId === eventId
                        ? (newEvents[0]?.id || null)
                        : state.currentEventId;

                    const currentEvent = newEvents.find((e) => e.id === newCurrentId);
                    return {
                        events: newEvents,
                        currentEventId: newCurrentId,
                        nodes: currentEvent?.nodes || [],
                        edges: currentEvent?.edges || [],
                    };
                });
            },

            selectEvent: (eventId) => {
                const state = get();
                // Save current event first
                if (state.currentEventId) {
                    state.saveCurrentEvent();
                }

                // Skip if already selected and loaded
                if (state.currentEventId === eventId && state.nodes.length > 0) {
                    return;
                }

                // Load selected event
                const event = state.events.find((e) => e.id === eventId);
                if (event) {
                    set({
                        currentEventId: eventId,
                        nodes: event.nodes || [],
                        edges: event.edges || [],
                        selectedNode: null,
                    });
                }
            },

            updateEventName: (eventId, name) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId ? { ...e, name, updatedAt: new Date().toISOString() } : e
                    ),
                }));
            },

            updateEventFixedPrompt: (eventId, fixedPrompt) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId ? { ...e, fixedPrompt, updatedAt: new Date().toISOString() } : e
                    ),
                }));
            },

            updateEventCostumes: (eventId, costumes) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId ? {
                            ...e, costumes: costumes.map(c =>
                                typeof c === 'string' ? { name: c, weight: 1 } : c
                            ), updatedAt: new Date().toISOString()
                        } : e
                    ),
                }));
            },

            updateCostumeWeight: (eventId, costumeName, weight) => {
                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === eventId
                            ? {
                                ...e,
                                costumes: (e.costumes || []).map((c) =>
                                    c.name === costumeName ? { ...c, weight } : c
                                ),
                                updatedAt: new Date().toISOString(),
                            }
                            : e
                    ),
                }));
            },

            getCurrentEvent: () => {
                const state = get();
                return state.events.find((e) => e.id === state.currentEventId);
            },

            // Node Actions
            addNode: (type, position) => {
                let newNode;
                // Add initialFocus flag to new nodes so they can auto-focus their inputs
                const dataWithFocus = { initialFocus: true };

                switch (type) {
                    case 'eventNode':
                        newNode = createEventNode(position, dataWithFocus);
                        break;
                    case 'groupNode':
                        newNode = createGroupNode(position, dataWithFocus);
                        break;
                    case 'branchNode':
                        newNode = createBranchNode(position, dataWithFocus);
                        break;
                    case 'referenceNode':
                        newNode = createReferenceNode(position, dataWithFocus);
                        break;
                    case 'startNode':
                        newNode = createStartNode(position, dataWithFocus);
                        break;
                    case 'endNode':
                        newNode = createEndNode(position, dataWithFocus);
                        break;
                    default:
                        newNode = createEventNode(position, dataWithFocus);
                }
                set((state) => ({ nodes: [...state.nodes, newNode] }));
                return newNode.id;
            },

            insertNodeOnEdge: (type, position, edgeId, nodeId = null) => {
                const state = get();
                const edge = state.edges.find((e) => e.id === edgeId);
                if (!edge) return null;

                let targetNodeId = nodeId;
                if (!targetNodeId) {
                    targetNodeId = state.addNode(type, position);
                }

                const targetNode = get().nodes.find(n => n.id === targetNodeId);

                // Create new edges
                const edge1 = {
                    id: `edge_${uuidv4()}`,
                    source: edge.source,
                    sourceHandle: edge.sourceHandle,
                    target: targetNodeId,
                    targetHandle: targetNode.data?.inputs?.[0]?.id || null,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#C9B5FF', strokeWidth: 2 },
                };

                const edge2 = {
                    id: `edge_${uuidv4()}`,
                    source: targetNodeId,
                    sourceHandle: targetNode.data?.outputs?.[0]?.id || null,
                    target: edge.target,
                    targetHandle: edge.targetHandle,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#C9B5FF', strokeWidth: 2 },
                };

                set((state) => ({
                    edges: [
                        ...state.edges.filter((e) => e.id !== edgeId), // Remove old edge
                        edge1,
                        edge2,
                    ],
                }));

                return targetNodeId;
            },

            extractNodeFromFlow: (nodeId) => {
                const state = get();
                const { edges } = state._getBridgedState([nodeId]);
                set({ edges });
            },

            extractAndDeleteNodes: (nodeIds) => {
                const state = get();
                const { nodes, edges } = state._getBridgedState(nodeIds);
                set({
                    nodes,
                    edges,
                    selectedNode: nodeIds.includes(state.selectedNode?.id) ? null : state.selectedNode,
                });
            },

            // Internal helper to calculate bridged state without committing to store
            _getBridgedState: (nodeIds) => {
                const state = get();
                let currentEdges = [...state.edges];

                nodeIds.forEach(nodeId => {
                    const incomingEdges = currentEdges.filter(e => e.target === nodeId);
                    const outgoingEdges = currentEdges.filter(e => e.source === nodeId);

                    incomingEdges.forEach(inEdge => {
                        outgoingEdges.forEach(outEdge => {
                            const exists = currentEdges.some(e =>
                                e.source === inEdge.source &&
                                e.target === outEdge.target &&
                                e.sourceHandle === inEdge.sourceHandle &&
                                e.targetHandle === outEdge.targetHandle
                            );

                            if (!exists) {
                                currentEdges.push({
                                    id: `edge_${uuidv4()}`,
                                    source: inEdge.source,
                                    sourceHandle: inEdge.sourceHandle,
                                    target: outEdge.target,
                                    targetHandle: outEdge.targetHandle,
                                    type: 'smoothstep',
                                    animated: true,
                                    style: { stroke: '#C9B5FF', strokeWidth: 2 },
                                });
                            }
                        });
                    });

                    // Remove edges connected to this node
                    currentEdges = currentEdges.filter(e => e.source !== nodeId && e.target !== nodeId);
                });

                return {
                    nodes: state.nodes.filter(n => !nodeIds.includes(n.id)),
                    edges: currentEdges
                };
            },

            updateNode: (nodeId, data) => {
                set((state) => ({
                    nodes: state.nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, data: { ...node.data, ...data } }
                            : node
                    ),
                }));
            },

            deleteNode: (nodeId) => {
                set((state) => ({
                    nodes: state.nodes.filter((node) => node.id !== nodeId),
                    edges: state.edges.filter(
                        (edge) => edge.source !== nodeId && edge.target !== nodeId
                    ),
                    selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
                }));
            },

            // Delete multiple nodes at once
            deleteNodes: (nodeIds) => {
                set((state) => ({
                    nodes: state.nodes.filter((node) => !nodeIds.includes(node.id)),
                    edges: state.edges.filter(
                        (edge) => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
                    ),
                    selectedNode: nodeIds.includes(state.selectedNode?.id) ? null : state.selectedNode,
                }));
            },

            // Delete multiple edges at once
            deleteEdges: (edgeIds) => {
                set((state) => ({
                    edges: state.edges.filter((edge) => !edgeIds.includes(edge.id)),
                }));
            },

            addNodeOutput: (nodeId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        const newOutput = {
                            id: `output_${uuidv4().slice(0, 8)}`,
                            label: `Output ${node.data.outputs.length + 1}`,
                            weight: node.type === 'branchNode' ? 50 : undefined,
                        };
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                outputs: [...node.data.outputs, newOutput],
                            },
                        };
                    }),
                }));
            },

            addNodeInput: (nodeId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        const newInput = {
                            id: `input_${uuidv4().slice(0, 8)}`,
                            label: `Input ${node.data.inputs.length + 1}`,
                        };
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs: [...node.data.inputs, newInput],
                            },
                        };
                    }),
                }));
            },

            updateOutputWeight: (nodeId, outputId, weight) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                outputs: node.data.outputs.map((output) =>
                                    output.id === outputId ? { ...output, weight } : output
                                ),
                            },
                        };
                    }),
                }));
            },

            setSelectedNode: (node) => {
                set({ selectedNode: node });
            },

            // Edge Actions
            addEdge: (connection) => {
                const state = get();

                // Check for duplicates
                const exists = state.edges.some(
                    (edge) =>
                        edge.source === connection.source &&
                        edge.target === connection.target &&
                        (edge.sourceHandle === connection.sourceHandle || (!edge.sourceHandle && !connection.sourceHandle)) &&
                        (edge.targetHandle === connection.targetHandle || (!edge.targetHandle && !connection.targetHandle))
                );

                if (exists) {
                    console.log('Edge already exists, skipping.');
                    return;
                }

                const newEdge = {
                    id: `edge_${uuidv4()}`,
                    ...connection,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#C9B5FF', strokeWidth: 2 },
                };
                set((state) => ({ edges: [...state.edges, newEdge] }));
            },

            deleteEdge: (edgeId) => {
                set((state) => ({
                    edges: state.edges.filter((edge) => edge.id !== edgeId),
                }));
            },

            // React Flow callbacks
            onNodesChange: (changes) => {
                set((state) => {
                    const newNodes = [...state.nodes];
                    changes.forEach((change) => {
                        if (change.type === 'position' && change.position) {
                            const nodeIndex = newNodes.findIndex((n) => n.id === change.id);
                            if (nodeIndex !== -1) {
                                newNodes[nodeIndex] = {
                                    ...newNodes[nodeIndex],
                                    position: change.position,
                                };
                            }
                        } else if (change.type === 'remove') {
                            const nodeIndex = newNodes.findIndex((n) => n.id === change.id);
                            if (nodeIndex !== -1) {
                                newNodes.splice(nodeIndex, 1);
                            }
                        } else if (change.type === 'select') {
                            const nodeIndex = newNodes.findIndex((n) => n.id === change.id);
                            if (nodeIndex !== -1) {
                                newNodes[nodeIndex] = {
                                    ...newNodes[nodeIndex],
                                    selected: change.selected,
                                };
                                if (change.selected) {
                                    set({ selectedNode: newNodes[nodeIndex] });
                                }
                            }
                        }
                    });
                    return { nodes: newNodes };
                });
            },

            onEdgesChange: (changes) => {
                set((state) => {
                    let newEdges = [...state.edges];
                    changes.forEach((change) => {
                        if (change.type === 'remove') {
                            newEdges = newEdges.filter((e) => e.id !== change.id);
                        } else if (change.type === 'select') {
                            const edgeIndex = newEdges.findIndex((e) => e.id === change.id);
                            if (edgeIndex !== -1) {
                                newEdges[edgeIndex] = {
                                    ...newEdges[edgeIndex],
                                    selected: change.selected,
                                };
                            }
                        }
                    });
                    return { edges: newEdges };
                });
            },

            onConnect: (connection) => {
                get().addEdge(connection);
            },

            setNodes: (nodes) => set({ nodes }),
            setEdges: (edges) => set({ edges }),

            // Context Menu
            showContextMenu: (x, y, type = 'canvas') => {
                set({ contextMenu: { x, y, type } });
            },

            hideContextMenu: () => {
                set({ contextMenu: null });
            },

            // Auto-layout (simple horizontal layout)
            autoLayout: () => {
                set((state) => {
                    const SPACING_X = 280;
                    const SPACING_Y = 150;

                    // Create new node objects with updated positions (immutable)
                    const newNodes = state.nodes.map((node, index) => {
                        const col = index % 4;
                        const row = Math.floor(index / 4);
                        return {
                            ...node,
                            position: {
                                x: 100 + col * SPACING_X,
                                y: 100 + row * SPACING_Y,
                            },
                        };
                    });

                    return { nodes: newNodes };
                });
            },

            // Save current state to event
            saveCurrentEvent: () => {
                const state = get();
                if (!state.currentEventId) return;

                const currentEvent = state.events.find((e) => e.id === state.currentEventId);
                if (!currentEvent) return;

                // Reference Check: Only save if there's actually a difference to avoid loops
                if (
                    currentEvent.nodes === state.nodes &&
                    currentEvent.edges === state.edges
                ) {
                    return;
                }

                set((state) => ({
                    events: state.events.map((e) =>
                        e.id === state.currentEventId
                            ? {
                                ...e,
                                nodes: state.nodes,
                                edges: state.edges,
                                updatedAt: new Date().toISOString(),
                            }
                            : e
                    ),
                }));
            },

            // Export/Import
            exportEvents: () => {
                const state = get();
                // Save current state first
                state.saveCurrentEvent();

                return JSON.stringify({
                    events: state.events,
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                }, null, 2);
            },

            importEvents: (jsonString) => {
                try {
                    const data = JSON.parse(jsonString);
                    if (data.events && Array.isArray(data.events)) {
                        set({
                            events: data.events,
                            currentEventId: data.events[0]?.id || null,
                            nodes: data.events[0]?.nodes || [],
                            edges: data.events[0]?.edges || [],
                        });
                        return true;
                    }
                    return false;
                } catch (e) {
                    console.error('Import failed:', e);
                    return false;
                }
            },

            // ========================================
            // Prompt Inheritance System
            // ========================================

            // Get all parent nodes (nodes that connect TO this node)
            getParentNodes: (nodeId, context = null) => {
                const state = get();
                const nodes = context?.nodes || state.nodes;
                const edges = context?.edges || state.edges;
                return sim.getParentNodes(nodeId, nodes, edges);
            },

            // Get ALL upstream nodes recursively (for UI display)
            getAllUpstreamNodes: (nodeId, visited = new Set(), depth = 0, context = null) => {
                const state = get();
                if (visited.has(nodeId)) return [];
                visited.add(nodeId);

                const parentNodes = get().getParentNodes(nodeId, context);
                let allUpstream = [];

                for (const { node: parentNode } of parentNodes) {
                    // Add this parent if it's not a start flow node
                    if (parentNode.type !== 'startNode') {
                        const prompt = parentNode.data?.inheritedPrompt || parentNode.data?.fixedPrompt || '';
                        allUpstream.push({
                            nodeId: parentNode.id,
                            nodeLabel: parentNode.data?.label || 'Unknown',
                            nodeType: parentNode.type,
                            prompt: prompt,
                            depth: depth,
                        });
                    }

                    // Recursively get grandparents
                    const grandparents = get().getAllUpstreamNodes(parentNode.id, visited, depth + 1, context);
                    allUpstream = [...allUpstream, ...grandparents];
                }

                return allUpstream;
            },

            // Get all inherited prompts from parent nodes (recursive)
            getInheritedPrompts: (nodeId, visited = new Set(), options = {}) => {
                const state = get();
                const nodes = options.context?.nodes || state.nodes;
                const edges = options.context?.edges || state.edges;
                return sim.getInheritedPrompts(nodeId, state.events, nodes, edges, visited, options);
            },

            // Toggle whether to inherit from a specific source node
            toggleInheritedSource: (nodeId, sourceNodeId) => {
                set((state) => {
                    const updatedNodes = state.nodes.map((node) => {
                        if (node.id !== nodeId) return node;
                        const disabled = node.data.disabledInheritedSources || [];
                        const newDisabled = disabled.includes(sourceNodeId)
                            ? disabled.filter((id) => id !== sourceNodeId)
                            : [...disabled, sourceNodeId];
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                disabledInheritedSources: newDisabled,
                            },
                        };
                    });

                    // Also update selectedNode if it's the same node
                    const updatedSelectedNode = state.selectedNode?.id === nodeId
                        ? updatedNodes.find((n) => n.id === nodeId)
                        : state.selectedNode;

                    return {
                        nodes: updatedNodes,
                        selectedNode: updatedSelectedNode,
                    };
                });
            },

            // Get the fully composed prompt for a node
            getComposedPrompt: (nodeId, options = {}) => {
                const state = get();
                const nodes = options.context?.nodes || state.nodes;
                const edges = options.context?.edges || state.edges;
                const currentEvent = state.getCurrentEvent();
                const fixedPrompt = options.fixedPrompt || currentEvent?.fixedPrompt || '';

                return sim.getComposedPrompt(nodeId, state.events, nodes, edges, fixedPrompt, options);
            },

            // Simulation Logic (Graph Traversal)
            simulateEvent: (currentNodes, currentEdges, incomingContextParts = [], visitedEventIds = new Set()) => {
                const state = get();
                const currentEvent = state.getCurrentEvent();
                const fixedPrompt = currentEvent?.fixedPrompt || '';

                return sim.simulateEvent(state.events, currentNodes, currentEdges, fixedPrompt, incomingContextParts, visitedEventIds);
            },

            // Generate a test prompt, randomly selecting branches based on weights
            generateTestPrompt: (nodeId, randomize = true) => {
                const composed = get().getComposedPrompt(nodeId, { randomize });

                // For now, return the composed prompt
                // Branch selection would require more complex path tracing
                return {
                    ...composed,
                    randomSeed: randomize ? Math.random() : 0,
                };
            },
        }),
        {
            name: 'event-flow-storage',
            partialize: (state) => ({
                events: state.events,
                currentEventId: state.currentEventId,
                nodes: state.nodes,
                edges: state.edges,
            }),
            onRehydrate: () => {
                console.log('Rehydrating from localStorage...');
            },
        }
    )
);

// ========================================
// Reactive Auto-Save Subscription
// ========================================

let autoSaveTimeout;
useStore.subscribe((state, prevState) => {
    // Watch for Changes in nodes or edges
    if (state.nodes !== prevState.nodes || state.edges !== prevState.edges) {
        clearTimeout(autoSaveTimeout);
        // Debounce: Wait 1 second after last change before syncing to library
        autoSaveTimeout = setTimeout(() => {
            useStore.getState().saveCurrentEvent();
        }, 1000);
    }
});

export default useStore;
