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

    // Handle tab keydown
    const handleKeyDown = (e, eventId) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setActiveTab(eventId);
        }
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
        <div className="tab-bar" role="tablist" aria-label="Open Events">
            <div className="tab-bar-scroll">
                {openTabs.map((tab) => {
                    const eventName = getEventName(tab.eventId);
                    const isActive = activeTabId === tab.eventId;
                    return (
                        <div
                            key={tab.eventId}
                            className={`tab ${isActive ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab.eventId)}
                            onMouseDown={(e) => handleMouseDown(e, tab.eventId)}
                            onKeyDown={(e) => handleKeyDown(e, tab.eventId)}
                            title={eventName}
                            role="tab"
                            tabIndex={0}
                            aria-selected={isActive}
                            aria-label={eventName}
                        >
                            <span className="tab-icon" aria-hidden="true">📋</span>
                            <span className="tab-name">{eventName}</span>
                            <button
                                className="tab-close"
                                onClick={(e) => handleCloseClick(e, tab.eventId)}
                                title={`Close ${eventName} tab`}
                                aria-label={`Close ${eventName} tab`}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
            <button
                className="tab-new"
                onClick={handleNewTab}
                title="New Event"
                aria-label="New Event"
            >
                +
            </button>
        </div>
    );
}

export default TabBar;
