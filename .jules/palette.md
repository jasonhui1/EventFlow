## 2025-02-18 - Added Accessibility to Icon-Only Close Buttons
**Learning:** Custom icon-only buttons (like `.modal-close` and `.tab-close` using the '×' character) lack native screen reader context and keyboard focus indicators, making them inaccessible.
**Action:** Always add explicit `aria-label` attributes and distinct `:focus-visible` styles to custom icon-only buttons to ensure they are accessible via keyboard navigation and screen readers.
