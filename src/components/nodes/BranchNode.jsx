import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const BranchNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);
    const updateOutputWeight = useStore((state) => state.updateOutputWeight);
    const addNodeOutput = useStore((state) => state.addNodeOutput);

    const totalWeight = data.outputs?.reduce((sum, o) => sum + (o.weight || 0), 0) || 100;

    const handleWeightChange = (outputId, newWeight) => {
        updateOutputWeight(id, outputId, Math.max(0, Math.min(100, newWeight)));
    };

    return (
        <div className={`branch-node ${selected ? 'selected' : ''}`}>
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

            <div className="branch-outputs">
                {data.outputs?.map((output, index) => (
                    <div key={output.id} className="branch-option">
                        <input
                            value={output.label}
                            onChange={(e) => {
                                const newOutputs = data.outputs.map((o) =>
                                    o.id === output.id ? { ...o, label: e.target.value } : o
                                );
                                updateNode(id, { outputs: newOutputs });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '12px',
                                width: '80px',
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                                type="number"
                                value={output.weight || 50}
                                onChange={(e) => handleWeightChange(output.id, parseInt(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                min="0"
                                max="100"
                                style={{
                                    width: '40px',
                                    background: 'rgba(255, 206, 181, 0.15)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#FFCEB5',
                                    fontSize: '11px',
                                    padding: '2px 4px',
                                    textAlign: 'center',
                                }}
                            />
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                ({Math.round((output.weight / totalWeight) * 100)}%)
                            </span>
                        </div>

                        {/* Output Handle for this branch */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={output.id}
                            style={{
                                top: `${50 + index * 40}px`,
                                background: '#FFCEB5',
                            }}
                            title={output.label}
                        />
                    </div>
                ))}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        addNodeOutput(id);
                    }}
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
                    value={data.condition || ''}
                    onChange={(e) => updateNode(id, { condition: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
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
