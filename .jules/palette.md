## 2024-05-02 - Modal Close Accessibility
**Learning:** Custom icon-only buttons like `.modal-close` (using the '×' character) lack native screen reader context and keyboard focus indicators.
**Action:** Always add explicit `aria-label` attributes and distinct `:focus-visible` styles to such elements to ensure accessibility.
