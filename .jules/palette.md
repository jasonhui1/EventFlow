## 2024-05-18 - Keyboard Accessibility in Custom Tabs
**Learning:** When adding `onKeyDown` handlers to custom interactive components like tabs that contain nested interactive elements (e.g., close buttons), events from the nested elements will bubble up and unintentionally trigger the parent's action if not explicitly checked.
**Action:** Always check `e.target === e.currentTarget` in `onKeyDown` handlers on parent container elements to prevent unintended bubbling from nested interactive controls.
