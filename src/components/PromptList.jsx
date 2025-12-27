import React from 'react';
import ResizingTextarea from './ResizingTextarea';

const PromptList = ({ prompts, onChange, placeholder, color = '#C9B5FF', minHeight = '32px' }) => {
    // Ensure prompts is an array
    const list = Array.isArray(prompts) ? prompts : (prompts ? [prompts] : ['']);

    const handleChange = (index, value) => {
        const newList = [...list];
        newList[index] = value;
        onChange(newList);
    };

    const handleAdd = () => {
        onChange([...list, '']);
    };

    const handleDelete = (index, e) => {
        e.stopPropagation();
        if (list.length <= 1) {
            onChange(['']); // Reset to one empty if trying to delete last
        } else {
            const newList = list.filter((_, i) => i !== index);
            onChange(newList);
        }
    };

    // Hex to RGB helper for dynamic transparency
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 201, g: 181, b: 255 };
    }

    const rgb = hexToRgb(color);
    const bg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
    const border = `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

    return (
        <div className="prompt-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {list.map((prompt, index) => (
                <div key={index} style={{ display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                    <ResizingTextarea
                        value={prompt}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={placeholder}
                        minHeight={minHeight}
                        style={{
                            width: '100%',
                            background: bg,
                            border: border,
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                        }}
                    />
                    <button
                        onClick={(e) => handleDelete(index, e)}
                        className="nodrag"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 100, 100, 0.5)',
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '14px',
                            lineHeight: 1,
                            marginTop: '4px',
                            display: list.length > 1 ? 'block' : 'none'
                        }}
                        title="Remove"
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="nodrag"
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: color,
                    padding: '4px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    width: '100%',
                    textAlign: 'center',
                    marginTop: '2px',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
                + Add Segment
            </button>
        </div>
    );
};

export default PromptList;
