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

// Register custom node types
const nodeTypes = {
    eventNode: EventNode,
    groupNode: GroupNode,
    branchNode: BranchNode,
    referenceNode: ReferenceNode,
};

function App() {
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Store state
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const onNodesChange = useStore((state) => state.onNodesChange);
    const onEdgesChange = useStore((state) => state.onEdgesChange);
    const onConnect = useStore((state) => state.onConnect);
    const addNode = useStore((state) => state.addNode);
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
    const deleteEdges = useStore((state) => state.deleteEdges);
    const undo = useStore((state) => state.undo);
    const redo = useStore((state) => state.redo);
    const copySelectedNodes = useStore((state) => state.copySelectedNodes);
    const pasteNodes = useStore((state) => state.pasteNodes);
    const pushToHistory = useStore((state) => state.pushToHistory);

    // Select first event if none selected
    React.useEffect(() => {
        if (!currentEventId && events.length > 0) {
            selectEvent(events[0].id);
        }
    }, [currentEventId, events, selectEvent]);

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

            const nodeId = addNode(type, position);

            // If dropped from event library with referenceId
            const referenceId = event.dataTransfer.getData('referenceId');
            if (referenceId && type === 'referenceNode') {
                const event = events.find((e) => e.id === referenceId);
                if (event) {
                    updateNode(nodeId, {
                        referenceId,
                        referenceName: event.name,
                        label: `→ ${event.name}`,
                    });
                }
            }
        },
        [reactFlowInstance, addNode, updateNode, events]
    );

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
                    pushToHistory();
                    if (selectedNodeIds.length > 0) deleteNodes(selectedNodeIds);
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
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, edges, deleteNodes, deleteEdges, copySelectedNodes, pasteNodes, undo, redo, pushToHistory]);

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

    return (
        <div className="app-container">
            <Sidebar />

            <div
                className="canvas-container"
                onMouseDownCapture={onMouseDownCapture}
            >
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

                    <div className="canvas-actions">
                        <button className="action-btn" onClick={autoLayout}>
                            ⚡ Auto Layout
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
                {currentEvent && (
                    <div style={{
                        padding: '12px 24px',
                        background: 'rgba(201, 181, 255, 0.05)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px',
                        }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                🎨 Event Fixed Prompt
                            </span>
                        </div>
                        <textarea
                            value={currentEvent.fixedPrompt || ''}
                            onChange={(e) => updateEventFixedPrompt(currentEventId, e.target.value)}
                            placeholder="Add a fixed prompt that applies to all nodes in this event (e.g., outfit, location, mood...)"
                            style={{
                                width: '100%',
                                minHeight: '40px',
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
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onPaneContextMenu={onPaneContextMenu}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onConnectEnd={onConnectEnd}
                        nodeTypes={nodeTypes}

                        // Disable node dragging when Alt is pressed to allow our custom drag
                        nodesDraggable={!isAltPressed}

                        selectionOnDrag
                        panOnDrag={[1, 2]}
                        selectionMode="partial"
                        fitView
                        snapToGrid
                        snapGrid={[15, 15]}
                        deleteKeyCode={null}
                        multiSelectionKeyCode={null}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: true,
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

            <PropertiesPanel />
        </div>
    );
}

export default App;
