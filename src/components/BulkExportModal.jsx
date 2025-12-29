import React, { useState, useMemo } from 'react';
import useStore from '../store/useStore';

const BulkExportModal = ({ onClose }) => {
    const events = useStore((state) => state.events);
    const simulateEventInStore = useStore((state) => state.simulateEvent);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exportResult, setExportResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const [eventOverrides, setEventOverrides] = useState({}); // { [eventId]: { [inputId]: boolean } }
    const [expandedEventId, setExpandedEventId] = useState(null);

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

    const toggleInputOverride = (eventId, inputId, currentVal) => {
        setEventOverrides(prev => ({
            ...prev,
            [eventId]: {
                ...(prev[eventId] || {}),
                [inputId]: !currentVal
            }
        }));
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

            // Apply overrides if any
            const nodesWithOverrides = (event.nodes || []).map(n => {
                if (n.type === 'startNode' && eventOverrides[event.id]) {
                    const nodeOverrides = eventOverrides[event.id];
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            inputs: n.data.inputs?.map(input => ({
                                ...input,
                                enabled: nodeOverrides.hasOwnProperty(input.id)
                                    ? nodeOverrides[input.id]
                                    : input.enabled
                            }))
                        }
                    };
                }
                return n;
            });

            const simulatedNodes = simulateEventInStore(nodesWithOverrides, event.edges || []);
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
                                {filteredEvents.map((event) => {
                                    const startNode = event.nodes?.find(n => n.type === 'startNode');
                                    const inputs = startNode?.data?.inputs || [];
                                    const isSelected = selectedEventIds.includes(event.id);
                                    const isExpanded = expandedEventId === event.id;

                                    return (
                                        <div
                                            key={event.id}
                                            style={{
                                                background: isSelected ? 'rgba(201, 181, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${isSelected ? 'rgba(201, 181, 255, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div
                                                onClick={() => toggleEventSelection(event.id)}
                                                style={{
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{event.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                                        {event.nodes?.length || 0} nodes • {event.edges?.length || 0} edges
                                                    </div>
                                                </div>
                                                {inputs.length > 0 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedEventId(isExpanded ? null : event.id);
                                                        }}
                                                        className="action-btn"
                                                        style={{
                                                            fontSize: '10px',
                                                            padding: '4px 8px',
                                                            background: isExpanded ? 'rgba(255,255,255,0.1)' : 'transparent',
                                                            borderColor: 'rgba(255,255,255,0.1)'
                                                        }}
                                                    >
                                                        {inputs.length} Inputs {isExpanded ? '▴' : '▾'}
                                                    </button>
                                                )}
                                            </div>

                                            {isExpanded && inputs.length > 0 && (
                                                <div style={{
                                                    padding: '0 12px 12px 42px',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '8px',
                                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                                    background: 'rgba(0,0,0,0.1)'
                                                }}>
                                                    {inputs.map(input => {
                                                        const isOverridden = eventOverrides[event.id]?.hasOwnProperty(input.id);
                                                        const currentVal = isOverridden ? eventOverrides[event.id][input.id] : input.enabled;

                                                        return (
                                                            <label
                                                                key={input.id}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    padding: '4px 8px',
                                                                    background: currentVal ? 'rgba(181, 255, 217, 0.1)' : 'rgba(255,255,255,0.05)',
                                                                    border: `1px solid ${currentVal ? 'rgba(181, 255, 217, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                                                    borderRadius: '4px',
                                                                    fontSize: '11px',
                                                                    color: currentVal ? '#B5FFD9' : 'rgba(255,255,255,0.5)',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={currentVal}
                                                                    onChange={() => toggleInputOverride(event.id, input.id, currentVal)}
                                                                    style={{ width: '12px', height: '12px' }}
                                                                />
                                                                {input.label}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
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
