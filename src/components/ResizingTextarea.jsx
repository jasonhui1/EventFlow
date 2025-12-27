import React, { useRef, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';

const ResizingTextarea = forwardRef(({ value, onChange, placeholder, className, style, minHeight, ...props }, ref) => {
    const innerRef = useRef(null);

    // Allow parent to access the underlying textarea
    useImperativeHandle(ref, () => innerRef.current);

    const autoResize = () => {
        if (innerRef.current) {
            // Reset height to allow shrinking
            innerRef.current.style.height = 'auto';
            // Set new height based on scrollHeight
            innerRef.current.style.height = `${innerRef.current.scrollHeight}px`;
        }
    };

    useLayoutEffect(() => {
        autoResize();
    }, [value]);

    return (
        <textarea
            ref={innerRef}
            value={value}
            onChange={(e) => {
                onChange(e);
                // We don't need to call autoResize here because the useEffect on [value] will trigger,
                // BUT for smoother typing experience preventing frame skip, we can also do it here or rely on useLayoutEffect.
                // useLayoutEffect is usually fast enough.
            }}
            placeholder={placeholder}
            className={className}
            style={{
                ...style,
                overflow: 'hidden', // Hide scrollbar
                resize: 'none', // Disable manual resize
                minHeight: minHeight || style?.minHeight || 'auto',
                boxSizing: 'border-box',
            }}
            rows={1}
            {...props}
        />
    );
});

export default ResizingTextarea;
