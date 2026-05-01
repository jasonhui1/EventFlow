## 2024-05-01 - Keyboard Accessibility in Custom Tabs
**Learning:** When adding keyboard navigation (`onKeyDown` with Enter/Space) to custom interactive components that contain nested interactive elements (like a tab containing a close button), events from the nested elements will bubble up and trigger the parent's action if not handled carefully.
**Action:** Always check `e.target === e.currentTarget` in the `onKeyDown` handler of the parent element to ensure the keypress originated from the parent itself, not a child element (like a close button).
