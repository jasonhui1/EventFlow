import React, { useState } from 'react';
import useStore from '../store/useStore';

const PromptPreview = ({ nodeId, onClose }) => {
    const getComposedPrompt = useStore((state) => state.getComposedPrompt);
    const generateTestPrompt = useStore((state) => state.generateTestPrompt);
    const [copied, setCopied] = useState(false);
    const [prompt, setPrompt] = useState(() => getComposedPrompt(nodeId));

    const handleRefresh = () => {
        setPrompt(generateTestPrompt(nodeId, true));
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt.full);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'event': return '#C9B5FF';
            case 'eventNode': return '#B5FFD9';
            case 'groupNode': return '#B5D4FF';
            case 'local': return '#FFB5C5';
            case 'inherited': return '#B5FFD9';
            case 'shot': return '#FFCEB5';
            default: return 'rgba(255,255,255,0.6)';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'event': return '📋';
            case 'eventNode': return '🔗';
            case 'groupNode': return '📁';
            case 'local': return '🎯';
            case 'inherited': return '➡️';
            case 'shot': return '📐';
            default: return '•';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">📝 Prompt Preview</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                    {/* Prompt Breakdown */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                        }}>
                            Prompt Components
                        </div>

                        {prompt.parts.length === 0 ? (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '13px',
                            }}>
                                No prompts defined for this node
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {prompt.parts.map((part, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '8px',
                                            borderLeft: `3px solid ${getTypeColor(part.type)}`,
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '6px',
                                        }}>
                                            <span>{getTypeIcon(part.type)}</span>
                                            <span style={{
                                                fontSize: '11px',
                                                color: getTypeColor(part.type),
                                                fontWeight: 500,
                                            }}>
                                                {part.label}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'rgba(255,255,255,0.8)',
                                            fontFamily: 'monospace',
                                            wordBreak: 'break-word',
                                        }}>
                                            {part.prompt}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Combined Prompt */}
                    <div>
                        <div style={{
                            fontSize: '11px',
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <span>Combined Prompt</span>
                            <span style={{
                                fontSize: '10px',
                                color: 'rgba(255,255,255,0.3)',
                                textTransform: 'none',
                            }}>
                                {prompt.full.length} characters
                            </span>
                        </div>

                        <div style={{
                            padding: '16px',
                            background: 'rgba(201, 181, 255, 0.1)',
                            border: '1px solid rgba(201, 181, 255, 0.2)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: 'monospace',
                            lineHeight: '1.6',
                            wordBreak: 'break-word',
                            minHeight: '80px',
                        }}>
                            {prompt.full || <span style={{ color: 'rgba(255,255,255,0.3)' }}>No prompt generated</span>}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="action-btn"
                        onClick={handleRefresh}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        🔄 Refresh
                    </button>
                    <button
                        className="action-btn primary"
                        onClick={handleCopy}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {copied ? '✓ Copied!' : '📋 Copy Prompt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptPreview;
