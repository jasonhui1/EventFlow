## 2024-06-11 - Add ARIA labels and titles to modal close buttons
**Learning:** The `modal-close` buttons across various components were missing critical accessibility attributes, leading to a poorer experience for screen readers and missing tooltips for mouse users.
**Action:** When implementing generic icon-only buttons (like an "x" to close a modal), always include `aria-label` and `title` attributes.
