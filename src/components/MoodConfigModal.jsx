import React, { useState } from 'react';
import useStore from '../store/useStore';

const MoodConfigModal = ({ onClose }) => {
    const moodConfig = useStore((state) => state.moodConfig);
    const addMoodTag = useStore((state) => state.addMoodTag);
    const removeMoodTag = useStore((state) => state.removeMoodTag);
    const updateMoodTagWeight = useStore((state) => state.updateMoodTagWeight);
    const updateInitialMoodRange = useStore((state) => state.updateInitialMoodRange);

    const [newTags, setNewTags] = useState({
        very_negative: '',
        negative: '',
        neutral: '',
        positive: '',
        very_positive: '',
    });

    const tierColors = {
        very_negative: '#FFB5B5',
        negative: '#FFCEB5',
        neutral: '#D4D4D4',
        positive: '#B5FFD9',
        very_positive: '#B5E5FF',
    };

    const tierEmojis = {
        very_negative: '😠',
        negative: '😕',
        neutral: '😐',
        positive: '😊',
        very_positive: '😄',
    };

    const handleAddTag = (tierId) => {
        const tag = newTags[tierId].trim();
        if (tag) {
            addMoodTag(tierId, tag, 50);
            setNewTags(prev => ({ ...prev, [tierId]: '' }));
        }
    };

    const handleKeyDown = (e, tierId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(tierId);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal nowheel"
                onClick={(e) => e.stopPropagation()}
                style={{ minWidth: '700px', maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column' }}
            >
                <div className="modal-header">
                    <h3 className="modal-title">😊 Mood Expression Configuration</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {/* Initial Mood Range */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '12px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.9)',
                        }}>
                            🎲 Initial Mood Range
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Min:</span>
                            <input
                                type="number"
                                min="-100"
                                max="0"
                                value={moodConfig.initialMoodRange?.min ?? -20}
                                onChange={(e) => updateInitialMoodRange(
                                    parseInt(e.target.value),
                                    moodConfig.initialMoodRange?.max ?? 20
                                )}
                                style={{
                                    width: '70px',
                                    padding: '6px 10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                }}
                            />
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Max:</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={moodConfig.initialMoodRange?.max ?? 20}
                                onChange={(e) => updateInitialMoodRange(
                                    moodConfig.initialMoodRange?.min ?? -20,
                                    parseInt(e.target.value)
                                )}
                                style={{
                                    width: '70px',
                                    padding: '6px 10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                }}
                            />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
                                Starting mood will be random in this range
                            </span>
                        </div>
                    </div>

                    {/* Tier Configuration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {moodConfig.tiers?.map((tier) => (
                            <div
                                key={tier.id}
                                style={{
                                    padding: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    border: `1px solid ${tierColors[tier.id]}30`,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px' }}>{tierEmojis[tier.id]}</span>
                                        <span style={{
                                            fontWeight: 600,
                                            color: tierColors[tier.id],
                                            fontSize: '14px',
                                        }}>
                                            {tier.label}
                                        </span>
                                        <span style={{
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.4)',
                                            fontFamily: 'monospace',
                                        }}>
                                            ({tier.min} to {tier.max})
                                        </span>
                                    </div>
                                </div>

                                {/* Tags Grid */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                    marginBottom: '12px',
                                }}>
                                    {(moodConfig.tags[tier.id] || []).map((tagItem) => (
                                        <div
                                            key={tagItem.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 10px',
                                                background: `${tierColors[tier.id]}15`,
                                                border: `1px solid ${tierColors[tier.id]}30`,
                                                borderRadius: '6px',
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '12px',
                                                color: tierColors[tier.id],
                                                fontFamily: 'monospace',
                                            }}>
                                                {tagItem.tag}
                                            </span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={tagItem.weight}
                                                onChange={(e) => updateMoodTagWeight(tier.id, tagItem.id, parseInt(e.target.value))}
                                                style={{ width: '50px', accentColor: tierColors[tier.id] }}
                                                title={`Weight: ${tagItem.weight}`}
                                            />
                                            <span style={{
                                                fontSize: '10px',
                                                color: 'rgba(255,255,255,0.4)',
                                                minWidth: '24px',
                                            }}>
                                                {tagItem.weight}
                                            </span>
                                            <button
                                                onClick={() => removeMoodTag(tier.id, tagItem.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'rgba(255,100,100,0.6)',
                                                    fontSize: '14px',
                                                    cursor: 'pointer',
                                                    padding: '0 2px',
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Tag Input */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={newTags[tier.id]}
                                        onChange={(e) => setNewTags(prev => ({ ...prev, [tier.id]: e.target.value }))}
                                        onKeyDown={(e) => handleKeyDown(e, tier.id)}
                                        placeholder="Add danbooru tag..."
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            fontSize: '12px',
                                        }}
                                    />
                                    <button
                                        onClick={() => handleAddTag(tier.id)}
                                        style={{
                                            padding: '8px 16px',
                                            background: `${tierColors[tier.id]}20`,
                                            border: `1px solid ${tierColors[tier.id]}40`,
                                            borderRadius: '6px',
                                            color: tierColors[tier.id],
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="action-btn primary" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoodConfigModal;
