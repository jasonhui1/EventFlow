import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const GroupNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const addNodeOutput = useStore((state) => state.addNodeOutput);
    const addNodeInput = useStore((state) => state.addNodeInput);

    return (
        <div className={`group-node ${selected ? 'selected' : ''}`}>
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

            <div className="group-node-header">
                <span className="event-node-icon">📁</span>
                <input
                    className="event-node-title"
                    value={data.label}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#1a1a2e',
                        fontWeight: 600,
                        fontSize: '13px',
                        width: '100%',
                    }}
                />
            </div>

            <div className="event-node-body">
                <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Fixed Prompt (applies to all)
                    </span>
                </div>
                <textarea
                    value={data.fixedPrompt || ''}
                    onChange={(e) => updateNode(id, { fixedPrompt: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="outfit, location, mood..."
                    style={{
                        width: '100%',
                        minHeight: '50px',
                        background: 'rgba(181, 212, 255, 0.1)',
                        border: '1px solid rgba(181, 212, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '11px',
                        resize: 'vertical',
                        fontFamily: 'monospace',
                    }}
                />

                <div className="event-node-handles" style={{ marginTop: '12px' }}>
                    <div className="handle-group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                addNodeInput(id);
                            }}
                            style={{
                                background: 'rgba(181, 212, 255, 0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#B5D4FF',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: '10px',
                            }}
                        >
                            + Input
                        </button>
                    </div>
                    <div className="handle-group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                addNodeOutput(id);
                            }}
                            style={{
                                background: 'rgba(181, 255, 217, 0.2)',
                                border: 'none',
                                borderRadius: '4px',
                                color: '#B5FFD9',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: '10px',
                            }}
                        >
                            + Output
                        </button>
                    </div>
                </div>
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

export default memo(GroupNode);
