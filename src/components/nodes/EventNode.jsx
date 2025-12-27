import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const EventNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const addNodeOutput = useStore((state) => state.addNodeOutput);
    const addNodeInput = useStore((state) => state.addNodeInput);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (data.initialFocus && inputRef.current) {
            // Small timeout to ensure component is fully mounted and ready
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
                // Clear the flag
                updateNode(id, { initialFocus: undefined });
            }, 50);

            return () => clearTimeout(timer);
        }
    }, [data.initialFocus, id, updateNode]);

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`}>
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

            <div className="event-node-header">
                <span className="event-node-icon">📌</span>
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
                <textarea
                    ref={inputRef}
                    className="event-node-content"
                    value={data.content || ''}
                    onChange={(e) => updateNode(id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Describe this event..."
                    style={{
                        width: '100%',
                        minHeight: '40px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '12px',
                        resize: 'vertical',
                        marginBottom: '8px',
                    }}
                />


                {/* Local Prompt - Only for this event */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        fontSize: '9px',
                        color: '#FFB5C5',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <span>🎯</span> This Event Only
                    </div>
                    <textarea
                        value={data.localPrompt || ''}
                        onChange={(e) => updateNode(id, { localPrompt: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Prompt for this event only..."
                        style={{
                            width: '100%',
                            minHeight: '32px',
                            background: 'rgba(255, 181, 197, 0.1)',
                            border: '1px solid rgba(255, 181, 197, 0.2)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                        }}
                    />
                </div>

                {/* Inherited Prompt - Carries to future nodes */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        fontSize: '9px',
                        color: '#B5FFD9',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <span>🔗</span> Carry Forward
                    </div>
                    <textarea
                        value={data.inheritedPrompt || ''}
                        onChange={(e) => updateNode(id, { inheritedPrompt: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Prompt that carries to connected nodes..."
                        style={{
                            width: '100%',
                            minHeight: '32px',
                            background: 'rgba(181, 255, 217, 0.1)',
                            border: '1px solid rgba(181, 255, 217, 0.2)',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            resize: 'vertical',
                        }}
                    />
                </div>


                {/* Shot Modifiers */}
                <div style={{
                    marginBottom: '10px',
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        color: '#A0A0C0',
                        userSelect: 'none'
                    }}>
                        <input
                            type="checkbox"
                            checked={data.usePerspective || false}
                            onChange={(e) => updateNode(id, { usePerspective: e.target.checked })}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer' }}
                        />
                        📐 Perspective & Foreshortening
                    </label>
                </div>

                <div className="event-node-handles">
                    <div className="handle-group">
                        <span className="handle-label input">
                            Inputs ({data.inputs?.length || 0})
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
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    marginLeft: '4px',
                                }}
                            >
                                +
                            </button>
                        </span>
                    </div>
                    <div className="handle-group">
                        <span className="handle-label output">
                            Outputs ({data.outputs?.length || 0})
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addNodeOutput(id);
                                }}
                                style={{
                                    background: 'rgba(255, 181, 197, 0.2)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#FFB5C5',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    marginLeft: '4px',
                                }}
                            >
                                +
                            </button>
                        </span>
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

export default memo(EventNode);
