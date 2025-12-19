import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const ReferenceNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const events = useStore((state) => state.events);
    const currentEventId = useStore((state) => state.currentEventId);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter out current event and search
    const availableEvents = events.filter(
        (e) => e.id !== currentEventId && e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedEvent = events.find((e) => e.id === data.referenceId);

    return (
        <div className={`reference-node ${selected ? 'selected' : ''}`}>
            {/* Input Handles */}
            {data.inputs?.map((input, index) => (
                <Handle
                    key={input.id}
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    style={{ top: `${30 + index * 24}%` }}
                    title={input.label}
                />
            ))}

            <div className="reference-node-header">
                <span className="event-node-icon">🔗</span>
                <span style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '13px' }}>
                    Event Reference
                </span>
            </div>

            <div className="event-node-body" style={{ position: 'relative' }}>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(!showDropdown);
                    }}
                    style={{
                        background: 'rgba(229, 212, 255, 0.1)',
                        border: '1px solid rgba(229, 212, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span style={{
                        color: selectedEvent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        fontSize: '12px',
                    }}>
                        {selectedEvent ? selectedEvent.name : 'Select Event...'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                        ▼
                    </span>
                </div>

                {showDropdown && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            background: '#16213e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            marginTop: '4px',
                            zIndex: 100,
                            maxHeight: '150px',
                            overflow: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search events..."
                            autoFocus
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '8px 12px',
                                fontSize: '12px',
                            }}
                        />
                        {availableEvents.length === 0 ? (
                            <div style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', textAlign: 'center' }}>
                                No events found
                            </div>
                        ) : (
                            availableEvents.map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => {
                                        updateNode(id, {
                                            referenceId: event.id,
                                            referenceName: event.name,
                                            label: `→ ${event.name}`,
                                        });
                                        setShowDropdown(false);
                                        setSearchTerm('');
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        color: 'rgba(255,255,255,0.8)',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                                >
                                    📋 {event.name}
                                    <span style={{
                                        display: 'block',
                                        fontSize: '10px',
                                        color: 'rgba(255,255,255,0.4)',
                                        marginTop: '2px',
                                    }}>
                                        {event.nodes?.length || 0} nodes
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {selectedEvent && (
                    <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'rgba(181, 245, 255, 0.05)',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.5)',
                    }}>
                        🔄 Reusable: Will execute "{selectedEvent.name}" flow
                    </div>
                )}
            </div>

            {/* Output Handles */}
            {data.outputs?.map((output, index) => (
                <Handle
                    key={output.id}
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    style={{ top: `${30 + index * 24}%` }}
                    title={output.label}
                />
            ))}
        </div>
    );
};

export default memo(ReferenceNode);
