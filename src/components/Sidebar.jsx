import React, { useState } from 'react';
import useStore from '../store/useStore';
import ConfirmModal from './ConfirmModal';

const Sidebar = () => {
    const events = useStore((state) => state.events);
    const currentEventId = useStore((state) => state.currentEventId);
    const addEvent = useStore((state) => state.addEvent);
    const selectEvent = useStore((state) => state.selectEvent);
    const deleteEvent = useStore((state) => state.deleteEvent);
    const duplicateEvent = useStore((state) => state.duplicateEvent);
    const sessionConfirmDelete = useStore((state) => state.sessionConfirmDelete);
    const setSessionConfirmDelete = useStore((state) => state.setSessionConfirmDelete);

    // Modal states
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [deleteEventModal, setDeleteEventModal] = useState(null); // { id, name }
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDeleteEvent = (eventId, eventName) => {
        if (sessionConfirmDelete) {
            // Already confirmed this session, just delete
            deleteEvent(eventId);
        } else {
            // Show confirmation modal
            setDeleteEventModal({ id: eventId, name: eventName });
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-title">Event Flow Writer</h1>
                <p className="sidebar-subtitle">Visual story builder</p>
            </div>

            <div className="sidebar-content">
                {/* Node Palette */}
                <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Node Types</h3>
                    <div className="node-palette">
                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'startNode')}
                        >
                            <div className="palette-node-icon" style={{ color: '#B5FFD9' }}>🚀</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">Start Node</div>
                                <div className="palette-node-desc">Begin flow</div>
                            </div>
                        </div>

                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'endNode')}
                        >
                            <div className="palette-node-icon" style={{ color: '#FFB5C5' }}>🏁</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">End Node</div>
                                <div className="palette-node-desc">End flow</div>
                            </div>
                        </div>

                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'eventNode')}
                        >
                            <div className="palette-node-icon event">📌</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">Event Node</div>
                                <div className="palette-node-desc">Single event/scene</div>
                            </div>
                        </div>

                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'groupNode')}
                        >
                            <div className="palette-node-icon group">📁</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">Group Node</div>
                                <div className="palette-node-desc">Fixed prompt container</div>
                            </div>
                        </div>

                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'branchNode')}
                        >
                            <div className="palette-node-icon branch">🔀</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">Branch Node</div>
                                <div className="palette-node-desc">Probability split</div>
                            </div>
                        </div>

                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'ifNode')}
                        >
                            <div className="palette-node-icon" style={{ borderColor: '#FFE4B5', color: '#FFE4B5' }}>❓</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">If Node</div>
                                <div className="palette-node-desc">Conditional branching</div>
                            </div>
                        </div>

                        <div
                            className="palette-node"
                            draggable
                            onDragStart={(e) => onDragStart(e, 'referenceNode')}
                        >
                            <div className="palette-node-icon" style={{ background: 'linear-gradient(135deg, #E5D4FF, #B5F5FF)' }}>🔗</div>
                            <div className="palette-node-info">
                                <div className="palette-node-name">Reference Node</div>
                                <div className="palette-node-desc">Reuse other events</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Library */}
                <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Event Library</h3>

                    <div className="sidebar-search">
                        <span className="sidebar-search-icon">🔍</span>
                        <input
                            type="text"
                            className="sidebar-search-input"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="event-library">
                        {filteredEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`event-item ${currentEventId === event.id ? 'active' : ''}`}
                                onClick={() => selectEvent(event.id)}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/reactflow', 'referenceNode');
                                    e.dataTransfer.setData('referenceId', event.id);
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                            >
                                <span className="event-item-name">{event.name}</span>
                                <div className="event-item-actions">
                                    <span className="event-item-count">{event.nodes?.length || 0}</span>
                                    <button
                                        className="event-action-btn duplicate"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            duplicateEvent(event.id);
                                        }}
                                        title="Duplicate Event"
                                    >
                                        ❐
                                    </button>
                                    {events.length > 1 && (
                                        <button
                                            className="event-action-btn delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteEvent(event.id, event.name);
                                            }}
                                            title="Delete Event"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <button
                            className="add-event-btn"
                            onClick={() => setShowNewEventModal(true)}
                        >
                            <span>+</span> New Event
                        </button>
                    </div>
                </div>

                {/* Tips */}
                <div className="sidebar-section">
                    <h3 className="sidebar-section-title">Quick Tips</h3>
                    <div style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: '1.6',
                    }}>
                        <p>• <strong>Drag</strong> nodes from palette to canvas</p>
                        <p>• <strong>Connect</strong> outputs to inputs</p>
                        <p>• <strong>Right-click</strong> canvas for quick actions</p>
                        <p>• <strong>Drag edge</strong> to empty space for new node</p>
                        <p>• <strong>Box select</strong> by dragging on canvas</p>
                        <p>• <strong>Middle mouse</strong> to pan canvas</p>
                        <p>• <strong>Delete key</strong> to remove selected</p>
                        <p>• <strong>Ctrl+C/V</strong> to copy/paste nodes</p>
                        <p>• <strong>Ctrl+D</strong> to duplicate nodes</p>
                        <p>• <strong>Ctrl+Z/Y</strong> to undo/redo</p>
                    </div>
                </div>
            </div>

            {/* New Event Modal */}
            <ConfirmModal
                isOpen={showNewEventModal}
                onClose={() => setShowNewEventModal(false)}
                onConfirm={(name) => {
                    addEvent(name);
                    setShowNewEventModal(false);
                }}
                title="New Event"
                message="Enter a name for the new event:"
                type="prompt"
                inputPlaceholder="Event name..."
                defaultValue="New Event"
                confirmText="Create"
            />

            {/* Delete Event Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteEventModal}
                onClose={() => setDeleteEventModal(null)}
                onConfirm={() => {
                    if (deleteEventModal) {
                        deleteEvent(deleteEventModal.id);
                        setDeleteEventModal(null);
                    }
                }}
                title="Delete Event"
                message={`Are you sure you want to delete "${deleteEventModal?.name}"? This cannot be undone.`}
                type="delete"
                confirmText="Delete"
                showDontAskAgain={true}
                onDontAskAgainChange={setSessionConfirmDelete}
            />
        </div>
    );
};

export default Sidebar;

