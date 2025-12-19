import React, { useState, useMemo, useCallback } from 'react';
import useStore from '../store/useStore';

const EventSimulationModal = ({ onClose }) => {
    const nodes = useStore((state) => state.nodes);
    const edges = useStore((state) => state.edges);
    const getComposedPrompt = useStore((state) => state.getComposedPrompt);
    const [copied, setCopied] = useState(false);
    const [seed, setSeed] = useState(0); // Used to trigger refresh

    const simulatedResults = useMemo(() => {
        // 1. Identify Start Nodes specifically
        let startNodes = nodes.filter(n => n.type === 'startNode');

        // If no Start Node, strict simulation means no path to follow
        if (startNodes.length === 0) {
            return [];
        }

        // Sort roots by Y to have a deterministic starting order
        startNodes.sort((a, b) => a.position.y - b.position.y);

        const visitedNodeIds = new Set();
        const visitedEdgeIds = new Set();
        const orderedNodes = [];
        const queue = [...startNodes];

        // --- Pass 1: Graph Traversal & Edge Selection ---
        while (queue.length > 0) {
            const currentNode = queue.shift();

            if (visitedNodeIds.has(currentNode.id)) continue;
            visitedNodeIds.add(currentNode.id);
            orderedNodes.push(currentNode);

            // If we hit an End Node, we stop traversing this branch (it absorbs the flow)
            if (currentNode.type === 'endNode') {
                continue;
            }

            const outgoingEdges = edges.filter(e => e.source === currentNode.id);

            if (currentNode.type === 'branchNode') {
                // Randomly select ONE path
                if (outgoingEdges.length > 0) {
                    const uniqueHandles = [...new Set(outgoingEdges.map(e => e.sourceHandle))];

                    if (uniqueHandles.length > 0) {
                        const randomHandle = uniqueHandles[Math.floor(Math.random() * uniqueHandles.length)];
                        const selectedEdges = outgoingEdges.filter(e => e.sourceHandle === randomHandle);

                        selectedEdges.forEach(edge => {
                            visitedEdgeIds.add(edge.id); // Record chosen edge
                            const targetNode = nodes.find(n => n.id === edge.target);
                            if (targetNode) queue.push(targetNode);
                        });
                    }
                }
            } else {
                // Follow ALL paths
                outgoingEdges.forEach(edge => {
                    visitedEdgeIds.add(edge.id); // Record chosen edge
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (targetNode) queue.push(targetNode);
                });
            }
        }

        // --- Pass 2: Prompt Generation with Context ---
        // Filter out Start, End, and Logic nodes from display
        const hiddenTypes = ['startNode', 'endNode', 'branchNode'];

        return orderedNodes
            .filter(node => !hiddenTypes.includes(node.type))
            .map(node => {
                const { full, parts } = getComposedPrompt(node.id, {
                    allowedEdges: visitedEdgeIds, // <--- CRITICAL: Pass the specific edges chosen in Pass 1
                    randomize: false // No internal randomization needed, we dictated the path
                });
                return {
                    id: node.id,
                    label: node.data?.label || node.type,
                    type: node.type,
                    prompt: full,
                    parts: parts
                };
            });
    }, [nodes, edges, getComposedPrompt, seed]);

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
