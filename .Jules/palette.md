## 2024-05-29 - Missing ARIA labels on icon-only buttons
**Learning:** Icon-only buttons with `title` attributes (for mouse users) often miss `aria-label`s, making them less accessible for screen reader users. The application has several of these buttons, especially in modals (close buttons) and the sidebar.
**Action:** Always ensure both `aria-label` and `title` are present for icon-only buttons.
