import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import * as sim from '../utils/simulationUtils';

// Default node templates
const createEventNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'eventNode',
    position,
    width: 320,
    data: {
        label: data.label || 'New Event',
        content: data.content || '',
        localPrompt: data.localPrompt || [''], // Only for this event
        inheritedPrompt: data.inheritedPrompt || [''], // Carries to future nodes
        usePerspective: data.usePerspective || true, // Add perspective/foreshortening
        cameraAbove: data.cameraAbove || true, // Add perspective/foreshortening
        cameraBelow: data.cameraBelow || true, // Add perspective/foreshortening

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
        inputs: data.inputs || [], // Configurable inputs: [{ id, label, enabled }]
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

const createIfNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'ifNode',
    position,
    data: {
        label: data.label || 'If Condition',
        conditionInputIds: data.conditionInputIds || [], // Array of Start Node input IDs to check
        inputs: data.inputs || [{ id: 'input', label: 'Input' }],
        outputs: data.outputs || [
            { id: 'true_output', label: 'True' },
            { id: 'false_output', label: 'False' }
        ],
        ...data,
    },
});

const createCarryForwardNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'carryForwardNode',
    position,
    data: {
        label: data.label || 'Carry Forward',
        inheritedPrompt: data.inheritedPrompt || [''], // Use inheritedPrompt for data passing
        inputs: data.inputs || [{ id: 'trigger', label: 'Trigger' }],
        outputs: data.outputs || [{ id: 'next', label: 'Next' }],
        ...data,
    },
});

