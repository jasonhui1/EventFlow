## 2025-02-14 - Keyboard Navigation for Custom Tabs
**Learning:** Custom div-based Tab elements built with map loops require careful consideration of event bubbling. When adding `onKeyDown` to make tabs keyboard focusable, nested elements like a close button can unintentionally trigger the parent's `onKeyDown` if they share the same trigger keys (like Enter or Space).
**Action:** Always check `if (e.target !== e.currentTarget) return;` within custom keyboard event handlers on parent container elements to ensure events originating from nested interactive children are ignored.
