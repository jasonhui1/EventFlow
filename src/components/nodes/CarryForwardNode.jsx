import React, { memo, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import useStore from '../../store/useStore';
import PromptList from '../PromptList';

const CarryForwardNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const addNodeOutput = useStore((state) => state.addNodeOutput);
    const addNodeInput = useStore((state) => state.addNodeInput);
    const inputRef = useRef(null);

    useEffect(() => {
        if (data.initialFocus) {
            const timer = setTimeout(() => {
                // Try to focus the first input in the PromptList if possible, or just the title
                // Since PromptList inputs are dynamic, we might just clear the flag for now
                // or focus the title if we want.
                updateNode(id, { initialFocus: undefined });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [data.initialFocus, id, updateNode]);

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`} style={{
            borderColor: '#B5FFD9',
            background: 'linear-gradient(145deg, rgba(181, 255, 217, 0.1), rgba(181, 255, 217, 0.05))',
            height: '100%',
        }}>
            <NodeResizer
                color="#B5FFD9"
                isVisible={selected}
                minWidth={250}
                minHeight={150}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
                lineStyle={{ border: '1px solid #B5FFD9' }}
            />

            {/* Input Handles */}
            {data.inputs?.map((input, index) => (
                <Handle
                    key={input.id}
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    style={{ top: `${30 + index * 24}%`, background: '#B5FFD9' }}
                    title={input.label}
                />
            ))}

            <div className="event-node-header" style={{ borderBottom: '1px solid rgba(181, 255, 217, 0.2)' }}>
                <span className="event-node-icon">⏩</span>
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

            <div className="event-node-body">
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
                    <PromptList
                        prompts={data.inheritedPrompt}
                        onChange={(newPrompts) => updateNode(id, { inheritedPrompt: newPrompts })}
                        placeholder="Prompt that carries to connected nodes..."
                        color="#B5FFD9"
                    />
                </div>

                <div className="event-node-handles">
                    <div className="handle-group">
                        <span className="handle-label input" style={{ color: 'rgba(181, 255, 217, 0.7)' }}>
                            Inputs ({data.inputs?.length || 0})
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addNodeInput(id);
                                }}
                                style={{
                                    background: 'rgba(181, 255, 217, 0.2)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#B5FFD9',
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
                        <span className="handle-label output" style={{ color: 'rgba(181, 255, 217, 0.7)' }}>
                            Outputs ({data.outputs?.length || 0})
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
                    style={{ top: `${30 + index * 24}%`, background: '#B5FFD9' }}
                    title={output.label}
                />
            ))}
        </div>
    );
};

export default memo(CarryForwardNode);
