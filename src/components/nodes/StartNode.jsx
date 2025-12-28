import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const StartNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`} style={{
            borderColor: '#B5FFD9',
            background: 'linear-gradient(145deg, rgba(181, 255, 217, 0.1), rgba(181, 255, 217, 0.05))',
            minWidth: '180px'
        }}>
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
                <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.6)',
                    fontStyle: 'italic',
                    textAlign: 'center'
                }}>
                    Flow starts here
                </div>
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
