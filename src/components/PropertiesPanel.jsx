import React, { useState } from 'react';
import useStore from '../store/useStore';
import PromptList from './PromptList';
import PromptPreview from './PromptPreview';
import ConfirmModal from './ConfirmModal';

const PropertiesPanel = () => {
    const selectedNode = useStore((state) => state.selectedNode);
    const updateNode = useStore((state) => state.updateNode);
    const deleteNode = useStore((state) => state.deleteNode);
    const updateOutputWeight = useStore((state) => state.updateOutputWeight);
    const addNodeInput = useStore((state) => state.addNodeInput);
    const addNodeOutput = useStore((state) => state.addNodeOutput);
    const getInheritedPrompts = useStore((state) => state.getInheritedPrompts);
    const getAllUpstreamNodes = useStore((state) => state.getAllUpstreamNodes);
    const toggleInheritedSource = useStore((state) => state.toggleInheritedSource);
    const sessionConfirmDeleteNode = useStore((state) => state.sessionConfirmDeleteNode);
    const setSessionConfirmDeleteNode = useStore((state) => state.setSessionConfirmDeleteNode);

    // Start Node input management
    const addStartNodeInput = useStore((state) => state.addStartNodeInput);
    const removeStartNodeInput = useStore((state) => state.removeStartNodeInput);
    const toggleStartNodeInput = useStore((state) => state.toggleStartNodeInput);
    const updateStartNodeInputLabel = useStore((state) => state.updateStartNodeInputLabel);

    const [showPreview, setShowPreview] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!selectedNode) {
        return (
            <div className={`properties-panel ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="properties-header">
                    {!isCollapsed && <h3 className="properties-title">Properties</h3>}
                    <button
                        className="sidebar-collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                    >
                        {isCollapsed ? '«' : '»'}
                    </button>
                </div>
                {!isCollapsed && (
                    <div className="properties-content">
                        <div className="empty-state">
                            <div className="empty-state-icon">🎯</div>
                            <h4 className="empty-state-title">Select a Node</h4>
                            <p className="empty-state-desc">
                                Click on a node to view and edit its properties
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const { id, type, data } = selectedNode;

    const getNodeTypeName = () => {
        switch (type) {
            case 'eventNode': return 'Event Node';
            case 'groupNode': return 'Group Node';
            case 'branchNode': return 'Branch Node';
            case 'referenceNode': return 'Reference Node';
            case 'startNode': return 'Start Node';
            case 'endNode': return 'End Node';
            default: return 'Node';
        }
    };

    const getNodeColor = () => {
        switch (type) {
            case 'eventNode': return '#FFB5C5';
            case 'groupNode': return '#B5D4FF';
            case 'branchNode': return '#FFCEB5';
            case 'referenceNode': return '#E5D4FF';
            case 'startNode': return '#B5FFD9';
            case 'endNode': return '#FFB5B5';
            default: return '#C9B5FF';
        }
    };

    return (
        <div className={`properties-panel ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="properties-header">
                {!isCollapsed && (
                    <h3 className="properties-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: getNodeColor(),
                        }} />
                        {getNodeTypeName()}
                    </h3>
                )}
                <button
                    className="sidebar-collapse-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                    {isCollapsed ? '«' : '»'}
                </button>
            </div>

            {!isCollapsed && (
                <div className="properties-content">
                    {/* Label */}
                    <div className="property-group">
                        <label className="property-label">Label</label>
                        <input
                            type="text"
                            className="property-input"
                            value={data.label || ''}
                            onChange={(e) => updateNode(id, { label: e.target.value })}
                        />
                    </div>

                    {/* Start Node Inputs Configuration */}
                    {type === 'startNode' && (
                        <div className="property-group">
                            <label className="property-label" style={{ color: '#B5FFD9' }}>
                                🔌 Configurable Inputs
                            </label>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                Define input parameters that can be toggled on/off when this event is referenced.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {(data.inputs || []).map((input) => (
                                    <div
                                        key={input.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 10px',
                                            background: input.enabled
                                                ? 'rgba(181, 255, 217, 0.1)'
                                                : 'rgba(255,255,255,0.03)',
                                            borderRadius: '6px',
                                            border: `1px solid ${input.enabled ? 'rgba(181, 255, 217, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={input.enabled}
                                            onChange={() => toggleStartNodeInput(id, input.id)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <input
                                            type="text"
                                            value={input.label}
                                            onChange={(e) => updateStartNodeInputLabel(id, input.id, e.target.value)}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                color: input.enabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                                                fontSize: '12px',
                                                textDecoration: input.enabled ? 'none' : 'line-through',
                                            }}
                                        />
                                        <button
                                            onClick={() => removeStartNodeInput(id, input.id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'rgba(255,100,100,0.6)',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                padding: '0 4px',
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addStartNodeInput(id)}
                                    style={{
                                        background: 'rgba(181, 255, 217, 0.1)',
                                        border: '1px dashed rgba(181, 255, 217, 0.3)',
                                        borderRadius: '6px',
                                        color: '#B5FFD9',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                    }}
                                >
                                    + Add Input Parameter
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content (for Event Nodes) */}
                    {type === 'eventNode' && (
                        <>
                            <div className="property-group">
                                <label className="property-label">Content / Description</label>
                                <textarea
                                    className="property-input property-textarea"
                                    value={data.content || ''}
                                    onChange={(e) => updateNode(id, { content: e.target.value })}
                                    placeholder="Describe what happens in this event..."
                                    style={{ minHeight: '60px' }}
                                />
                            </div>

                            <div className="property-group">
                                <label className="property-label" style={{ color: '#FFB5C5' }}>
                                    🎯 Local Prompt (This Event Only)
                                </label>
                                <PromptList
                                    prompts={data.localPrompt}
                                    onChange={(newPrompts) => updateNode(id, { localPrompt: newPrompts })}
                                    placeholder="outfit, pose, expression for this event only..."
                                    color="#FFB5C5"
                                />
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                    Applies only to this specific event
                                </p>
                            </div>

                            <div className="property-group">
                                <label className="property-label" style={{ color: '#B5FFD9' }}>
                                    🔗 Inherited Prompt (Carries Forward)
                                </label>
                                <PromptList
                                    prompts={data.inheritedPrompt}
                                    onChange={(newPrompts) => updateNode(id, { inheritedPrompt: newPrompts })}
                                    placeholder="outfit changes, location that persists..."
                                    color="#B5FFD9"
                                />
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                    Inherits to all connected downstream nodes
                                </p>
                            </div>
                        </>
                    )}


                    <div className="property-group">
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#A0A0C0'
                        }}>
                            <input
                                type="checkbox"
                                checked={data.usePerspective || false}
                                onChange={(e) => updateNode(id, { usePerspective: e.target.checked })}
                                style={{ cursor: 'pointer' }}
                            />
                            📐 Perspective & Foreshortening
                        </label>
                    </div>

                    {/* Fixed Prompt (for Group Nodes) */}
                    {type === 'groupNode' && (
                        <div className="property-group">
                            <label className="property-label">Fixed Prompt</label>
                            <textarea
                                className="property-input property-textarea"
                                value={data.fixedPrompt || ''}
                                onChange={(e) => updateNode(id, { fixedPrompt: e.target.value })}
                                placeholder="Shared prompt for all connected events..."
                                style={{ fontFamily: 'monospace', fontSize: '11px' }}
                            />
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                                This prompt applies to all events in this group
                            </p>
                        </div>
                    )}

                    {/* Branch Condition */}
                    {type === 'branchNode' && (
                        <div className="property-group">
                            <label className="property-label">Condition (Optional)</label>
                            <input
                                type="text"
                                className="property-input"
                                value={data.condition || ''}
                                onChange={(e) => updateNode(id, { condition: e.target.value })}
                                placeholder="e.g., 'if sunny', 'random choice'"
                            />
                        </div>
                    )}

                    {/* Branch Weights */}
                    {type === 'branchNode' && data.outputs && (
                        <div className="property-group">
                            <label className="property-label">Branch Probabilities</label>
                            <div className="probability-slider-container">
                                {data.outputs.map((output, index) => {
                                    const totalWeight = data.outputs.reduce((sum, o) => sum + (o.weight || 50), 0);
                                    const percentage = Math.round((output.weight / totalWeight) * 100);

                                    return (
                                        <div key={output.id} style={{ marginBottom: '12px' }}>
                                            <div className="probability-labels">
                                                <span className="probability-label">{output.label}</span>
                                                <span className="probability-value">{percentage}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                className="probability-slider"
                                                min="1"
                                                max="100"
                                                value={output.weight || 50}
                                                onChange={(e) => updateOutputWeight(id, output.id, parseInt(e.target.value))}
                                                style={{
                                                    background: `linear-gradient(90deg, var(--pastel-peach) ${output.weight}%, rgba(255,255,255,0.1) ${output.weight}%)`,
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Inputs Management */}
                    <div className="property-group">
                        <label className="property-label">Inputs</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {data.inputs?.map((input, index) => (
                                <div
                                    key={input.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        background: 'rgba(181, 212, 255, 0.1)',
                                        borderRadius: '6px',
                                    }}
                                >
                                    <span style={{ color: '#B5D4FF', fontSize: '12px' }}>◀</span>
                                    <input
                                        type="text"
                                        value={input.label}
                                        onChange={(e) => {
                                            const newInputs = data.inputs.map((inp) =>
                                                inp.id === input.id ? { ...inp, label: e.target.value } : inp
                                            );
                                            updateNode(id, { inputs: newInputs });
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.8)',
                                            fontSize: '12px',
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => addNodeInput(id)}
                                style={{
                                    background: 'rgba(181, 212, 255, 0.1)',
                                    border: '1px dashed rgba(181, 212, 255, 0.3)',
                                    borderRadius: '6px',
                                    color: '#B5D4FF',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                }}
                            >
                                + Add Input
                            </button>
                        </div>
                    </div>

                    {/* Outputs Management */}
                    <div className="property-group">
                        <label className="property-label">Outputs</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {data.outputs?.map((output, index) => (
                                <div
                                    key={output.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 10px',
                                        background: 'rgba(255, 181, 197, 0.1)',
                                        borderRadius: '6px',
                                    }}
                                >
                                    <input
                                        type="text"
                                        value={output.label}
                                        onChange={(e) => {
                                            const newOutputs = data.outputs.map((out) =>
                                                out.id === output.id ? { ...out, label: e.target.value } : out
                                            );
                                            updateNode(id, { outputs: newOutputs });
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255,255,255,0.8)',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <span style={{ color: '#FFB5C5', fontSize: '12px' }}>▶</span>
                                </div>
                            ))}
                            <button
                                onClick={() => addNodeOutput(id)}
                                style={{
                                    background: 'rgba(255, 181, 197, 0.1)',
                                    border: '1px dashed rgba(255, 181, 197, 0.3)',
                                    borderRadius: '6px',
                                    color: '#FFB5C5',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                }}
                            >
                                + Add Output
                            </button>
                        </div>
                    </div>

                    {/* Inherited Prompts Section (for Event Nodes) */}
                    {type === 'eventNode' && (
                        <div className="property-group">
                            <label className="property-label" style={{ color: '#C9B5FF' }}>
                                📥 Incoming Inherited Prompts
                            </label>
                            {(() => {
                                const upstreamNodes = getAllUpstreamNodes(id);
                                const disabledSources = data.disabledInheritedSources || [];

                                if (upstreamNodes.length === 0) {
                                    return (
                                        <div style={{
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.4)',
                                            textAlign: 'center',
                                        }}>
                                            No upstream nodes connected
                                        </div>
                                    );
                                }

                                // Sort by depth (closest first) and filter to only show nodes with prompts
                                const sortedNodes = [...upstreamNodes].sort((a, b) => a.depth - b.depth);

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {sortedNodes.map((upstream, index) => {
                                            const isDisabled = disabledSources.includes(upstream.nodeId);
                                            const hasPrompt = !!upstream.prompt;
                                            const depthIndicator = '→'.repeat(upstream.depth + 1);

                                            return (
                                                <div
                                                    key={`${upstream.nodeId}-${index}`}
                                                    style={{
                                                        padding: '10px 12px',
                                                        background: isDisabled
                                                            ? 'rgba(255,100,100,0.05)'
                                                            : 'rgba(181, 255, 217, 0.08)',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${isDisabled ? 'rgba(255,100,100,0.2)' : 'rgba(181, 255, 217, 0.15)'}`,
                                                        opacity: isDisabled ? 0.6 : 1,
                                                        marginLeft: upstream.depth * 8,
                                                    }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        marginBottom: hasPrompt ? '6px' : 0,
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                                                                {depthIndicator}
                                                            </span>
                                                            <span style={{ fontSize: '12px' }}>
                                                                {upstream.nodeType === 'groupNode' ? '📁' : '🔗'}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                color: 'rgba(255,255,255,0.8)',
                                                                fontWeight: 500,
                                                            }}>
                                                                {upstream.nodeLabel}
                                                            </span>
                                                        </div>
                                                        <label style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            cursor: 'pointer',
                                                        }}>
                                                            <span style={{
                                                                fontSize: '9px',
                                                                color: isDisabled ? '#ff6b6b' : '#B5FFD9',
                                                            }}>
                                                                {isDisabled ? 'Off' : 'On'}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                checked={!isDisabled}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleInheritedSource(id, upstream.nodeId);
                                                                }}
                                                                style={{ cursor: 'pointer' }}
                                                            />
                                                        </label>
                                                    </div>
                                                    {hasPrompt && (
                                                        <div style={{
                                                            fontSize: '10px',
                                                            color: 'rgba(255,255,255,0.5)',
                                                            fontFamily: 'monospace',
                                                            textDecoration: isDisabled ? 'line-through' : 'none',
                                                            wordBreak: 'break-word',
                                                        }}>
                                                            {Array.isArray(upstream.prompt) ? upstream.prompt.join(', ') : upstream.prompt}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {/* Preview Prompt Button */}
                    {type === 'eventNode' && (
                        <div className="property-group">
                            <button
                                onClick={() => setShowPreview(true)}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #C9B5FF, #B5D4FF)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#1a1a2e',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                }}
                            >
                                📝 Preview Full Prompt
                            </button>
                        </div>
                    )}

                    {/* Delete Node */}
                    <div className="property-group" style={{ marginTop: '24px' }}>
                        <button
                            onClick={() => {
                                if (sessionConfirmDeleteNode) {
                                    deleteNode(id);
                                } else {
                                    setShowDeleteModal(true);
                                }
                            }}
                            style={{
                                width: '100%',
                                background: 'rgba(255, 100, 100, 0.1)',
                                border: '1px solid rgba(255, 100, 100, 0.3)',
                                borderRadius: '8px',
                                color: '#ff6b6b',
                                padding: '10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                            }}
                        >
                            🗑️ Delete Node
                        </button>
                    </div>
                </div>
            )}

            {/* Prompt Preview Modal */}
            {showPreview && (
                <PromptPreview
                    nodeId={id}
                    onClose={() => setShowPreview(false)}
                />
            )}

            {/* Delete Node Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => {
                    deleteNode(id);
                    setShowDeleteModal(false);
                }}
                title="Delete Node"
                message={`Are you sure you want to delete "${data.label}"? This cannot be undone.`}
                type="delete"
                confirmText="Delete"
                showDontAskAgain={true}
                onDontAskAgainChange={setSessionConfirmDeleteNode}
            />
        </div>
    );
};

export default PropertiesPanel;
