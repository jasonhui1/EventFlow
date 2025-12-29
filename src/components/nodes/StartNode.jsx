import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import useStore from '../../store/useStore';

const StartNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const addStartNodeInput = useStore((state) => state.addStartNodeInput);
    const removeStartNodeInput = useStore((state) => state.removeStartNodeInput);
    const toggleStartNodeInput = useStore((state) => state.toggleStartNodeInput);
    const updateStartNodeInputLabel = useStore((state) => state.updateStartNodeInputLabel);

    const inputs = data.inputs || [];

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`} style={{
            borderColor: '#B5FFD9',
            background: 'linear-gradient(145deg, rgba(181, 255, 217, 0.1), rgba(181, 255, 217, 0.05))',
            minWidth: '200px'
        }}>
            <NodeResizer
                color="#B5FFD9"
                isVisible={selected}
                minWidth={200}
                minHeight={100}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
                lineStyle={{ border: '1px solid #B5FFD9' }}
            />
            <div className="event-node-header" style={{ borderBottom: '1px solid rgba(181, 255, 217, 0.2)' }}>
                <span className="event-node-icon">🚀</span>
                <input
                    className="event-node-title nodrag"
                    value={data.label}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#B5FFD9',
                        fontWeight: 700,
                        fontSize: '14px',
                        width: '100%',
                    }}
                />
            </div>

            <div className="event-node-body" style={{ padding: '12px' }}>
                {inputs.length === 0 ? (
                    <div style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.6)',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        marginBottom: '8px'
                    }}>
                        Flow starts here
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                        {inputs.map((input) => (
                            <div
                                key={input.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '6px 8px',
                                    background: input.enabled
                                        ? 'rgba(181, 255, 217, 0.1)'
                                        : 'rgba(255,255,255,0.03)',
                                    borderRadius: '4px',
                                    border: `1px solid ${input.enabled ? 'rgba(181, 255, 217, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="nodrag"
                                    checked={input.enabled}
                                    onChange={() => toggleStartNodeInput(id, input.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{ cursor: 'pointer' }}
                                />
                                <input
                                    type="text"
                                    className="nodrag"
                                    value={input.label}
                                    onChange={(e) => updateStartNodeInputLabel(id, input.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        color: input.enabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                                        fontSize: '11px',
                                        textDecoration: input.enabled ? 'none' : 'line-through',
                                    }}
                                />
                                <button
                                    className="nodrag"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeStartNodeInput(id, input.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,100,100,0.5)',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        padding: '0 4px',
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    className="nodrag"
                    onClick={(e) => {
                        e.stopPropagation();
                        addStartNodeInput(id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        background: 'rgba(181, 255, 217, 0.1)',
                        border: '1px dashed rgba(181, 255, 217, 0.3)',
                        borderRadius: '4px',
                        color: '#B5FFD9',
                        padding: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                    }}
                >
                    + Add Input
                </button>
            </div>

            {/* Only Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="start_output"
                style={{ background: '#B5FFD9', width: '10px', height: '10px' }}
            />
        </div>
    );
};

export default memo(StartNode);