const createFieldNode = (position = { x: 0, y: 0 }, data = {}) => ({
    id: uuidv4(),
    type: 'fieldNode',
    position,
    style: {
        width: data.width || 400,
        height: data.height || 300,
    },
    data: {
        label: data.label || 'Field',
        selectCount: data.selectCount ?? 1, // Number of children to select
        randomizeOrder: data.randomizeOrder ?? true, // Whether to shuffle execution order
        childWeights: data.childWeights || {}, // Map of { childNodeId: weight }
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
            viewport: { x: 0, y: 0, zoom: 1 },
            setViewport: (viewport) => set({ viewport }),

            // Tab state for browser-like canvas tabs
            openTabs: [], // Array of { eventId, order }
            activeTabId: null,

            // Open a tab for an event (or focus if already open)
            openTab: (eventId) => {
                const state = get();
                const existingTab = state.openTabs.find(t => t.eventId === eventId);
                if (existingTab) {
                    // Already open, just activate
                    set({ activeTabId: eventId });
                } else {
                    // Add new tab
                    const newTab = { eventId, order: state.openTabs.length };
                    set({
                        openTabs: [...state.openTabs, newTab],
                        activeTabId: eventId,
                    });
                }
            },

            // Close a tab
            closeTab: (eventId) => {
                const state = get();
                const tabIndex = state.openTabs.findIndex(t => t.eventId === eventId);
                if (tabIndex === -1) return;

                const newTabs = state.openTabs.filter(t => t.eventId !== eventId);
                let newActiveId = state.activeTabId;

                // If closing active tab, switch to adjacent
                if (state.activeTabId === eventId) {
                    if (newTabs.length > 0) {
                        // Prefer tab to the left, or right if none
                        const newIndex = Math.min(tabIndex, newTabs.length - 1);
                        newActiveId = newTabs[newIndex].eventId;
                    } else {
                        newActiveId = null;
                    }
                }

                set({ openTabs: newTabs, activeTabId: newActiveId });

                // Switch to the new active event if there is one
                if (newActiveId && newActiveId !== state.currentEventId) {
                    get().selectEvent(newActiveId);
                }
            },

            // Set active tab (and switch to that event)
            setActiveTab: (eventId) => {
                const state = get();
                if (state.activeTabId === eventId) return;
                set({ activeTabId: eventId });
                state.selectEvent(eventId);
            },

            // Reorder tabs (for drag-and-drop support)
            reorderTabs: (fromIndex, toIndex) => {
                const state = get();
                const newTabs = [...state.openTabs];
                const [removed] = newTabs.splice(fromIndex, 1);
                newTabs.splice(toIndex, 0, removed);
                // Update order values
                newTabs.forEach((tab, idx) => tab.order = idx);
                set({ openTabs: newTabs });
            },

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
            isUndoRedo: false, // Flag to prevent recording undo/redo as new history

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
                        nodes: JSON.parse(JSON.stringify(prevState.nodes)),
                        edges: JSON.parse(JSON.stringify(prevState.edges)),
                        historyIndex: state.historyIndex - 1,
                        selectedNode: null,
                        isUndoRedo: true, // Signal subscription to skip this change
                    });
                }
            },

            // Redo action
            redo: () => {
                const state = get();
                if (state.historyIndex < state.history.length - 1) {
                    const nextState = state.history[state.historyIndex + 1];
                    set({
                        nodes: JSON.parse(JSON.stringify(nextState.nodes)),
                        edges: JSON.parse(JSON.stringify(nextState.edges)),
                        historyIndex: state.historyIndex + 1,
                        selectedNode: null,
                        isUndoRedo: true, // Signal subscription to skip this change
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

            // Duplicate selected nodes
            duplicateSelectedNodes: (offset = { x: 20, y: 20 }) => {
                const state = get();
                const selectedNodes = state.nodes.filter(n => n.selected);
                if (selectedNodes.length === 0) return;

                const idMap = {};
                const newNodes = selectedNodes.map(node => {
                    const newId = uuidv4();
                    idMap[node.id] = newId;
                    return {
                        ...JSON.parse(JSON.stringify(node)),
                        id: newId,
                        position: {
                            x: node.position.x + offset.x,
                            y: node.position.y + offset.y,
                        },
                        selected: true,
                        data: { ...node.data },
                    };
                });

                const selectedNodeIds = selectedNodes.map(n => n.id);
                // Duplicate edges only if both source and target are selected
                const internalEdges = state.edges.filter(
                    e => selectedNodeIds.includes(e.source) && selectedNodeIds.includes(e.target)
                );

                const newEdges = internalEdges.map(edge => ({
                    ...edge,
                    id: `edge_${uuidv4()}`,
                    source: idMap[edge.source],
                    target: idMap[edge.target],
                    selected: true,
                }));

                // Deselect existing
                const updatedNodes = state.nodes.map(n => ({ ...n, selected: false }));
                const updatedEdges = state.edges.map(e => ({ ...e, selected: false }));

                set({
                    nodes: [...updatedNodes, ...newNodes],
                    edges: [...updatedEdges, ...newEdges],
                    selectedNode: newNodes.length === 1 ? newNodes[0] : null
                });
            },

            // Event Actions
            addEvent: (name = 'New Event') => {
                const startNode = createStartNode({ x: 50, y: 50 });
                const event1 = createEventNode({ x: 400, y: 50 }, { label: 'Event 1' });
                const event2 = createEventNode({ x: 750, y: 50 }, { label: 'Event 2' });
                const event3 = createEventNode({ x: 1100, y: 50 }, { label: 'Event 3' });
                const event4 = createEventNode({ x: 1450, y: 50 }, { label: 'Event 4' });
                const endNode = createEndNode({ x: 1850, y: 850 });

                const nodes = [startNode, event1, event2, event3, event4, endNode];

                const edges = [
                    { id: `edge_${uuidv4()}`, source: startNode.id, sourceHandle: 'start_output', target: event1.id, targetHandle: 'trigger', type: 'smoothstep', animated: true, style: { stroke: '#C9B5FF', strokeWidth: 2 } },
                    { id: `edge_${uuidv4()}`, source: event1.id, sourceHandle: 'next', target: event2.id, targetHandle: 'trigger', type: 'smoothstep', animated: true, style: { stroke: '#C9B5FF', strokeWidth: 2 } },
                    { id: `edge_${uuidv4()}`, source: event2.id, sourceHandle: 'next', target: event3.id, targetHandle: 'trigger', type: 'smoothstep', animated: true, style: { stroke: '#C9B5FF', strokeWidth: 2 } },
                    { id: `edge_${uuidv4()}`, source: event3.id, sourceHandle: 'next', target: event4.id, targetHandle: 'trigger', type: 'smoothstep', animated: true, style: { stroke: '#C9B5FF', strokeWidth: 2 } },
                    { id: `edge_${uuidv4()}`, source: event4.id, sourceHandle: 'next', target: endNode.id, targetHandle: 'end_input', type: 'smoothstep', animated: true, style: { stroke: '#C9B5FF', strokeWidth: 2 } },
                ];

                const newEvent = {
                    id: uuidv4(),
                    name,
                    description: '',
                    fixedPrompt: '',
                    nodes,
                    edges,
                    costumes: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                set((state) => ({
                    events: [...state.events, newEvent],
                    currentEventId: newEvent.id,
                    nodes: newEvent.nodes,
                    edges: newEvent.edges,
                }));
                return newEvent.id;
            },

            duplicateEvent: (eventId) => {
                const state = get();
                const sourceEvent = state.events.find(e => e.id === eventId);
                if (!sourceEvent) return;

                const newEvent = {
                    ...JSON.parse(JSON.stringify(sourceEvent)),
                    id: uuidv4(),
                    name: `${sourceEvent.name} (Copy)`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                set((state) => ({
                    events: [...state.events, newEvent],
                    currentEventId: newEvent.id,
                    nodes: newEvent.nodes,
                    edges: newEvent.edges,
                }));
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
                    // Still open/activate the tab
                    state.openTab(eventId);
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
                    // Open/activate tab for this event
                    get().openTab(eventId);
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

            // Folder Actions
            folders: [],

            addFolder: (name = 'New Folder') => {
                const newFolder = {
                    id: uuidv4(),
                    name,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    folders: [...(state.folders || []), newFolder]
                }));
                return newFolder.id;
            },

            deleteFolder: (folderId) => {
                set((state) => ({
                    folders: (state.folders || []).filter(f => f.id !== folderId),
                    // Move events in this folder to root
                    events: state.events.map(e =>
                        e.folderId === folderId ? { ...e, folderId: null } : e
                    )
                }));
            },

            renameFolder: (folderId, newName) => {
                set((state) => ({
                    folders: (state.folders || []).map(f =>
                        f.id === folderId ? { ...f, name: newName } : f
                    )
                }));
            },

            moveEventToFolder: (eventId, folderId) => {
                set((state) => ({
                    events: state.events.map(e =>
                        e.id === eventId ? { ...e, folderId } : e
                    )
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
                    case 'ifNode':
                        newNode = createIfNode(position, dataWithFocus);
                        break;
                    case 'carryForwardNode':
                        newNode = createCarryForwardNode(position, dataWithFocus);
                        break;
                    case 'fieldNode':
                        newNode = createFieldNode(position, dataWithFocus);
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

            setNodeZIndex: (nodeId, zIndex) => {
                set((state) => ({
                    nodes: state.nodes.map((node) =>
                        node.id === nodeId
                            ? { ...node, zIndex }
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

            // Start Node input management
            addStartNodeInput: (nodeId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId || node.type !== 'startNode') return node;
                        const inputs = node.data.inputs || [];
                        const newInput = {
                            id: `input_${uuidv4().slice(0, 8)}`,
                            label: `Input ${inputs.length + 1}`,
                            enabled: true,
                        };
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs: [...inputs, newInput],
                            },
                        };
                    }),
                }));
            },

            removeStartNodeInput: (nodeId, inputId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId || node.type !== 'startNode') return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs: (node.data.inputs || []).filter(input => input.id !== inputId),
                            },
                        };
                    }),
                }));
            },

            toggleStartNodeInput: (nodeId, inputId) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId || node.type !== 'startNode') return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs: (node.data.inputs || []).map(input =>
                                    input.id === inputId ? { ...input, enabled: !input.enabled } : input
                                ),
                            },
                        };
                    }),
                }));
            },

            updateStartNodeInputLabel: (nodeId, inputId, label) => {
                set((state) => ({
                    nodes: state.nodes.map((node) => {
                        if (node.id !== nodeId || node.type !== 'startNode') return node;
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                inputs: (node.data.inputs || []).map(input =>
                                    input.id === inputId ? { ...input, label } : input
                                ),
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

                if (connection.source === connection.target) {
                    console.log('Self-connection is not allowed.');
                    return;
                }

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
                    // Side-effect: Track selected node
                    changes.forEach((change) => {
                        if (change.type === 'select' && change.selected) {
                            // We need to look up in the current state or the new state?
                            // applyNodeChanges hasn't run yet, so look in current state.
                            const node = state.nodes.find((n) => n.id === change.id);
                            if (node) {
                                // We can't update state inside set() directly if we are returning partial state.
                                // But selectedNode is part of the state.
                                // We can just include selectedNode in the return object?
                                // No, because we are iterating.
                                // Instead, we can't easily set state.selectedNode here inside the reduce/map.
                                // But since we are returning an object to merge, we can compute it.
                            }
                        }
                    });

                    // More robust selection handling:
                    const newNodes = applyNodeChanges(changes, state.nodes);

                    // Check if selected node changed
                    let newSelectedNode = state.selectedNode;
                    changes.forEach((change) => {
                        if (change.type === 'select') {
                            if (change.selected) {
                                newSelectedNode = newNodes.find((n) => n.id === change.id) || null;
                            } else if (state.selectedNode?.id === change.id) {
                                newSelectedNode = null;
                            }
                        }
                    });

                    return {
                        nodes: newNodes,
                        selectedNode: newSelectedNode
                    };
                });
            },

            onEdgesChange: (changes) => {
                set((state) => ({
                    edges: applyEdgeChanges(changes, state.edges),
                }));
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
            simulateEvent: (currentNodes, currentEdges, incomingContextParts = [], visitedEventIds = new Set(), inputOverrides = {}) => {
                const state = get();
                const currentEvent = state.getCurrentEvent();
                const fixedPrompt = currentEvent?.fixedPrompt || '';

                return sim.simulateEvent(state.events, currentNodes, currentEdges, fixedPrompt, incomingContextParts, visitedEventIds, inputOverrides);
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
                folders: state.folders,
                currentEventId: state.currentEventId,
                nodes: state.nodes,
                edges: state.edges,
                viewport: state.viewport,
                openTabs: state.openTabs,
                activeTabId: state.activeTabId,
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

// ========================================
// Reactive Undo/Redo History Subscription
// ========================================

let historyTimeout;
useStore.subscribe((state, prevState) => {
    // Skip if this was an undo/redo action
    if (state.isUndoRedo) {
        useStore.setState({ isUndoRedo: false });
        return;
    }

    // Only track changes to nodes or edges
    if (state.nodes !== prevState.nodes || state.edges !== prevState.edges) {
        clearTimeout(historyTimeout);
        // Debounce: Wait 500ms after last change to batch rapid edits
        historyTimeout = setTimeout(() => {
            pushHistorySnapshot();
        }, 500);
    }
});

function pushHistorySnapshot() {
    const state = useStore.getState();
    const snapshot = {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges)),
    };

    // Only add if different from the last snapshot
    const lastSnapshot = state.history[state.historyIndex];
    if (lastSnapshot &&
        JSON.stringify(lastSnapshot.nodes) === JSON.stringify(snapshot.nodes) &&
        JSON.stringify(lastSnapshot.edges) === JSON.stringify(snapshot.edges)) {
        return;
    }

    // Truncate any future history if we're not at the end (after undo)
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

    // Limit history length
    if (newHistory.length > state.maxHistoryLength) {
        newHistory.shift();
    }

    useStore.setState({
        history: newHistory,
        historyIndex: newHistory.length - 1,
    });
}

// Initialize history with current state on first load
function initializeHistory() {
    const state = useStore.getState();
    if (state.history.length === 0 && state.nodes.length > 0) {
        pushHistorySnapshot();
    }
}

// Call after a short delay to ensure rehydration is complete
setTimeout(initializeHistory, 100);

export default useStore;
