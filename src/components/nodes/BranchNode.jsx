import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import useStore from '../../store/useStore';

const BranchNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const updateOutputWeight = useStore((state) => state.updateOutputWeight);
    const addNodeOutput = useStore((state) => state.addNodeOutput);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (data.initialFocus && inputRef.current) {
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
                updateNode(id, { initialFocus: undefined });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [data.initialFocus, id, updateNode]);

    const totalWeight = data.outputs?.reduce((sum, o) => sum + (o.weight || 0), 0) || 100;

    const handleWeightChange = (outputId, newWeight) => {
        updateOutputWeight(id, outputId, Math.max(0, Math.min(100, newWeight)));
    };

    return (
        <div className={`branch-node ${selected ? 'selected' : ''}`}>
            <NodeResizer
                color="#FFCEB5"
                isVisible={selected}
                minWidth={250}
                minHeight={150}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
                lineStyle={{ border: '1px solid #FFCEB5' }}
            />
            {/* Input Handle */}
            {data.inputs?.map((input, index) => (
                <Handle
                    key={input.id}
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    style={{ top: '50%' }}
                    title={input.label}
                />
            ))}

            <div className="branch-node-header">
                <span className="event-node-icon">🔀</span>
                <input
                    className="event-node-title nodrag"
                    value={data.label}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
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

            <div className="branch-outputs">
                {data.outputs?.map((output, index) => {
                    const percentage = Math.round(((output.weight || 50) / totalWeight) * 100);
                    return (
                        <div key={output.id} className="branch-option" style={{
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            gap: '4px',
                            position: 'relative',
                            padding: '8px 0'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <input
                                    ref={index === 0 ? inputRef : null}
                                    value={output.label}
                                    onChange={(e) => {
                                        const newOutputs = data.outputs.map((o) =>
                                            o.id === output.id ? { ...o, label: e.target.value } : o
                                        );
                                        updateNode(id, { outputs: newOutputs });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    className="nodrag"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.7)',
                                        fontSize: '11px',
                                        flex: 1,
                                        fontWeight: 500,
                                    }}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#FFCEB5',
                                        background: 'rgba(255, 206, 181, 0.1)',
                                        padding: '1px 6px',
                                        borderRadius: '10px'
                                    }}>
                                        {percentage}%
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newOutputs = data.outputs.filter(o => o.id !== output.id);
                                            updateNode(id, { outputs: newOutputs });
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255,100,100,0.5)',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            padding: '0 4px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={output.weight || 50}
                                onChange={(e) => handleWeightChange(output.id, parseInt(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="probability-slider nodrag"
                                style={{
                                    height: '4px',
                                    marginTop: '4px',
                                    cursor: 'pointer'
                                }}
                            />

                            {/* Output Handle for this branch */}
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={output.id}
                                style={{
                                    top: '50%',
                                    right: '-6px',
                                    background: '#FFCEB5',
                                }}
                                title={output.label}
                            />
                        </div>
                    );
                })}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        addNodeOutput(id);
                    }}
                    className="nodrag"
                    style={{
                        width: '100%',
                        marginTop: '8px',
                        background: 'rgba(255, 206, 181, 0.1)',
                        border: '1px dashed rgba(255, 206, 181, 0.3)',
                        borderRadius: '6px',
                        color: '#FFCEB5',
                        padding: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                    }}
                >
                    + Add Branch
                </button>
            </div>

            <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <input
                    className="nodrag"
                    value={data.condition || ''}
                    onChange={(e) => updateNode(id, { condition: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Condition (optional)..."
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '10px',
                        padding: '6px 8px',
                    }}
                />
            </div>
        </div>
    );
};

export default memo(BranchNode);
