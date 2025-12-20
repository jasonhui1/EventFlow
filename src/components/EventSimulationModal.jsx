import React, { useState, useMemo, useCallback } from 'react';
import useStore from '../store/useStore';

const EventSimulationModal = ({ onClose }) => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const events = useStore((state) => state.events);
    const simulateEvent = useStore((state) => state.simulateEvent);
    const [copied, setCopied] = useState(false);
    const [seed, setSeed] = useState(0); // Used to trigger refresh

    const simulatedResults = useMemo(() => {
        return simulateEvent(nodes, edges);
    }, [nodes, edges, events, simulateEvent, seed]);

    const handleRefresh = () => {
        setSeed(prev => prev + 1);
    };

    const handleCopyAll = async () => {
        try {
            const allText = simulatedResults
                .map(res => `### ${res.label} (${res.type})\n${res.prompt}\n`)
                .join('\n');
            await navigator.clipboard.writeText(allText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy keys:', err);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'eventNode': return '#FFB5C5';
            case 'groupNode': return '#B5D4FF';
            case 'branchNode': return '#FFCEB5';
            case 'referenceNode': return '#E5D4FF';
            default: return 'rgba(255,255,255,0.6)';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '600px', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3 className="modal-title">🔮 Event Simulation Output</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    <div style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '16px',
                        lineHeight: '1.5',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            Generated single-path simulation (Start → End).<br />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Start, End, and Branch nodes are hidden from output.</span>
                        </div>
                        <button
                            className="action-btn"
                            onClick={handleRefresh}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                            🎲 Resimulate
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {simulatedResults.map((result) => (
                            <div key={result.id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '8px 12px',
                                    background: 'rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: getTypeColor(result.type)
                                    }} />
                                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{result.label}</span>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', fontFamily: 'monospace' }}>
                                        {result.type}
                                    </span>
                                </div>
                                <div style={{
                                    padding: '12px',
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    lineHeight: '1.5'
                                }}>
                                    {result.prompt || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No composed prompt output.</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {simulatedResults.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                            No valid path from Start -&gt; End found, or graph is empty (requires Start Node).
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="action-btn primary"
                        onClick={handleCopyAll}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {copied ? '✓ Copied All!' : '📋 Copy Output'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventSimulationModal;
