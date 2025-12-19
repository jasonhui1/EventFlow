import React from 'react';
import useStore from '../store/useStore';

const ContextMenu = ({ x, y, flowPosition, sourceNodeId, sourceHandle, onClose }) => {
    const addNode = useStore((state) => state.addNode);
    const addEdge = useStore((state) => state.addEdge);
    const events = useStore((state) => state.events);
    const currentEventId = useStore((state) => state.currentEventId);
    const [searchTerm, setSearchTerm] = React.useState('');

    const availableEvents = events.filter(
        (e) => e.id !== currentEventId && e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNode = (type, referenceId = null) => {
        // Use flowPosition for correct placement at mouse position
        const position = flowPosition || { x: 0, y: 0 };
        const nodeId = addNode(type, position);

        // Auto-connect if opened from edge drop
        if (sourceNodeId && sourceHandle) {
            // Find the first input handle of the new node based on type
            let targetHandle = 'trigger';
            if (type === 'branchNode') {
                targetHandle = 'input';
            } else if (type === 'groupNode') {
                targetHandle = 'start';
            }

            addEdge({
                source: sourceNodeId,
                sourceHandle: sourceHandle,
                target: nodeId,
                targetHandle: targetHandle,
            });
        }

        if (referenceId) {
            const event = events.find((e) => e.id === referenceId);
            if (event) {
                useStore.getState().updateNode(nodeId, {
                    referenceId,
                    referenceName: event.name,
                    label: `→ ${event.name}`,
                });
            }
        }
        onClose();
    };

    // Determine if we're in edge-drop mode
    const isEdgeDropMode = !!(sourceNodeId && sourceHandle);

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999,
                }}
                onClick={onClose}
            />
            <div className="context-menu" style={{ left: x, top: y }}>
                <div className="context-menu-section">
                    {isEdgeDropMode ? '🔗 Connect to New Node' : 'Add Node'}
                </div>

                <div
                    className="context-menu-item"
                    onClick={() => handleAddNode('eventNode')}
                >
                    <span className="context-menu-item-icon">📌</span>
                    <span>Event Node</span>
                </div>

                <div
                    className="context-menu-item"
                    onClick={() => handleAddNode('groupNode')}
                >
                    <span className="context-menu-item-icon">📁</span>
                    <span>Group Node</span>
                </div>

                <div
                    className="context-menu-item"
                    onClick={() => handleAddNode('branchNode')}
                >
                    <span className="context-menu-item-icon">🔀</span>
                    <span>Branch Node</span>
                </div>

                <div className="context-menu-divider" />

                <div className="context-menu-section">Reference Event</div>

                <div className="context-menu-search">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="context-menu-events">
                    {availableEvents.length === 0 ? (
                        <div style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
                            No other events available
                        </div>
                    ) : (
                        availableEvents.map((event) => (
                            <div
                                key={event.id}
                                className="context-menu-item"
                                onClick={() => handleAddNode('referenceNode', event.id)}
                            >
                                <span className="context-menu-item-icon">🔗</span>
                                <span>{event.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default ContextMenu;

