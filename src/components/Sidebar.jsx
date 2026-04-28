import { useState, useRef, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import ConfirmModal from './ConfirmModal';

const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;

const Sidebar = () => {
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(0);
    const [isDragging, setIsDragging] = useState(false)
    const [isCollapsed, setIsCollapsed] = useState(true);
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
    const moveFolderToFolder = useStore((state) => state.moveFolderToFolder);
    const setSelectedFolderId = useStore((state) => state.setSelectedFolderId);


    // Modal states
    const [showNewEventModal, setShowNewEventModal] = useState(false);
    const [newEventFolderId, setNewEventFolderId] = useState(null); // For creating events in folders
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderParentId, setNewFolderParentId] = useState(null); // For creating subfolders
    const [renameFolderModal, setRenameFolderModal] = useState(null); // { id, name }
    const [deleteEventModal, setDeleteEventModal] = useState(null); // { id, name }
    const [deleteFolderModal, setDeleteFolderModal] = useState(null); // { id, name }
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('library'); // 'nodes', 'library', 'tips'
    const [expandedFolders, setExpandedFolders] = useState({}); // { folderId: boolean }
    const [hoveredFolderId, setHoveredFolderId] = useState(null);

    const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)

    // Handle drag resize
    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e) => {
            // Dragging right increases width (since sidebar is on the left)
            const deltaX = e.clientX - dragStartX.current
            const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, dragStartWidth.current + deltaX))
            setSidebarWidth(newWidth)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    const handleDragStart = (e) => {
        if (isCollapsed) return
        e.preventDefault()
        dragStartX.current = e.clientX
        dragStartWidth.current = sidebarWidth
        setIsDragging(true)
    }


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
        const dragFolderId = e.dataTransfer.getData('folderId');

        // Handle dropping a folder into another folder
        if (dragFolderId) {
            moveFolderToFolder(dragFolderId, folderId);
        }
        // Handle dropping an event into a folder
        else if (eventId) {
            moveEventToFolder(eventId, folderId);
        }
    };

    // Allow folders to be dragged
    const onFolderDragStart = (e, folder) => {
        e.dataTransfer.setData('folderId', folder.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDropOnRoot = (e) => {
        e.preventDefault();
        // Visual feedback reset if needed
        const eventId = e.dataTransfer.getData('eventId');
        const folderId = e.dataTransfer.getData('folderId');

        if (folderId) {
            moveFolderToFolder(folderId, null); // Move folder to root
        } else if (eventId) {
            moveEventToFolder(eventId, null);
        }
    };

    // Get child folders for a given parent (treat undefined same as null for backwards compatibility)
    const getChildFolders = (parentId) => {
        return (folders || []).filter(f => {
            const folderParent = f.parentId ?? null; // Convert undefined to null
            return folderParent === parentId;
        });
    };

    // Get root-level folders (no parent or parentId is undefined/null)
    const rootFolders = getChildFolders(null);

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


    const foldersById = useMemo(() => {
        const map = {};
        folders.forEach(folder => {
            map[folder.id] = folder;
        });
        return map;
    }, [folders]);


    const folderVisibleMap = useMemo(() => {
        const cache = {};
        const term = searchTerm.toLowerCase();

        const compute = (folderId) => {
            if (cache[folderId] !== undefined) return cache[folderId];

            const folder = foldersById[folderId];
            if (!folder) {
                cache[folderId] = false;
                return false;
            }

            const folderMatches =
                folder.name.toLowerCase().includes(term);

            const eventMatches =
                (eventsByFolder[folderId] || []).some(e =>
                    e.name.toLowerCase().includes(term)
                );

            const childMatches = getChildFolders(folderId)
                .some(child => compute(child.id));

            const visible = folderMatches || eventMatches || childMatches;
            cache[folderId] = visible;
            return visible;
        };

        folders.forEach(f => compute(f.id));
        return cache;
    }, [folders, foldersById, eventsByFolder, searchTerm]);

    // Check for empty folders
    // const folderHasContent = (folderId) => {
    //     const folderEvents = eventsByFolder[folderId] || [];
    //     if (folderEvents.length > 0) return true;

    //     const childFolders = getChildFolders(folderId);
    //     return childFolders.some(child => folderHasContent(child.id));
    // };

    // Recursive folder renderer component
    const renderFolder = (folder, depth = 0) => {
        if (!folderVisibleMap[folder.id]) return null;

        const childFolders = getChildFolders(folder.id);
        const folderEvents = eventsByFolder[folder.id] || [];
        const hasChildren = childFolders.length > 0 || folderEvents.length > 0;

        return (
            <div
                key={folder.id}
                className="folder-item"
                style={{
                    marginBottom: '2px',
                    borderRadius: '4px',
                    transition: 'background 0.2s',
                    marginLeft: depth > 0 ? '12px' : 0,
                }}
            >
                <div
                    className="folder-header"
                    draggable
                    onDragStart={(e) => onFolderDragStart(e, folder)}
                    onDragOver={onDragOverFolder}
                    onDragLeave={onDragLeaveFolder}
                    onDrop={(e) => onDropOnFolder(e, folder.id)}
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
                        {hasChildren ? (expandedFolders[folder.id] ? '▼' : '▶') : '•'}
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
                                    setNewEventFolderId(folder.id);
                                    setShowNewEventModal(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                }}
                                title="Add Event" aria-label="Add Event"
                            >
                                +📌
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNewFolderParentId(folder.id);
                                    setShowNewFolderModal(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                }}
                                title="Add Subfolder" aria-label="Add Subfolder"
                            >
                                +📁
                            </button>
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
                                title="Rename Folder" aria-label="Rename Folder"
                            >
                                ✎
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFolderId(folder.id);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                }}
                                title="Edit Folder Tags" aria-label="Edit Folder Tags"
                            >
                                ⚙️
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
                                title="Delete Folder" aria-label="Delete Folder"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Folder Content - expanded */}
                {(searchTerm !== '' || expandedFolders[folder.id]) && (
                    <div className="folder-content" style={{ paddingLeft: '8px' }}>
                        {/* Render child folders recursively */}
                        {childFolders.map(child => renderFolder(child, depth + 1))}

                        {/* Render events in this folder */}
                        {folderEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`event-item ${currentEventId === event.id ? 'active' : ''}`}
                                onClick={() => selectEvent(event.id)}
                                draggable
                                onDragStart={(e) => onEventDragStart(e, event)}
                                style={{ marginLeft: '12px' }}
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
                                        title="Duplicate Event" aria-label="Duplicate Event"
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
                                            title="Delete Event" aria-label="Delete Event"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Empty folder message */}
                        {childFolders.length === 0 && folderEvents.length === 0 && (
                            <div style={{
                                padding: '8px',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.3)',
                                fontStyle: 'italic',
                                marginLeft: '12px',
                            }}>
                                Empty folder
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
            style={{
                ...(isCollapsed ? {} : { width: `${sidebarWidth}px` }),
                transition: isDragging ? 'none' : 'width 0.2s',
                position: 'relative',
            }}
        >
            {!isCollapsed && (
                <div
                    onMouseDown={handleDragStart}
                    className={`sidebar-resize-handle ${isDragging ? 'dragging' : ''}`}
                    title="Drag to resize"
                />
            )}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <>
                        <h1 className="sidebar-title">Event Flow Writer</h1>
                        <p className="sidebar-subtitle">Visual story builder</p>

                    </>
                )}
                <button
                    className="sidebar-collapse-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? '»' : '«'}
                </button>
            </div>




            <div className="sidebar-tabs">

                <button
                    className={`sidebar-tab ${activeTab === 'nodes' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('nodes'); if (isCollapsed) setIsCollapsed(false); }}
                    title="Node Palette" aria-label="Node Palette"
                >
                    <span className="tab-icon">🧩</span>
                    {!isCollapsed && <span className="tab-label">Nodes</span>}
                </button>
                <button
                    className={`sidebar-tab ${activeTab === 'library' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('library'); if (isCollapsed) setIsCollapsed(false); }}
                    title="Event Library" aria-label="Event Library"
                >
                    <span className="tab-icon">📚</span>
                    {!isCollapsed && <span className="tab-label">Library</span>}
                </button>
                <button
                    className={`sidebar-tab ${activeTab === 'tips' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('tips'); if (isCollapsed) setIsCollapsed(false); }}
                    title="Quick Tips" aria-label="Quick Tips"
                >
                    <span className="tab-icon">💡</span>
                    {!isCollapsed && <span className="tab-label">Tips</span>}
                </button>
            </div>

            {
                !isCollapsed && <div className="sidebar-content">
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
                                    onClick={() => {
                                        setNewFolderParentId(null);
                                        setShowNewFolderModal(true);
                                    }}
                                    title="New Folder" aria-label="New Folder"
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
                                {/* Render Root Folders (recursively) */}
                                {rootFolders.map(folder => renderFolder(folder))}

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
                                                        title="Duplicate Event" aria-label="Duplicate Event"
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
                                                            title="Delete Event" aria-label="Delete Event"
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
            }

            {/* New Event Modal */}
            <ConfirmModal
                isOpen={showNewEventModal}
                onClose={() => {
                    setShowNewEventModal(false);
                    setNewEventFolderId(null);
                }}
                onConfirm={(name) => {
                    addEvent(name, newEventFolderId);
                    setShowNewEventModal(false);
                    setNewEventFolderId(null);
                }}
                title="New Event" aria-label="New Event"
                message="Enter a name for the new event:"
                type="prompt"
                inputPlaceholder="Event name..."
                defaultValue="New Event"
                confirmText="Create"
            />

            {/* New Folder Modal */}
            <ConfirmModal
                isOpen={showNewFolderModal}
                onClose={() => {
                    setShowNewFolderModal(false);
                    setNewFolderParentId(null);
                }}
                onConfirm={(name) => {
                    addFolder(name, newFolderParentId);
                    setShowNewFolderModal(false);
                    setNewFolderParentId(null);
                }}
                title={newFolderParentId ? "New Subfolder" : "New Folder"}
                message={newFolderParentId
                    ? "Enter a name for the new subfolder:"
                    : "Enter a name for the new folder:"}
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
                title="Delete Event" aria-label="Delete Event"
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

