import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';

const BulkExportModal = ({ onClose }) => {
    const events = useStore((state) => state.events);
    const simulateEventInStore = useStore((state) => state.simulateEvent);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exportResult, setExportResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const filteredEvents = useMemo(() => {
        return events.filter(e =>
            e.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [events, searchTerm]);

    const toggleEventSelection = (eventId) => {
        setSelectedEventIds(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const handleSelectAll = () => {
        if (selectedEventIds.length === filteredEvents.length) {
            setSelectedEventIds([]);
        } else {
            setSelectedEventIds(filteredEvents.map(e => e.id));
        }
    };

    const handleExport = () => {
        const selectedEvents = events.filter(e => selectedEventIds.includes(e.id));
        let allPrompts = [];

        selectedEvents.forEach(event => {
            allPrompts.push(`--- [Event: ${event.name}] ---`);
            const simulatedNodes = simulateEventInStore(event.nodes || [], event.edges || []);
            const prompts = simulatedNodes.map(node => node.prompt);

            if (prompts.length === 0) {
                if (!event.nodes || event.nodes.length === 0) {
                    allPrompts.push("(No nodes found)");
                } else if (!event.nodes.some(n => n.type === 'startNode')) {
                    allPrompts.push("(No Start Node found)");
                } else {
                    allPrompts.push("(No path found or graph empty)");
                }
            } else {
                allPrompts = [...allPrompts, ...prompts];
            }
        });

        setExportResult(JSON.stringify(allPrompts, null, 2));
    };

    const handleCopy = async () => {
        if (!exportResult) return;
        try {
            await navigator.clipboard.writeText(exportResult);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy results:', err);
        }
    };

    const handleDownload = () => {
        if (!exportResult) return;
        const blob = new Blob([exportResult], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulated-prompts-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minWidth: '600px', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h3 className="modal-title">📤 Bulk Prompt Generation</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {!exportResult ? (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        marginBottom: '16px'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                        Select events to simulate and extract prompts:
                                    </span>
                                    <button className="action-btn" onClick={handleSelectAll} style={{ fontSize: '11px' }}>
                                        {selectedEventIds.length === filteredEvents.length && filteredEvents.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {filteredEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => toggleEventSelection(event.id)}
                                        style={{
                                            padding: '12px',
                                            background: selectedEventIds.includes(event.id) ? 'rgba(201, 181, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${selectedEventIds.includes(event.id) ? 'rgba(201, 181, 255, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedEventIds.includes(event.id)}
                                            onChange={() => { }}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: '#fff' }}>{event.name}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                                {event.nodes?.length || 0} nodes • {event.edges?.length || 0} edges
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredEvents.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                        No events match your search.
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#B5FFD9', fontSize: '14px' }}>✓ Simulated Array Generated</span>
                                <button className="action-btn" onClick={() => setExportResult(null)} style={{ fontSize: '12px' }}>
                                    Back to Selection
                                </button>
                            </div>
                            <textarea
                                readOnly
                                value={exportResult}
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    resize: 'none'
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {!exportResult ? (
                        <button
                            className="action-btn primary"
                            onClick={handleExport}
                            disabled={selectedEventIds.length === 0}
                            style={{ opacity: selectedEventIds.length === 0 ? 0.5 : 1, width: '100%' }}
                        >
                            Generate Simulated Prompts ({selectedEventIds.length})
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                className="action-btn"
                                onClick={handleCopy}
                                style={{ flex: 1 }}
                            >
                                {copied ? '✓ Copied!' : '📋 Copy Array'}
                            </button>
                            <button
                                className="action-btn primary"
                                onClick={handleDownload}
                                style={{ flex: 1 }}
                            >
                                📥 Download JSON
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkExportModal;
