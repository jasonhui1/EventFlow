import React from 'react';
import useStore from '../store/useStore';
import ResizingTextarea from './ResizingTextarea';

const GlobalPromptModal = ({ onClose }) => {
    const globalPrependPrompt = useStore((state) => state.globalPrependPrompt);
    const globalAppendPrompt = useStore((state) => state.globalAppendPrompt);
    const updateGlobalPrependPrompt = useStore((state) => state.updateGlobalPrependPrompt);
    const updateGlobalAppendPrompt = useStore((state) => state.updateGlobalAppendPrompt);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal nowheel"
                onClick={(e) => e.stopPropagation()}
                style={{ minWidth: '600px', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}
            >
                <div className="modal-header">
                    <h3 className="modal-title">🌍 Global Prompt Modifiers</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <p style={{ 
                        fontSize: '13px', 
                        color: 'rgba(255,255,255,0.5)', 
                        marginBottom: '20px',
                        lineHeight: '1.5'
                    }}>
                        These prompts are automatically added to <strong>every</strong> simulation result. 
                        Prepend is added at the beginning, and Append is added at the end.
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 600,
                            color: '#C9B5FF',
                            fontSize: '14px'
                        }}>
                            🌍 Global Prepend Prompt
                        </label>
                        <ResizingTextarea
                            value={globalPrependPrompt}
                            onChange={(e) => updateGlobalPrependPrompt(e.target.value)}
                            placeholder="e.g. masterpiece, best quality, highres..."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '12px',
                                color: '#fff',
                                fontSize: '13px',
                                fontFamily: 'monospace'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 600,
                            color: '#FFB5C5',
                            fontSize: '14px'
                        }}>
                            🏁 Global Append Prompt
                        </label>
                        <ResizingTextarea
                            value={globalAppendPrompt}
                            onChange={(e) => updateGlobalAppendPrompt(e.target.value)}
                            placeholder="e.g. --ar 2:3, --v 6.0..."
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                padding: '12px',
                                color: '#fff',
                                fontSize: '13px',
                                fontFamily: 'monospace'
                            }}
                        />
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

export default GlobalPromptModal;
