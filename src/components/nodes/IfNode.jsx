import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const IfNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const nodes = useStore((state) => state.nodes);
    const [showDropdown, setShowDropdown] = useState(false);

    // Get the Start Node from current canvas to find available inputs
    const startNode = nodes.find(n => n.type === 'startNode');
    const availableInputs = startNode?.data?.inputs || [];
    const selectedInputIds = data.conditionInputIds || [];

    const toggleInput = (inputId) => {
        const newIds = selectedInputIds.includes(inputId)
            ? selectedInputIds.filter(id => id !== inputId)
            : [...selectedInputIds, inputId];
        updateNode(id, { conditionInputIds: newIds });
    };

    // Get labels for selected inputs
    const selectedLabels = selectedInputIds
        .map(inputId => availableInputs.find(i => i.id === inputId)?.label)
        .filter(Boolean);

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`} style={{
            borderColor: '#FFE4B5',
            background: 'linear-gradient(145deg, rgba(255, 228, 181, 0.15), rgba(255, 228, 181, 0.05))',
            minWidth: '200px',
        }}>
            {/* Input Handle */}
            {data.inputs?.map((input, index) => (
                <Handle
                    key={input.id}
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    style={{ top: '50%', background: '#FFE4B5' }}
                    title={input.label}
                />
            ))}

            <div className="event-node-header" style={{ borderBottom: '1px solid rgba(255, 228, 181, 0.2)' }}>
                <span className="event-node-icon">❓</span>
                <input
                    className="event-node-title nodrag"
                    value={data.label}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FFE4B5',
                        fontWeight: 700,
                        fontSize: '14px',
                        width: '100%',
                    }}
                />
            </div>

            <div className="event-node-body" style={{ padding: '12px', position: 'relative' }}>
                <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Check if inputs are enabled:
                </div>

                {/* Input selector button */}
                <div
                    className="nodrag"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(!showDropdown);
                    }}
                    style={{
                        background: 'rgba(255, 228, 181, 0.1)',
                        border: '1px solid rgba(255, 228, 181, 0.2)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: '32px',
                    }}
                >
                    <span style={{
                        color: selectedLabels.length > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        fontSize: '11px',
                    }}>
                        {selectedLabels.length > 0
                            ? selectedLabels.join(' AND ')
                            : availableInputs.length > 0 ? 'Select inputs to check...' : 'No inputs defined in Start Node'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
                        ▼
                    </span>
                </div>

                {/* Dropdown */}
                {showDropdown && availableInputs.length > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '12px',
                            right: '12px',
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
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {availableInputs.map((input) => {
                            const isSelected = selectedInputIds.includes(input.id);
                            return (
                                <label
                                    key={input.id}
                                    className="nodrag"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        background: isSelected ? 'rgba(255, 228, 181, 0.1)' : 'transparent',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleInput(input.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{
                                        fontSize: '11px',
                                        color: isSelected ? '#FFE4B5' : 'rgba(255,255,255,0.7)',
                                    }}>
                                        {input.label}
                                    </span>
                                    <span style={{
                                        fontSize: '9px',
                                        color: input.enabled ? '#B5FFD9' : 'rgba(255,100,100,0.7)',
                                        marginLeft: 'auto',
                                    }}>
                                        {input.enabled ? '✓ ON' : '✗ OFF'}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}

                {/* Output labels */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    fontSize: '10px',
                }}>
                    <div style={{
                        color: '#B5FFD9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        ✓ True
                    </div>
                    <div style={{
                        color: '#FFB5B5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        ✗ False
                    </div>
                </div>
            </div>

            {/* Output Handles */}
            <Handle
                type="source"
                position={Position.Right}
                id="true_output"
                style={{
                    top: '60%',
                    background: '#B5FFD9',
                    width: '10px',
                    height: '10px',
                }}
                title="True"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="false_output"
                style={{
                    top: '80%',
                    background: '#FFB5B5',
                    width: '10px',
                    height: '10px',
                }}
                title="False"
            />
        </div>
    );
};

export default memo(IfNode);
