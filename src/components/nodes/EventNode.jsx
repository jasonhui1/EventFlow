import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import useStore from '../../store/useStore';
import ResizingTextarea from '../ResizingTextarea';
import PromptList from '../PromptList';

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
                    // Check if it's a textarea or input
                    if (inputRef.current.focus) inputRef.current.focus();
                    if (inputRef.current.select) inputRef.current.select();
                }
                // Clear the flag
                updateNode(id, { initialFocus: undefined });
            }, 50);

            return () => clearTimeout(timer);
        }
    }, [data.initialFocus, id, updateNode]);

    return (
        <div className={`event-node ${selected ? 'selected' : ''}`}>
            <NodeResizer
                color="#C9B5FF"
                isVisible={selected}
                minWidth={320}
                minHeight={200}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
                lineStyle={{ border: '1px solid #C9B5FF' }}
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

            <div className="event-node-header">
                <span className="event-node-icon">📌</span>
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

            <div className="event-node-body">
                <ResizingTextarea
                    ref={inputRef}
                    className="event-node-content"
                    value={data.content || ''}
                    onChange={(e) => updateNode(id, { content: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Describe this event..."
                    minHeight="40px"
                    style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '8px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '12px',
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
                    <PromptList
                        prompts={data.localPrompt}
                        onChange={(newPrompts) => updateNode(id, { localPrompt: newPrompts })}
                        placeholder="Prompt for this event only..."
                        color="#FFB5C5"
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
                    <PromptList
                        prompts={data.inheritedPrompt}
                        onChange={(newPrompts) => updateNode(id, { inheritedPrompt: newPrompts })}
                        placeholder="Prompt that carries to connected nodes..."
                        color="#B5FFD9"
                    />
                </div>


                {/* Camera Options */}
                {(() => {
                    const [isCameraCollapsed, setIsCameraCollapsed] = React.useState(true);

                    const toggleOption = (key) => {
                        updateNode(id, { [key]: !data[key] });
                    };

                    const options = [
                        { key: 'usePerspective', label: 'Perspective & Foreshortening' },
                        { key: 'cameraAbove', label: 'From Above' },
                        { key: 'cameraBelow', label: 'From Below' },
                        { key: 'cameraSide', label: 'From Side' },
                    ];

                    const activeCount = options.filter(opt => data[opt.key]).length;

                    return (
                        <div style={{ marginBottom: '10px' }}>
                            {/* Header */}
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCameraCollapsed(!isCameraCollapsed);
                                }}
                                style={{
                                    padding: '6px 8px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '12px' }}>📷</span>
                                    <span style={{ fontSize: '11px', color: '#A0A0C0', fontWeight: 500 }}>
                                        Camera Options
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '10px',
                                    color: 'rgba(255,255,255,0.4)',
                                    transform: isCameraCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                }}>
                                    ▼
                                </span>
                            </div>

                            {/* Dropdown Content */}
                            {!isCameraCollapsed && (
                                <div style={{
                                    marginTop: '4px',
                                    padding: '8px',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px'
                                }}>
                                    {options.map((opt) => (
                                        <label
                                            key={opt.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                fontSize: '11px',
                                                color: data[opt.key] ? '#E0E0FF' : '#8080A0',
                                                userSelect: 'none',
                                                padding: '2px 0'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data[opt.key] || false}
                                                onChange={() => toggleOption(opt.key)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            {opt.label}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Mood Effect Range Slider - Min/Max */}
                {(() => {
                    const moodRef = React.useRef(null);
                    const [draggingHandle, setDraggingHandle] = React.useState(null); // 'min' | 'max' | null

                    const moodMin = data.moodChangeMin ?? 0;
                    const moodMax = data.moodChangeMax ?? 10;

                    const calculateValue = (clientX) => {
                        if (!moodRef.current) return 0;
                        const rect = moodRef.current.getBoundingClientRect();
                        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                        const percentage = x / rect.width;
                        return Math.round(-50 + percentage * 100);
                    };

                    const handleMouseDown = (handle) => (e) => {
                        e.stopPropagation();
                        setDraggingHandle(handle);

                        const handleMouseMove = (moveEvent) => {
                            const value = calculateValue(moveEvent.clientX);
                            if (handle === 'min') {
                                updateNode(id, { moodChangeMin: Math.min(value, moodMax) });
                            } else {
                                updateNode(id, { moodChangeMax: Math.max(value, moodMin) });
                            }
                        };

                        const handleMouseUp = () => {
                            setDraggingHandle(null);
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                        };

                        window.addEventListener('mousemove', handleMouseMove);
                        window.addEventListener('mouseup', handleMouseUp);
                    };

                    const minPos = ((moodMin + 50) / 100) * 100;
                    const maxPos = ((moodMax + 50) / 100) * 100;
                    const rangeColor = (moodMin + moodMax) / 2 > 0 ? '#B5FFD9' : (moodMin + moodMax) / 2 < 0 ? '#FFB5B5' : '#888';

                    return (
                        <div
                            ref={moodRef}
                            className="nodrag"
                            style={{
                                marginBottom: '10px',
                                padding: '8px 10px',
                                background: 'rgba(255, 229, 181, 0.05)',
                                borderRadius: '6px',
                                border: `1px solid ${draggingHandle ? 'rgba(255, 229, 181, 0.4)' : 'rgba(255, 229, 181, 0.1)'}`,
                                userSelect: 'none',
                                transition: 'border-color 0.15s',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '12px' }}>😊</span>
                                    <span style={{ fontSize: '11px', color: '#FFE5B5', fontWeight: 500 }}>
                                        Mood Effect
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: rangeColor,
                                }}>
                                    {moodMin === moodMax ? (
                                        <>{moodMin > 0 ? '+' : ''}{moodMin}</>
                                    ) : (
                                        <>{moodMin > 0 ? '+' : ''}{moodMin} to {moodMax > 0 ? '+' : ''}{moodMax}</>
                                    )}
                                </span>
                            </div>
                            {/* Visual track */}
                            <div style={{
                                height: '8px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                position: 'relative',
                            }}>
                                {/* Range fill between min and max */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${minPos}%`,
                                    top: 0,
                                    height: '100%',
                                    width: `${maxPos - minPos}%`,
                                    background: rangeColor,
                                    borderRadius: '4px',
                                    opacity: 0.6,
                                }} />
                                {/* Min handle */}
                                <div
                                    onMouseDown={handleMouseDown('min')}
                                    style={{
                                        position: 'absolute',
                                        left: `${minPos}%`,
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: draggingHandle === 'min' ? '#FFE5B5' : '#FFB5B5',
                                        border: '2px solid rgba(0,0,0,0.3)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                        cursor: 'ew-resize',
                                        zIndex: draggingHandle === 'min' ? 2 : 1,
                                    }}
                                />
                                {/* Max handle */}
                                <div
                                    onMouseDown={handleMouseDown('max')}
                                    style={{
                                        position: 'absolute',
                                        left: `${maxPos}%`,
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: draggingHandle === 'max' ? '#FFE5B5' : '#B5FFD9',
                                        border: '2px solid rgba(0,0,0,0.3)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                        cursor: 'ew-resize',
                                        zIndex: draggingHandle === 'max' ? 2 : 1,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })()}

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
            </div >

            {/* Output Handles */}
            {
                data.outputs?.map((output, index) => (
                    <Handle
                        key={output.id}
                        type="source"
                        position={Position.Right}
                        id={output.id}
                        style={{ top: `${30 + index * 24}%` }}
                        title={output.label}
                    />
                ))
            }
        </div >
    );
};

export default memo(EventNode);
