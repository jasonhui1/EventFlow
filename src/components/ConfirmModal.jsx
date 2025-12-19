import React, { useState, useEffect, useRef } from 'react';

/**
 * A reusable modal component for confirmations and prompts.
 * Replaces window.confirm and window.prompt with styled alternatives.
 */
const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm',
    message = 'Are you sure?',
    type = 'confirm', // 'confirm' | 'prompt' | 'delete'
    inputPlaceholder = '',
    defaultValue = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showDontAskAgain = false,
    onDontAskAgainChange = null,
}) => {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
            setDontAskAgain(false);
            // Focus input for prompt mode, or the modal for keyboard handling
            setTimeout(() => {
                if (type === 'prompt' && inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                } else if (modalRef.current) {
                    modalRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen, defaultValue, type]);

    const handleConfirm = () => {
        if (showDontAskAgain && dontAskAgain && onDontAskAgainChange) {
            onDontAskAgainChange(true);
        }
        if (type === 'prompt') {
            if (inputValue.trim()) {
                onConfirm(inputValue.trim());
            }
        } else {
            onConfirm();
        }
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'delete':
                return '🗑️';
            case 'prompt':
                return '✏️';
            default:
                return '❓';
        }
    };

    const getConfirmButtonStyle = () => {
        if (type === 'delete') {
            return {
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
                color: '#fff',
            };
        }
        return {
            background: 'linear-gradient(135deg, #C9B5FF, #B5D4FF)',
            color: '#1a1a2e',
        };
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-overlay"
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                    animation: 'fadeIn 0.15s ease',
                }}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                className="modal-container"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    minWidth: '340px',
                    maxWidth: '450px',
                    background: '#16213e',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    animation: 'modalSlideIn 0.2s ease',
                    outline: 'none',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <span style={{ fontSize: '24px' }}>{getIcon()}</span>
                    <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#fff',
                    }}>
                        {title}
                    </h3>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px' }}>
                    <p style={{
                        margin: '0 0 16px',
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: 1.5,
                    }}>
                        {message}
                    </p>

                    {type === 'prompt' && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={inputPlaceholder}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#C9B5FF';
                                e.target.style.boxShadow = '0 0 0 3px rgba(201, 181, 255, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    )}

                    {showDontAskAgain && (
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginTop: '16px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.5)',
                        }}>
                            <input
                                type="checkbox"
                                checked={dontAskAgain}
                                onChange={(e) => setDontAskAgain(e.target.checked)}
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    cursor: 'pointer',
                                    accentColor: '#C9B5FF',
                                }}
                            />
                            Don't ask again this session
                        </label>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px 20px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            ...getConfirmButtonStyle(),
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(201, 181, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -48%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `}</style>
        </>
    );
};

export default ConfirmModal;
