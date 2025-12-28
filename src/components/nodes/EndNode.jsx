import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import useStore from '../../store/useStore';

const EndNode = ({ id, data, selected }) => {
    const updateNode = useStore((state) => state.updateNode);

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`} style={{
            borderColor: '#FFB5C5',
            background: 'linear-gradient(145deg, rgba(255, 181, 197, 0.1), rgba(255, 181, 197, 0.05))',
            minWidth: '180px'
        }}>
            {/* Only Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                id="end_input"
                style={{ background: '#FFB5C5', width: '10px', height: '10px' }}
            />

            <div className="event-node-header" style={{ borderBottom: '1px solid rgba(255, 181, 197, 0.2)' }}>
                <span className="event-node-icon">🏁</span>
                <input
                    className="event-node-title nodrag"
                    value={data.label}
                    onChange={(e) => updateNode(id, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FFB5C5',
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
                    Flow ends here
                </div>

                {/* Optional prompt capture or final notes could go here */}
            </div>
        </div>
    );
};

export default memo(EndNode);
