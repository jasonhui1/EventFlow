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

    // Handle keyboard activation for tab
    const handleTabKeyDown = (e, eventId) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
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
        <div className="tab-bar" role="tablist" aria-label="Open events">
            <div className="tab-bar-scroll">
                {openTabs.map((tab) => {
                    const eventName = getEventName(tab.eventId);
                    return (
                        <div
                            key={tab.eventId}
                            role="tab"
                            aria-selected={activeTabId === tab.eventId}
                            aria-label={`Event: ${eventName}`}
                            tabIndex={0}
                            className={`tab ${activeTabId === tab.eventId ? 'active' : ''}`}
                            onClick={() => handleTabClick(tab.eventId)}
                            onKeyDown={(e) => handleTabKeyDown(e, tab.eventId)}
                            onMouseDown={(e) => handleMouseDown(e, tab.eventId)}
                            title={eventName}
                        >
                            <span className="tab-icon" aria-hidden="true">📋</span>
                            <span className="tab-name">{eventName}</span>
                            <button
                                className="tab-close"
                                onClick={(e) => handleCloseClick(e, tab.eventId)}
                                aria-label={`Close ${eventName} tab`}
                                title="Close tab"
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
                aria-label="Add new event tab"
                title="New tab"
            >
                +
            </button>
        </div>
    );
}

export default TabBar;
