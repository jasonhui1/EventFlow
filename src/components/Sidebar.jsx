import React, { useState } from 'react';
import useStore from '../store/useStore';
import ConfirmModal from './ConfirmModal';

const Sidebar = () => {
    const events = useStore((state) => state.events);
    const folders = useStore((state) => state.folders);
    const currentEventId = useStore((state) => state.currentEventId);
    const addEvent = useStore((state) => state.addEvent);
    const selectEvent = useStore((state) => state.selectEvent);
    const deleteEvent = useStore((state) => state.deleteEvent);
    const duplicateEvent = useStore((state) => state.duplicateEvent);
    const sessionConfirmDelete = useStore((state) => state.sessionConfirmDelete);
    const setSessionConfirmDelete = useStore((state) => state.setSessionConfirmDelete);

    // Folder actions
    const addFolder = useStore((state) => state.addFolder);
    const deleteFolder = useStore((state) => state.deleteFolder);
    const renameFolder = useStore((state) => state.renameFolder);
    const moveEventToFolder = useStore((state) => state.moveEventToFolder);


    // Modal states
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [renameFolderModal, setRenameFolderModal] = useState(null); // { id, name }
    const [deleteEventModal, setDeleteEventModal] = useState(null); // { id, name }
    const [deleteFolderModal, setDeleteFolderModal] = useState(null); // { id, name }
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('library'); // 'nodes', 'library', 'tips'
    const [expandedFolders, setExpandedFolders] = useState({}); // { folderId: boolean }
    const [hoveredFolderId, setHoveredFolderId] = useState(null);

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    const filteredEvents = events.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onEventDragStart = (e, event) => {
        // console.log('Drag Start:', event.id);
        e.dataTransfer.setData('application/reactflow', 'referenceNode');
        e.dataTransfer.setData('referenceId', event.id);
        e.dataTransfer.setData('eventId', event.id); // For moving to folder
        e.dataTransfer.effectAllowed = 'move';
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

    // Drag and drop handlers for folders
    const onDragOverFolder = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Try stopping propagation
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
    };

    const onDragLeaveFolder = (e) => {
        e.currentTarget.style.background = 'transparent';
    };

    const onDropOnFolder = (e, folderId) => {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation
        e.currentTarget.style.background = 'transparent';
        const eventId = e.dataTransfer.getData('eventId');
        // console.log('Drop on folder:', folderId, 'Event:', eventId);
        if (eventId) {
            moveEventToFolder(eventId, folderId);
        }
    };

    const onDropOnRoot = (e) => {
        e.preventDefault();
        // Visual feedback reset if needed
        const eventId = e.dataTransfer.getData('eventId');
        // console.log('Drop on root:', eventId);
        if (eventId) {
            moveEventToFolder(eventId, null);
        }
    };

    // Group events by folder
    const eventsByFolder = {}; // { folderId: [events] }
    const rootEvents = [];

    filteredEvents.forEach(event => {
        if (event.folderId && folders.find(f => f.id === event.folderId)) {
            if (!eventsByFolder[event.folderId]) {
                eventsByFolder[event.folderId] = [];
            }
            eventsByFolder[event.folderId].push(event);
        } else {
            rootEvents.push(event);
        }
    });

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1 className="sidebar-title">Event Flow Writer</h1>
                <p className="sidebar-subtitle">Visual story builder</p>
            </div>

            <div className="sidebar-tabs">

                <button
                    className={`sidebar-tab ${activeTab === 'nodes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nodes')}
                    title="Node Palette"
                >
                    <span className="tab-icon">🧩</span>
                    <span className="tab-label">Nodes</span>
                </button>
                <button
                    className={`sidebar-tab ${activeTab === 'library' ? 'active' : ''}`}
                    onClick={() => setActiveTab('library')}
                    title="Event Library"
                >
                    <span className="tab-icon">📚</span>
                    <span className="tab-label">Library</span>
                </button>
                <button
                    className={`sidebar-tab ${activeTab === 'tips' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tips')}
                    title="Quick Tips"
                >
                    <span className="tab-icon">💡</span>
                    <span className="tab-label">Tips</span>
                </button>
            </div>

            <div className="sidebar-content">
                {/* Node Palette */}
                {activeTab === 'nodes' && (
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

                            <div
                                className="palette-node"
                                draggable
                                onDragStart={(e) => onDragStart(e, 'carryForwardNode')}
                            >
                                <div className="palette-node-icon" style={{ color: '#B5FFD9' }}>⏩</div>
                                <div className="palette-node-info">
                                    <div className="palette-node-name">Carry Forward</div>
                                    <div className="palette-node-desc">Pass prompt forward</div>
                                </div>
                            </div>

                            <div
                                className="palette-node"
                                draggable
                                onDragStart={(e) => onDragStart(e, 'fieldNode')}
                            >
                                <div className="palette-node-icon" style={{ color: '#B5F5FF', borderColor: '#B5F5FF' }}>🎲</div>
                                <div className="palette-node-info">
                                    <div className="palette-node-name">Field</div>
                                    <div className="palette-node-desc">Random selection region</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Library */}
                {activeTab === 'library' && (
                    <div className="sidebar-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="sidebar-section-title">Event Library</h3>
                            <button
                                onClick={() => setShowNewFolderModal(true)}
                                title="New Folder"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    padding: '4px',
                                }}
                            >
                                📁+
                            </button>
                        </div>

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

                        <div
                            className="event-library"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={onDropOnRoot}
                        >
                            {/* Render Folders */}
                            {folders && folders.map(folder => (
                                <div
                                    key={folder.id}
                                    className="folder-item"
                                    onDragOver={onDragOverFolder}
                                    onDragLeave={onDragLeaveFolder}
                                    onDrop={(e) => onDropOnFolder(e, folder.id)}
                                    style={{
                                        marginBottom: '4px',
                                        borderRadius: '4px',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <div
                                        className="folder-header"
                                        onClick={() => toggleFolder(folder.id)}
                                        onMouseEnter={() => setHoveredFolderId(folder.id)}
                                        onMouseLeave={() => setHoveredFolderId(null)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px 10px',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                        }}
                                    >
                                        <span style={{ marginRight: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                                            {expandedFolders[folder.id] ? '▼' : '▶'}
                                        </span>
                                        <span style={{ marginRight: '6px' }}>📁</span>
                                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                                            {folder.name}
                                        </span>
                                        {hoveredFolderId === folder.id && (
                                            <div className="folder-actions" style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameFolderModal({ id: folder.id, name: folder.name });
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'rgba(255,255,255,0.4)',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                    }}
                                                    title="Rename"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteFolderModal({ id: folder.id, name: folder.name });
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'rgba(255,255,255,0.4)',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                    }}
                                                    title="Delete"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Folder Content */}
                                    {expandedFolders[folder.id] && (
                                        <div className="folder-content" style={{ paddingLeft: '16px' }}>
                                            {eventsByFolder[folder.id]?.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className={`event-item ${currentEventId === event.id ? 'active' : ''}`}
                                                    onClick={() => selectEvent(event.id)}
                                                    draggable
                                                    onDragStart={(e) => onEventDragStart(e, event)}
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
                                            {(!eventsByFolder[folder.id] || eventsByFolder[folder.id].length === 0) && (
                                                <div style={{
                                                    padding: '8px',
                                                    fontSize: '11px',
                                                    color: 'rgba(255,255,255,0.3)',
                                                    fontStyle: 'italic'
                                                }}>
                                                    Empty folder
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Root Events */}
                            {rootEvents.length > 0 && (
                                <div className="root-events">
                                    {folders.length > 0 && (
                                        <div style={{
                                            padding: '8px 10px',
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.4)',
                                            textTransform: 'uppercase',
                                            marginTop: '8px'
                                        }}>
                                            Uncategorized
                                        </div>
                                    )}
                                    {rootEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className={`event-item ${currentEventId === event.id ? 'active' : ''}`}
                                            onClick={() => selectEvent(event.id)}
                                            draggable
                                            onDragStart={(e) => onEventDragStart(e, event)}
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
                                </div>
                            )}

                            <button
                                className="add-event-btn"
                                onClick={() => setShowNewEventModal(true)}
                            >
                                <span>+</span> New Event
                            </button>
                        </div>
                    </div>
                )}

                {/* Tips */}
                {activeTab === 'tips' && (
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
                )}
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

            {/* New Folder Modal */}
            <ConfirmModal
                isOpen={showNewFolderModal}
                onClose={() => setShowNewFolderModal(false)}
                onConfirm={(name) => {
                    addFolder(name);
                    setShowNewFolderModal(false);
                }}
                title="New Folder"
                message="Enter a name for the new folder:"
                type="prompt"
                inputPlaceholder="Folder name..."
                defaultValue="New Folder"
                confirmText="Create"
            />

            {/* Rename Folder Modal */}
            <ConfirmModal
                isOpen={!!renameFolderModal}
                onClose={() => setRenameFolderModal(null)}
                onConfirm={(name) => {
                    if (renameFolderModal) {
                        renameFolder(renameFolderModal.id, name);
                        setRenameFolderModal(null);
                    }
                }}
                title="Rename Folder"
                message={`Enter a new name for "${renameFolderModal?.name}":`}
                type="prompt"
                inputPlaceholder="Folder name..."
                defaultValue={renameFolderModal?.name}
                confirmText="Rename"
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

            {/* Delete Folder Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteFolderModal}
                onClose={() => setDeleteFolderModal(null)}
                onConfirm={() => {
                    if (deleteFolderModal) {
                        deleteFolder(deleteFolderModal.id);
                        setDeleteFolderModal(null);
                    }
                }}
                title="Delete Folder"
                message={`Are you sure you want to delete "${deleteFolderModal?.name}"? Events inside will be moved to the root.`}
                type="delete"
                confirmText="Delete"
            />
        </div >
    );
};

export default Sidebar;

