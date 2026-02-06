import React from 'react';
import useStore from '../store/useStore';

function TabBar() {
    const openTabs = useStore((state) => state.openTabs);
    const activeTabId = useStore((state) => state.activeTabId);
    const events = useStore((state) => state.events);
    const setActiveTab = useStore((state) => state.setActiveTab);
    const closeTab = useStore((state) => state.closeTab);
    const addEvent = useStore((state) => state.addEvent);

    // Get event name by ID
    const getEventName = (eventId) => {
        const event = events.find(e => e.id === eventId);
        return event?.name || 'Untitled';
    };

    // Handle tab click
    const handleTabClick = (eventId) => {
        setActiveTab(eventId);
    };

    // Handle close button click
    const handleCloseClick = (e, eventId) => {
        e.stopPropagation();
        closeTab(eventId);
    };

    // Handle middle mouse click to close
    const handleMouseDown = (e, eventId) => {
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();
            closeTab(eventId);
        }
    };

    // Handle new tab button
    const handleNewTab = () => {
        addEvent('New Event');
    };

    if (openTabs.length === 0) {
        return null; // Don't show tab bar if no tabs
    }

    return (
        <div className="tab-bar">
            <div className="tab-bar-scroll">
                {openTabs.map((tab) => (
                    <div
                        key={tab.eventId}
                        className={`tab ${activeTabId === tab.eventId ? 'active' : ''}`}
                        onClick={() => handleTabClick(tab.eventId)}
                        onMouseDown={(e) => handleMouseDown(e, tab.eventId)}
                        title={getEventName(tab.eventId)}
                    >
                        <span className="tab-icon">📋</span>
                        <span className="tab-name">{getEventName(tab.eventId)}</span>
                        <button
                            className="tab-close"
                            onClick={(e) => handleCloseClick(e, tab.eventId)}
                            title="Close tab"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
            <button
                className="tab-new"
                onClick={handleNewTab}
                title="New tab"
            >
                +
            </button>
        </div>
    );
}

export default TabBar;
