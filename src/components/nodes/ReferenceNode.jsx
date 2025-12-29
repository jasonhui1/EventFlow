import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import useStore from '../../store/useStore';

const ReferenceNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const events = useStore((state) => state.events);
    const currentEventId = useStore((state) => state.currentEventId);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    // Filter out current event and search
    const availableEvents = events.filter(
        (e) => e.id !== currentEventId && e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedEvent = events.find((e) => e.id === data.referenceId);

    return (
        <div className={`reference-node ${selected ? 'selected' : ''}`}>
            <NodeResizer
                color="#E5D4FF"
                isVisible={selected}
                minWidth={250}
                minHeight={150}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
                lineStyle={{ border: '1px solid #E5D4FF' }}
            />
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
                <div style={{ position: 'relative' }} ref={dropdownRef}>
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
                                className="nodrag"
                                onMouseDown={(e) => e.stopPropagation()}
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
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

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

                {/* Display referenced event's Start Node inputs */}
                {selectedEvent && (() => {
                    const startNode = selectedEvent.nodes?.find(n => n.type === 'startNode');
                    const startInputs = startNode?.data?.inputs || [];
                    const inputOverrides = data.inputOverrides || {};

                    if (startInputs.length === 0) return null;

                    return (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: 'rgba(181, 255, 217, 0.05)',
                            borderRadius: '4px',
                            border: '1px solid rgba(181, 255, 217, 0.1)',
                        }}>
                            <div style={{
                                fontSize: '10px',
                                color: '#B5FFD9',
                                marginBottom: '6px',
                                fontWeight: 500,
                            }}>
                                📥 Event Inputs
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {startInputs.map((input) => {
                                    // Use override if exists, otherwise use the original enabled state
                                    const isEnabled = inputOverrides.hasOwnProperty(input.id)
                                        ? inputOverrides[input.id]
                                        : input.enabled;

                                    return (
                                        <label
                                            key={input.id}
                                            className="nodrag"
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                cursor: 'pointer',
                                                padding: '4px 6px',
                                                background: isEnabled
                                                    ? 'rgba(181, 255, 217, 0.1)'
                                                    : 'rgba(255,255,255,0.02)',
                                                borderRadius: '3px',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="nodrag"
                                                checked={isEnabled}
                                                onChange={() => {
                                                    const newOverrides = {
                                                        ...inputOverrides,
                                                        [input.id]: !isEnabled,
                                                    };
                                                    updateNode(id, { inputOverrides: newOverrides });
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{
                                                fontSize: '10px',
                                                color: isEnabled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                                                textDecoration: isEnabled ? 'none' : 'line-through',
                                            }}>
                                                {input.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
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
