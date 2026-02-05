import React, { memo, useState, useMemo } from 'react';
import { NodeResizer } from '@xyflow/react';
import useStore from '../../store/useStore';

const FieldNode = ({ id, data, selected, style }) => {
    const updateNode = useStore((state) => state.updateNode);
    const nodes = useStore((state) => state.nodes);
    const [showSettings, setShowSettings] = useState(false);

    // Find children: nodes that overlap with this Field's bounds
    const childNodes = useMemo(() => {
        // Get Field's position and dimensions from the store
        const fieldNode = nodes.find(n => n.id === id);
        if (!fieldNode) return [];

        const fieldX = fieldNode.position?.x || 0;
        const fieldY = fieldNode.position?.y || 0;
        // Use top-level width/height (set by React Flow's applyNodeChanges on resize),
        // fallback to style (initial value), then defaults
        const fieldWidth = fieldNode.width || fieldNode.style?.width || 400;
        const fieldHeight = fieldNode.height || fieldNode.style?.height || 300;

        return nodes.filter(node => {
            if (node.id === id || node.type === 'fieldNode') return false; // Skip self and other fields for now

            // Node position is top-left corner
            const nodeX = node.position?.x || 0;
            const nodeY = node.position?.y || 0;

            // Check if node's top-left is within Field bounds
            return (
                nodeX >= fieldX &&
                nodeX < fieldX + fieldWidth &&
                nodeY >= fieldY &&
                nodeY < fieldY + fieldHeight
            );
        });
    }, [nodes, id]);

    // Get child weights, defaulting to 50 for each
    const getWeight = (childId) => data.childWeights?.[childId] ?? 50;
    const totalWeight = childNodes.reduce((sum, child) => sum + getWeight(child.id), 0) || 100;

    const handleWeightChange = (childId, newWeight) => {
        const newWeights = { ...(data.childWeights || {}), [childId]: newWeight };
        updateNode(id, { childWeights: newWeights });
    };

    return (
        <div
            className={`field-node field-container ${selected ? 'selected' : ''}`}
            style={{
                width: '100%',
                height: '100%',
                minWidth: 200,
                minHeight: 150,
                position: 'relative',
            }}
        >
            <NodeResizer
                color="#B5F5FF"
                isVisible={selected}
                minWidth={200}
                minHeight={150}
                handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
                lineStyle={{ border: '1px solid #B5F5FF' }}
            />

            {/* Header Bar */}
            <div
                className="field-header"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, rgba(181, 245, 255, 0.15), rgba(181, 212, 255, 0.08))',
                    borderBottom: '1px dashed rgba(181, 245, 255, 0.3)',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 10,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🎲</span>
                    <input
                        className="nodrag"
                        value={data.label}
                        onChange={(e) => updateNode(id, { label: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#B5F5FF',
                            fontWeight: 600,
                            fontSize: '12px',
                            width: '80px',
                        }}
                    />
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                        ({childNodes.length} items)
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                        <span>Pick:</span>
                        <input
                            type="number"
                            min="1"
                            max={Math.max(1, childNodes.length)}
                            value={data.selectCount ?? 1}
                            onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                updateNode(id, { selectCount: Math.max(1, Math.min(childNodes.length || 1, val)) });
                            }}
                            className="nodrag"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '3px',
                                color: '#fff',
                                width: '32px',
                                padding: '2px',
                                textAlign: 'center',
                                fontSize: '10px',
                            }}
                        />
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowSettings(!showSettings);
                        }}
                        className="nodrag"
                        style={{
                            background: showSettings ? 'rgba(181,245,255,0.2)' : 'transparent',
                            border: '1px solid rgba(181,245,255,0.3)',
                            borderRadius: '4px',
                            color: '#B5F5FF',
                            padding: '2px 6px',
                            cursor: 'pointer',
                            fontSize: '10px',
                        }}
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Settings Panel (collapsible) */}
            {showSettings && (
                <div
                    className="field-settings nodrag"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: '36px',
                        right: '4px',
                        background: 'rgba(30, 32, 40, 0.95)',
                        border: '1px solid rgba(181, 245, 255, 0.3)',
                        borderRadius: '6px',
                        padding: '8px',
                        zIndex: 100,
                        minWidth: '180px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                    }}
                >
                    <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                            type="checkbox"
                            checked={data.randomizeOrder ?? true}
                            onChange={(e) => updateNode(id, { randomizeOrder: e.target.checked })}
                            style={{ accentColor: '#B5F5FF' }}
                        />
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Shuffle Order</span>
                    </div>

                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
                        Child Weights:
                    </div>

                    {childNodes.length === 0 ? (
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                            No nodes inside
                        </div>
                    ) : (
                        childNodes.map(child => {
                            const weight = getWeight(child.id);
                            const pct = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
                            return (
                                <div key={child.id} style={{ marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                                        <span>{child.data?.label || child.type}</span>
                                        <span style={{ color: '#B5F5FF' }}>{pct}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={weight}
                                        onChange={(e) => handleWeightChange(child.id, parseInt(e.target.value))}
                                        style={{ width: '100%', height: '4px', accentColor: '#B5F5FF' }}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(FieldNode);
