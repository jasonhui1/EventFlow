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

    // Event-level metadata
    const events = useStore((state) => state.events);
    const currentEventId = useStore((state) => state.currentEventId);
    const updateEventMetadata = useStore((state) => state.updateEventMetadata);

    // Start Node input management
    const addStartNodeInput = useStore((state) => state.addStartNodeInput);
    const removeStartNodeInput = useStore((state) => state.removeStartNodeInput);
    const toggleStartNodeInput = useStore((state) => state.toggleStartNodeInput);
    const updateStartNodeInputLabel = useStore((state) => state.updateStartNodeInputLabel);

    // Get nodes for live data updates (must be before any conditional returns)
    const nodes = useStore((state) => state.nodes);

    const [showPreview, setShowPreview] = useState(false);
    // Folder-level metadata
    const folders = useStore((state) => state.folders);
    const selectedFolderId = useStore((state) => state.selectedFolderId);
    const updateFolderMetadata = useStore((state) => state.updateFolderMetadata);
    const setSelectedFolderId = useStore((state) => state.setSelectedFolderId);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Helper to render tag fields (reused for event and folder)
    const renderTagFields = (entity, updateFn, entityId, showWeight = false) => (
        <>
            {/* Tags */}
            <div className="property-group">
                <label className="property-label" style={{ color: '#B5D4FF' }}>
                    🏷️ Tags
                </label>
                <input
                    type="text"
                    className="property-input"
                    value={(entity.tags || []).join(', ')}
                    onChange={(e) => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        updateFn(entityId, { tags });
                    }}
                    placeholder="romance, outdoor, day..."
                />
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Defines what this {showWeight ? 'event' : 'folder (and its children)'} <em>is</em>.
                </p>
            </div>

            {/* Incompatible Tags */}
            <div className="property-group">
                <label className="property-label" style={{ color: '#FFB5B5' }}>
                    🚫 Incompatible With
                </label>
                <input
                    type="text"
                    className="property-input"
                    value={(entity.incompatibleTags || []).join(', ')}
                    onChange={(e) => {
                        const incompatibleTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        updateFn(entityId, { incompatibleTags });
                    }}
                    placeholder="horror, night..."
                />
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Events with these tags cannot appear in the same playlist.
                </p>
            </div>

            {/* Required Tags */}
            <div className="property-group">
                <label className="property-label" style={{ color: '#B5FFD9' }}>
                    🔗 Requires
                </label>
                <input
                    type="text"
                    className="property-input"
                    value={(entity.requiredTags || []).join(', ')}
                    onChange={(e) => {
                        const requiredTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        updateFn(entityId, { requiredTags });
                    }}
                    placeholder="first_date, intro..."
                />
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Only appears after events with these tags have been selected.
                </p>
            </div>

            {/* Weight (event only) */}
            {showWeight && (
                <div className="property-group">
                    <label className="property-label" style={{ color: '#FFE5B5' }}>
                        ⚖️ Weight (Rarity)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={entity.weight || 10}
                            onChange={(e) => {
                                updateFn(entityId, { weight: parseInt(e.target.value) });
                            }}
                            style={{ flex: 1, accentColor: '#FFE5B5' }}
                        />
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#FFE5B5',
                            minWidth: '30px',
                            textAlign: 'right',
                        }}>{entity.weight || 10}</span>
                    </div>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        Higher weight = more likely. Default: 10.
                    </p>
                </div>
            )}
            {/* Forward Constraints Section (Event Only) */}
            {showWeight && (
                <div className="property-group">
                    <label className="property-label" style={{ color: '#C9B5FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>⏭️ Forward Constraints</span>
                        <span style={{ fontSize: '9px', opacity: 0.7, fontWeight: 'normal' }}>Targets NEXT event</span>
                    </label>

                    {/* Next Preferred */}
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block' }}>
                            Preferred (75% Chance)
                        </label>
                        <input
                            type="text"
                            className="property-input"
                            value={(entity.nextPreferredTags || []).join(', ')}
                            onChange={(e) => {
                                const nextPreferredTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                updateFn(entityId, { nextPreferredTags });
                            }}
                            placeholder="sunny, happy..."
                            style={{ borderColor: 'rgba(181, 255, 217, 0.3)', color: '#B5FFD9' }}
                        />
                    </div>

                    {/* Next Required */}
                    <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block' }}>
                            Required (Must Match or Fallback)
                        </label>
                        <input
                            type="text"
                            className="property-input"
                            value={(entity.nextRequiredTags || []).join(', ')}
                            onChange={(e) => {
                                const nextRequiredTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                updateFn(entityId, { nextRequiredTags });
                            }}
                            placeholder="location_x..."
                            style={{ borderColor: 'rgba(255, 206, 181, 0.3)', color: '#FFCEB5' }}
                        />
                    </div>

                    {/* Next Excluded */}
                    <div>
                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'block' }}>
                            Excluded (Strictly Blocked)
                        </label>
                        <input
                            type="text"
                            className="property-input"
                            value={(entity.nextExcludedTags || []).join(', ')}
                            onChange={(e) => {
                                const nextExcludedTags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                updateFn(entityId, { nextExcludedTags });
                            }}
                            placeholder="night, rainy..."
                            style={{ borderColor: 'rgba(255, 100, 100, 0.3)', color: '#ffbdc5' }}
                        />
                    </div>
                </div>
            )}
        </>
    );

    if (!selectedNode) {
        const currentEvent = events.find(e => e.id === currentEventId);
        const selectedFolder = selectedFolderId ? (folders || []).find(f => f.id === selectedFolderId) : null;

        return (
            <div className={`properties-panel ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="properties-header">
                    {!isCollapsed && <h3 className="properties-title">
                        {selectedFolder ? '📁 Folder Properties' : '📋 Event Properties'}
                    </h3>}
                    <button
                        aria-label={isCollapsed ? 'Expand properties' : 'Collapse properties'}
                        className="sidebar-collapse-btn"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                    >
                        {isCollapsed ? '«' : '»'}
                    </button>
                </div>

                {/* Folder Properties */}
                {!isCollapsed && selectedFolder && (
                    <div className="properties-content">
                        <div style={{
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                📁 {selectedFolder.name}
                            </span>
                            <button
                                onClick={() => setSelectedFolderId(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                }}
                            >✕ Close</button>
                        </div>
                        {renderTagFields(selectedFolder, updateFolderMetadata, selectedFolderId, false)}
                        <div style={{
                            padding: '10px',
                            background: 'rgba(181, 212, 255, 0.05)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.4)',
                            lineHeight: '1.6',
                            marginTop: '8px',
                        }}>
                            📌 Tags set here are <strong style={{ color: '#B5D4FF' }}>inherited</strong> by all events inside this folder.
                        </div>
                    </div>
                )}

                {/* Event Properties */}
                {!isCollapsed && !selectedFolder && currentEvent && (
                    <div className="properties-content">
                        {renderTagFields(currentEvent, updateEventMetadata, currentEventId, true)}
                        <div style={{
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.4)',
                            lineHeight: '1.6',
                            marginTop: '8px',
                        }}>
                            💡 Select a node on the canvas to edit node properties.
                        </div>
                    </div>
                )}

                {/* No event open */}
                {!isCollapsed && !selectedFolder && !currentEvent && (
                    <div className="properties-content">
                        <div className="empty-state">
                            <div className="empty-state-icon">🎯</div>
                            <h4 className="empty-state-title">No Event Open</h4>
                            <p className="empty-state-desc">
                                Open an event from the library to view its properties
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const { id, type } = selectedNode;

    // Get live node data from the nodes array (not stale selectedNode snapshot)
    const liveNode = nodes.find(n => n.id === id);
    const data = liveNode?.data || selectedNode.data;

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
                    aria-label={isCollapsed ? 'Expand properties' : 'Collapse properties'}
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

                            <div className="property-group">
                                <label className="property-label" style={{ color: '#FFE5B5' }}>
                                    😊 Mood Effect Range
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px', display: 'block' }}>Min</label>
                                        <input
                                            type="number"
                                            min="-50"
                                            max="50"
                                            value={data.moodChangeMin ?? 0}
                                            onChange={(e) => {
                                                const val = Math.max(-50, Math.min(50, parseInt(e.target.value) || 0));
                                                updateNode(id, { moodChangeMin: Math.min(val, data.moodChangeMax ?? 0) });
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '6px 8px',
                                                background: 'rgba(255, 181, 181, 0.1)',
                                                border: '1px solid rgba(255, 181, 181, 0.3)',
                                                borderRadius: '6px',
                                                color: '#FFB5B5',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                            }}
                                        />
                                    </div>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', paddingTop: '14px' }}>to</span>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px', display: 'block' }}>Max</label>
                                        <input
                                            type="number"
                                            min="-50"
                                            max="50"
                                            value={data.moodChangeMax ?? 0}
                                            onChange={(e) => {
                                                const val = Math.max(-50, Math.min(50, parseInt(e.target.value) || 0));
                                                updateNode(id, { moodChangeMax: Math.max(val, data.moodChangeMin ?? 0) });
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '6px 8px',
                                                background: 'rgba(181, 255, 217, 0.1)',
                                                border: '1px solid rgba(181, 255, 217, 0.3)',
                                                borderRadius: '6px',
                                                color: '#B5FFD9',
                                                fontSize: '13px',
                                                textAlign: 'center',
                                            }}
                                        />
                                    </div>
                                </div>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                                    Random value picked between min and max during simulation
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
