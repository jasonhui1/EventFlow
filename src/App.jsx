import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useStore from './store/useStore';
import Sidebar from './components/Sidebar';
import PropertiesPanel from './components/PropertiesPanel';
import ContextMenu from './components/ContextMenu';
import EventNode from './components/nodes/EventNode';
import GroupNode from './components/nodes/GroupNode';
import BranchNode from './components/nodes/BranchNode';
import ReferenceNode from './components/nodes/ReferenceNode';
import StartNode from './components/nodes/StartNode';
import EndNode from './components/nodes/EndNode';
import IfNode from './components/nodes/IfNode';
import CarryForwardNode from './components/nodes/CarryForwardNode';
import FieldNode from './components/nodes/FieldNode';
import TabBar from './components/TabBar';

// Register custom node types
const nodeTypes = {
    eventNode: EventNode,
    groupNode: GroupNode,
    branchNode: BranchNode,
    referenceNode: ReferenceNode,
    startNode: StartNode,
    endNode: EndNode,
    ifNode: IfNode,
    carryForwardNode: CarryForwardNode,
    fieldNode: FieldNode,
};

import EventSimulationModal from './components/EventSimulationModal';
import BulkExportModal from './components/BulkExportModal';

function App() {

    const [costumeOptions, setCostumeOptions] = useState(['casual', ' school uniform']);
    const [showWeights, setShowWeights] = useState(false);
    const [isFixedPromptCollapsed, setIsFixedPromptCollapsed] = useState(false);
    const [isCostumesCollapsed, setIsCostumesCollapsed] = useState(true);
    const [isTopUICollapsed, setIsTopUICollapsed] = useState(true);


    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [showBulkExportModal, setShowBulkExportModal] = useState(false);

    // Store state
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const onNodesChange = useStore((state) => state.onNodesChange);
    const onEdgesChange = useStore((state) => state.onEdgesChange);
    const onConnect = useStore((state) => state.onConnect);
    const addNode = useStore((state) => state.addNode);
    const insertNodeOnEdge = useStore((state) => state.insertNodeOnEdge);
    const extractNodeFromFlow = useStore((state) => state.extractNodeFromFlow);
    const updateNode = useStore((state) => state.updateNode);
    const setSelectedNode = useStore((state) => state.setSelectedNode);
    const currentEventId = useStore((state) => state.currentEventId);
    const getCurrentEvent = useStore((state) => state.getCurrentEvent);
    const updateEventName = useStore((state) => state.updateEventName);
    const updateEventFixedPrompt = useStore((state) => state.updateEventFixedPrompt);
    const saveCurrentEvent = useStore((state) => state.saveCurrentEvent);
    const autoLayout = useStore((state) => state.autoLayout);
    const exportEvents = useStore((state) => state.exportEvents);
    const importEvents = useStore((state) => state.importEvents);
    const selectEvent = useStore((state) => state.selectEvent);
    const events = useStore((state) => state.events);
    const deleteNodes = useStore((state) => state.deleteNodes);
    const extractAndDeleteNodes = useStore((state) => state.extractAndDeleteNodes);
    const deleteEdges = useStore((state) => state.deleteEdges);
    const undo = useStore((state) => state.undo);
    const redo = useStore((state) => state.redo);
    const copySelectedNodes = useStore((state) => state.copySelectedNodes);
    const pasteNodes = useStore((state) => state.pasteNodes);
    const duplicateSelectedNodes = useStore((state) => state.duplicateSelectedNodes);
    const pushToHistory = useStore((state) => state.pushToHistory);
    const viewport = useStore((state) => state.viewport);
    const setViewport = useStore((state) => state.setViewport);

    // Select first event if none selected
    React.useEffect(() => {
        if (!currentEventId && events.length > 0) {
            selectEvent(events[0].id);
        }
    }, [currentEventId, events, selectEvent]);

    // Apply viewport when switching events
    React.useEffect(() => {
        if (reactFlowInstance && currentEventId) {
            if (viewport.x !== 0 || viewport.y !== 0 || viewport.zoom !== 1) {
                reactFlowInstance.setViewport(viewport);
            } else {
                reactFlowInstance.fitView();
            }
        }
    }, [currentEventId, reactFlowInstance]);

    const currentEvent = getCurrentEvent();


    // Handle drag and drop from sidebar
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type || !reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Check if dropped on an edge using element detection
            let targetEdgeId = null;

            const elements = document.elementsFromPoint(event.clientX, event.clientY);

            // Helper to check for edge in elements
            const findEdge = (els) => {
                for (const el of els) {
                    const edgeEl = el.closest('.react-flow__edge');
                    if (edgeEl) return edgeEl.getAttribute('data-id');
                }
                return null;
            };

            targetEdgeId = findEdge(elements);

            // If not found at exact cursor, check a small radius (simulating node size for new drops)
            if (!targetEdgeId) {
                const offsets = [
                    { x: -30, y: -20 }, { x: 30, y: -20 },
                    { x: -30, y: 20 }, { x: 30, y: 20 }
                ];
                for (const offset of offsets) {
                    const els = document.elementsFromPoint(event.clientX + offset.x, event.clientY + offset.y);
                    targetEdgeId = findEdge(els);
                    if (targetEdgeId) break;
                }
            }

            let nodeId;

            if (targetEdgeId) {
                console.log('Dropped on edge:', targetEdgeId);
                nodeId = insertNodeOnEdge(type, position, targetEdgeId);
            } else {
                nodeId = addNode(type, position);
            }

            // If dropped from event library with referenceId
            const referenceId = event.dataTransfer.getData('referenceId');
            if (referenceId && type === 'referenceNode') {
                const eventItem = events.find((e) => e.id === referenceId); // Renamed to avoid scoping conflict with event arg
                if (eventItem) {
                    updateNode(nodeId, {
                        referenceId,
                        referenceName: eventItem.name,
                        label: `→ ${eventItem.name}`,
                    });
                }
            }
        },
        [reactFlowInstance, addNode, insertNodeOnEdge, updateNode, events]
    );

    // Handle existing node dragged on an edge (insertion) or Ctrl+Drag (extraction)
    const onNodeDrag = useCallback((event, node) => {
        // If Ctrl is pressed, extract node from flow instantly
        if (event.ctrlKey || event.metaKey) {
            // Only extract if it has connections
            const hasConnections = edges.some(e => e.source === node.id || e.target === node.id);
            if (hasConnections) {
                console.log('Reactive extraction from flow:', node.id);
                // History is now handled automatically by extractNodeFromFlow
                extractNodeFromFlow(node.id);
            }
        }
    }, [extractNodeFromFlow, edges]);

    const onNodeDragStop = useCallback((event, node) => {
        // Check if dropped on an edge using element detection
        let targetEdgeId = null;
        // Helper to check for edge in elements
        const findEdge = (els) => {
            for (const el of els) {
                const edgeEl = el.closest('.react-flow__edge');
                if (edgeEl) return edgeEl.getAttribute('data-id');
            }
            return null;
        };

        // 1. Check mouse position first
        let elements = document.elementsFromPoint(event.clientX, event.clientY);
        targetEdgeId = findEdge(elements);

        // 2. If not found, check node corners/center based on actual node text
        if (!targetEdgeId) {
            const nodeEl = document.querySelector(`.react-flow__node[data-id="${node.id}"]`);
            if (nodeEl) {
                const rect = nodeEl.getBoundingClientRect();
                const checkPoints = [
                    { x: rect.left + 10, y: rect.top + 10 },
                    { x: rect.right - 10, y: rect.top + 10 },
                    { x: rect.left + 10, y: rect.bottom - 10 },
                    { x: rect.right - 10, y: rect.bottom - 10 },
                    { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                ];

                for (const point of checkPoints) {
                    elements = document.elementsFromPoint(point.x, point.y);
                    targetEdgeId = findEdge(elements);
                    if (targetEdgeId) break;
                }
            }
        }

        if (targetEdgeId) {
            insertNodeOnEdge(null, null, targetEdgeId, node.id);
        }
    }, [insertNodeOnEdge]);

    // Right-click context menu
    const onPaneContextMenu = useCallback((event) => {
        event.preventDefault();

        if (!reactFlowInstance) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            flowPosition: position,
        });
    }, [reactFlowInstance]);

    // Node selection
    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, [setSelectedNode]);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setContextMenu(null);
    }, [setSelectedNode]);

    // Handle edge drop to empty space - open context menu for new node
    const onConnectEnd = useCallback((event, connectionState) => {
        // In ReactFlow v12, check if there's no toNode (dropped on empty space)
        // and we have a fromNode (started from a valid handle)
        if (!connectionState.toNode && connectionState.fromNode && reactFlowInstance) {
            const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

            const position = reactFlowInstance.screenToFlowPosition({
                x: clientX,
                y: clientY,
            });

            setContextMenu({
                x: clientX,
                y: clientY,
                flowPosition: position,
                sourceNodeId: connectionState.fromNode.id,
                sourceHandle: connectionState.fromHandle?.id || connectionState.fromHandle,
            });
        }
    }, [reactFlowInstance]);

    // Keyboard handler for delete, copy, paste, undo, redo
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Don't handle if we're in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            // Delete selected nodes and edges
            if (event.key === 'Delete' || event.key === 'Backspace') {
                const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
                const selectedEdgeIds = edges.filter(e => e.selected).map(e => e.id);

                if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
                    event.preventDefault();
                    // History is now handled automatically by deleteNodes/deleteEdges/extractAndDeleteNodes

                    if (selectedNodeIds.length > 0) {
                        if (event.ctrlKey || event.metaKey) {
                            console.log('Ctrl+Delete: Extracting and deleting nodes:', selectedNodeIds);
                            extractAndDeleteNodes(selectedNodeIds);
                        } else {
                            deleteNodes(selectedNodeIds);
                        }
                    }

                    if (selectedEdgeIds.length > 0) deleteEdges(selectedEdgeIds);
                }
            }

            // Ctrl+C - Copy
            if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
                event.preventDefault();
                copySelectedNodes();
            }

            // Ctrl+V - Paste
            if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
                event.preventDefault();
                pasteNodes();
            }

            // Ctrl+Z - Undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
                event.preventDefault();
                redo();
            }

            // Ctrl+D - Duplicate
            if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
                event.preventDefault();
                duplicateSelectedNodes();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, deleteNodes, deleteEdges, copySelectedNodes, pasteNodes, undo, redo, extractAndDeleteNodes, duplicateSelectedNodes]);

    // Export handler
    const handleExport = () => {
        saveCurrentEvent();
        const data = exportEvents();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'event-flow-export.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Import handler
    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = importEvents(e.target.result);
                    if (!result) {
                        alert('Failed to import events');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    // Track Alt key state
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [tempConnection, setTempConnection] = useState(null);

    // Global Alt key listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Alt') setIsAltPressed(true);
        };
        const handleKeyUp = (e) => {
            if (e.key === 'Alt') setIsAltPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Handle Alt+Drag connection
    const onMouseDownCapture = useCallback((e) => {
        if (!isAltPressed) return;

        // Check if we clicked on a node
        const nodeElement = e.target.closest('.react-flow__node');
        if (!nodeElement) return;

        const nodeId = nodeElement.getAttribute('data-id');
        if (!nodeId) return;

        // Stop standard React Flow behavior (drag/select)
        e.stopPropagation();
        e.preventDefault();

        // Get start position (center of node)
        const rect = nodeElement.getBoundingClientRect();
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        setTempConnection({
            sourceId: nodeId,
            startX,
            startY,
            currentX: e.clientX,
            currentY: e.clientY
        });
    }, [isAltPressed]);

    // Handle mouse move for temp connection
    useEffect(() => {
        const onMouseMove = (e) => {
            if (!tempConnection) return;
            setTempConnection(prev => ({
                ...prev,
                currentX: e.clientX,
                currentY: e.clientY
            }));
        };

        const onMouseUp = (e) => {
            if (!tempConnection) return;

            // Check if dropped on a node
            const nodeElement = document.elementFromPoint(e.clientX, e.clientY)?.closest('.react-flow__node');
            if (nodeElement) {
                const targetId = nodeElement.getAttribute('data-id');

                // Validate connection
                if (targetId && targetId !== tempConnection.sourceId) {
                    // Find default handles
                    const sourceNode = nodes.find(n => n.id === tempConnection.sourceId);
                    const targetNode = nodes.find(n => n.id === targetId);

                    if (sourceNode && targetNode) {
                        // Default to first output and first input
                        const sourceHandle = sourceNode.data?.outputs?.[0]?.id || null;
                        const targetHandle = targetNode.data?.inputs?.[0]?.id || null;

                        onConnect({
                            source: tempConnection.sourceId,
                            sourceHandle: sourceHandle,
                            target: targetId,
                            targetHandle: targetHandle
                        });
                    }
                }
            } else {
                // Dropped on empty space - Open Context Menu
                if (reactFlowInstance) {
                    const sourceNode = nodes.find(n => n.id === tempConnection.sourceId);
                    const sourceHandle = sourceNode?.data?.outputs?.[0]?.id || null;

                    const position = reactFlowInstance.screenToFlowPosition({
                        x: e.clientX,
                        y: e.clientY,
                    });

                    setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        flowPosition: position,
                        sourceNodeId: tempConnection.sourceId,
                        sourceHandle: sourceHandle,
                    });
                }
            }

            setTempConnection(null);
        };

        if (tempConnection) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [tempConnection, nodes, onConnect, reactFlowInstance]);

    const isValidConnection = useCallback((connection) => {
        return connection.source !== connection.target;
    }, []);

    return (
        <div className="app-container">
            <Sidebar />

            <div
                className="canvas-container"
                onMouseDownCapture={onMouseDownCapture}
                onContextMenu={(e) => {
                    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
                    e.preventDefault();
                }}
            >
                {/* Canvas Tab Bar */}
                <TabBar />

                {/* Header with event info */}
                <div className="canvas-header">
                    <div className="canvas-title">
                        {currentEvent ? (
                            <>
                                <span style={{ fontSize: '20px' }}>📋</span>
                                <input
                                    type="text"
                                    value={currentEvent.name}
                                    onChange={(e) => updateEventName(currentEventId, e.target.value)}
                                    placeholder="Event name..."
                                />
                            </>
                        ) : (
                            <h2>Select or create an event</h2>
                        )}
                    </div>

                    {/* Top UI Collapse Toggle */}
                    <button
                        onClick={() => setIsTopUICollapsed(!isTopUICollapsed)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            transition: 'all 0.2s',
                        }}
                        title={isTopUICollapsed ? 'Expand UI' : 'Collapse UI'}
                    >
                        <span style={{
                            transition: 'transform 0.2s',
                            transform: isTopUICollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        }}>
                            ▼
                        </span>
                        {isTopUICollapsed ? 'Show Options' : 'Hide Options'}
                    </button>

                    <div className="canvas-actions">
                        <button className="action-btn" onClick={autoLayout}>
                            ⚡ Auto Layout
                        </button>
                        <button className="action-btn" onClick={() => setShowSimulationModal(true)} style={{ background: 'rgba(255, 181, 197, 0.1)', color: '#FFB5C5', border: '1px solid rgba(255, 181, 197, 0.3)' }}>
                            🔮 Simulate
                        </button>
                        <button className="action-btn" onClick={() => setShowBulkExportModal(true)} style={{ background: 'rgba(201, 181, 255, 0.1)', color: '#C9B5FF', border: '1px solid rgba(201, 181, 255, 0.3)' }}>
                            📤 Bulk Export
                        </button>
                        <button className="action-btn" onClick={handleImport}>
                            📥 Import
                        </button>
                        <button className="action-btn" onClick={handleExport}>
                            📤 Export
                        </button>
                        <button className="action-btn primary" onClick={saveCurrentEvent}>
                            💾 Save
                        </button>
                    </div>
                </div>

                {/* Fixed Prompt for current event */}
                {currentEvent && !isTopUICollapsed && (
                    <div style={{
                        padding: isFixedPromptCollapsed ? '8px 24px' : '12px 24px',
                        background: 'rgba(201, 181, 255, 0.05)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div
                            onClick={() => setIsFixedPromptCollapsed(!isFixedPromptCollapsed)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                userSelect: 'none',
                            }}
                        >
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.4)',
                                transition: 'transform 0.2s',
                                transform: isFixedPromptCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            }}>
                                ▼
                            </span>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                🎨 Event Fixed Prompt
                            </span>
                        </div>
                        {!isFixedPromptCollapsed && (
                            <textarea
                                value={currentEvent.fixedPrompt || ''}
                                onChange={(e) => updateEventFixedPrompt(currentEventId, e.target.value)}
                                placeholder="Add a fixed prompt that applies to all nodes in this event (e.g., outfit, location, mood...)"
                                style={{
                                    width: '100%',
                                    minHeight: '40px',
                                    marginTop: '8px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    resize: 'vertical',
                                }}
                            />
                        )}
                    </div>
                )}


                {/* Costume Selection */}
                {currentEvent && !isTopUICollapsed && (
                    <div className="costume-selection-container" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div
                            onClick={() => setIsCostumesCollapsed(!isCostumesCollapsed)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                marginBottom: isCostumesCollapsed ? 0 : '8px',
                            }}
                        >
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.4)',
                                transition: 'transform 0.2s',
                                transform: isCostumesCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            }}>
                                ▼
                            </span>
                            <div className="costume-label" style={{ marginBottom: 0 }}>
                                <span style={{ fontSize: '14px' }}>👗</span> COSTUMES:
                            </div>
                        </div>

                        {!isCostumesCollapsed && (
                            <>
                                <div className="costume-tags" style={{ marginLeft: '18px' }}>
                                    {costumeOptions.map(costume => {
                                        const currentCostumes = currentEvent.costumes || [];
                                        const isActive = currentCostumes.some(c => (typeof c === 'string' ? c : c.name) === costume);
                                        return (
                                            <button
                                                key={costume}
                                                className={`costume-tag ${isActive ? 'active' : ''}`}
                                                onClick={() => toggleCostume(costume)}
                                            >
                                                {costume}
                                            </button>
                                        );
                                    })}
                                </div>

                                {(currentEvent.costumes || []).length > 0 && (
                                    <button
                                        className={`weights-toggle-btn ${showWeights ? 'active' : ''}`}
                                        onClick={() => setShowWeights(!showWeights)}
                                        title="Configure Weights"
                                        style={{ marginLeft: '18px' }}
                                    >
                                        {showWeights ? '📊 Hide Weights' : '📊 Weights'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Costume Weight Configuration (Collapsible) */}
                {currentEvent && !isTopUICollapsed && !isCostumesCollapsed && showWeights && (currentEvent.costumes || []).length > 0 && (
                    <div className="costume-weights-panel">
                        <div className="weights-grid">
                            {(() => {
                                const currentCostumes = currentEvent.costumes || [];
                                const totalWeight = currentCostumes.reduce((sum, c) => sum + (c.weight || 0), 0);

                                return currentCostumes.map(costume => {
                                    const cName = typeof costume === 'string' ? costume : costume.name;
                                    const cWeight = typeof costume === 'string' ? 1 : (costume.weight ?? 1);
                                    const percentage = totalWeight > 0 ? Math.round((cWeight / totalWeight) * 100) : 0;

                                    return (
                                        <div key={cName} className="weight-item">
                                            <div className="weight-info">
                                                <span className="weight-name">{cName}</span>
                                                <span className="weight-value">Ratio: {cWeight} <span style={{ color: 'var(--pastel-blue)', opacity: 0.8 }}>({percentage}%)</span></span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.2"
                                                max="5"
                                                step="0.1"
                                                value={cWeight}
                                                onChange={(e) => updateCostumeWeight(currentEventId, cName, parseFloat(e.target.value))}
                                                className="weight-slider"
                                            />
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}

                {/* React Flow Canvas */}
                <div className="react-flow-wrapper" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        isValidConnection={isValidConnection}
                        onInit={(instance) => {
                            setReactFlowInstance(instance);
                            if (viewport.x !== 0 || viewport.y !== 0 || viewport.zoom !== 1) {
                                instance.setViewport(viewport);
                            } else {
                                instance.fitView();
                            }
                        }}
                        onMoveEnd={(event, vp) => {
                            setViewport(vp);
                        }}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeDrag={onNodeDrag}
                        onNodeDragStop={onNodeDragStop}
                        onPaneContextMenu={onPaneContextMenu}
                        onNodeContextMenu={(e) => { e.preventDefault(); }}
                        onEdgeContextMenu={(e) => { e.preventDefault(); }}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onConnectEnd={onConnectEnd}
                        nodeTypes={nodeTypes}

                        // Disable node dragging when Alt is pressed to allow our custom drag
                        nodesDraggable={!isAltPressed}

                        selectionOnDrag
                        panOnDrag={[1, 2]}
                        selectionMode="partial"
                        snapToGrid
                        snapGrid={[15, 15]}
                        deleteKeyCode={null}
                        multiSelectionKeyCode={null}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: true,
                            interactionWidth: 150, // Makes edge detection much easier
                            style: { stroke: '#C9B5FF', strokeWidth: 2 },
                        }}
                    >
                        <Controls
                            style={{
                                background: '#16213e',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        />
                        <MiniMap
                            style={{
                                background: '#16213e',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                            nodeColor={(node) => {
                                switch (node.type) {
                                    case 'eventNode': return '#FFB5C5';
                                    case 'groupNode': return '#B5D4FF';
                                    case 'branchNode': return '#FFCEB5';
                                    case 'referenceNode': return '#E5D4FF';
                                    case 'startNode': return '#B5FFD9';
                                    case 'endNode': return '#FFB5C5';
                                    case 'ifNode': return '#FFE4B5';
                                    default: return '#C9B5FF';
                                }
                            }}
                            maskColor="rgba(0,0,0,0.8)"
                        />
                        <Background
                            variant="dots"
                            gap={20}
                            size={1}
                            color="rgba(255,255,255,0.1)"
                        />
                    </ReactFlow>

                    {/* Temp Connection Line Overlay */}
                    {tempConnection && (
                        <svg
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 9999
                            }}
                        >
                            <line
                                x1={tempConnection.startX}
                                y1={tempConnection.startY}
                                x2={tempConnection.currentX}
                                y2={tempConnection.currentY}
                                stroke="#C9B5FF"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />
                            <circle cx={tempConnection.currentX} cy={tempConnection.currentY} r="4" fill="#C9B5FF" />
                        </svg>
                    )}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        flowPosition={contextMenu.flowPosition}
                        sourceNodeId={contextMenu.sourceNodeId}
                        sourceHandle={contextMenu.sourceHandle}
                        onClose={() => setContextMenu(null)}
                    />
                )}
            </div>

            {/* <PropertiesPanel /> */}

            {
                showSimulationModal && (
                    <EventSimulationModal onClose={() => setShowSimulationModal(false)} />
                )
            }

            {
                showBulkExportModal && (
                    <BulkExportModal onClose={() => setShowBulkExportModal(false)} />
                )
            }
        </div >
    );
}

export default App;
