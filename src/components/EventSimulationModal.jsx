import React, { useState, useMemo, useCallback } from 'react';
import useStore from '../store/useStore';
import { generatePlaylist } from '../utils/playlistGenerator';

const EventSimulationModal = ({ onClose }) => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const events = useStore((state) => state.events);
    const simulateEvent = useStore((state) => state.simulateEvent);
    const [copied, setCopied] = useState(false);
    const [seed, setSeed] = useState(0); // Used to trigger refresh
    const [mode, setMode] = useState('single'); // 'single' or 'playlist'
    const [playlistLength, setPlaylistLength] = useState(3);
    const [playlistResults, setPlaylistResults] = useState(null);

    const simulatedResults = useMemo(() => {
        if (mode !== 'single') return [];
        return simulateEvent(nodes, edges);
    }, [nodes, edges, events, simulateEvent, seed, mode]);

    const handleRefresh = () => {
        setSeed(prev => prev + 1);
        if (mode === 'playlist') {
            handleGeneratePlaylist();
        }
    };

    const handleGeneratePlaylist = useCallback(() => {
        const playlist = generatePlaylist(events, playlistLength);

        // Simulate each event in the playlist
        const results = playlist.map(event => {
            const simResults = simulateEvent(
                event.nodes || [],
                event.edges || [],
            );
            return {
                event,
                results: simResults,
            };
        });

        setPlaylistResults(results);
    }, [events, playlistLength, simulateEvent]);

    const handleCopyAll = async () => {
        try {
            let allText = '';
            if (mode === 'single') {
                allText = simulatedResults
                    .map(res => `### ${res.label} (${res.type})\n${res.prompt}\n`)
                    .join('\n');
            } else if (playlistResults) {
                allText = playlistResults
                    .map(({ event, results }) => {
                        const header = `## ${event.name}\n`;
                        const body = results
                            .map(res => `### ${res.label} (${res.type})\n${res.prompt}\n`)
                            .join('\n');
                        return header + body;
                    })
                    .join('\n---\n\n');
            }
            await navigator.clipboard.writeText(allText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
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

    const renderResultCard = (result) => (
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
                {result.mood !== undefined && (
                    <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: result.mood > 20 ? 'rgba(181, 255, 217, 0.2)' :
                            result.mood < -20 ? 'rgba(255, 181, 181, 0.2)' :
                                'rgba(255, 255, 255, 0.1)',
                        color: result.mood > 20 ? '#B5FFD9' :
                            result.mood < -20 ? '#FFB5B5' :
                                'rgba(255,255,255,0.6)',
                    }}>
                        😊 {result.mood > 0 ? '+' : ''}{result.mood}
                        {result.moodTag && ` → ${result.moodTag}`}
                    </span>
                )}
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
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '600px', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3 className="modal-title">🔮 Event Simulation Output</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {/* Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '4px',
                    }}>
                        <button
                            onClick={() => setMode('single')}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: mode === 'single' ? 'rgba(201, 181, 255, 0.3)' : 'transparent',
                                color: mode === 'single' ? '#C9B5FF' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.2s',
                            }}
                        >
                            📌 Single Event
                        </button>
                        <button
                            onClick={() => setMode('playlist')}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: mode === 'playlist' ? 'rgba(181, 255, 217, 0.3)' : 'transparent',
                                color: mode === 'playlist' ? '#B5FFD9' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.2s',
                            }}
                        >
                            🎶 Playlist
                        </button>
                    </div>

                    {/* Single Event Mode */}
                    {mode === 'single' && (
                        <>
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
                                {simulatedResults.map(renderResultCard)}
                            </div>

                            {simulatedResults.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                    No valid path from Start &gt; End found, or graph is empty (requires Start Node).
                                </div>
                            )}
                        </>
                    )}

                    {/* Playlist Mode */}
                    {mode === 'playlist' && (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '16px',
                                padding: '12px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
                                    Playlist Length:
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={events.length}
                                    value={playlistLength}
                                    onChange={(e) => setPlaylistLength(Math.max(1, Math.min(events.length, parseInt(e.target.value) || 1)))}
                                    style={{
                                        width: '60px',
                                        padding: '6px 8px',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '13px',
                                        textAlign: 'center',
                                    }}
                                />
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                    / {events.length} events available
                                </span>
                                <button
                                    className="action-btn"
                                    onClick={handleGeneratePlaylist}
                                    style={{
                                        marginLeft: 'auto',
                                        fontSize: '12px',
                                        padding: '6px 16px',
                                        background: 'linear-gradient(135deg, rgba(181, 255, 217, 0.2), rgba(181, 212, 255, 0.2))',
                                        border: '1px solid rgba(181, 255, 217, 0.3)',
                                    }}
                                >
                                    🎲 Generate
                                </button>
                            </div>

                            {/* Tag summary */}
                            <div style={{
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.4)',
                                marginBottom: '16px',
                                lineHeight: '1.5',
                            }}>
                                Events with <span style={{ color: '#B5D4FF' }}>tags</span>,{' '}
                                <span style={{ color: '#FFB5B5' }}>incompatibilities</span>, and{' '}
                                <span style={{ color: '#B5FFD9' }}>requirements</span> will be filtered automatically.
                            </div>

                            {playlistResults && playlistResults.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {playlistResults.map(({ event, results }, idx) => (
                                        <div key={event.id + '-' + idx}>
                                            {/* Event header */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                marginBottom: '10px',
                                                paddingBottom: '8px',
                                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #C9B5FF, #B5D4FF)',
                                                    color: '#1a1a2e',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                }}>{idx + 1}</span>
                                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                                    {event.name}
                                                </span>
                                                {(event.tags || []).length > 0 && (
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                                                        {event.tags.map(tag => (
                                                            <span key={tag} style={{
                                                                fontSize: '10px',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: 'rgba(181, 212, 255, 0.15)',
                                                                color: '#B5D4FF',
                                                            }}>{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '12px' }}>
                                                {results.map(renderResultCard)}
                                                {results.length === 0 && (
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', padding: '8px' }}>
                                                        No output from this event flow.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {playlistResults && playlistResults.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                    No compatible events could be selected. Check your tag/requirement configuration.
                                </div>
                            )}

                            {!playlistResults && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                    Click &ldquo;Generate&rdquo; to create a playlist from your event library.
                                </div>
                            )}
                        </>
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
