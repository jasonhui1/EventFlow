## 2024-05-24 - Accessibility for Icon-only Buttons
**Learning:** Custom icon-only buttons like `.modal-close` (using '×'), `.tab-close`, and `.tab-new` (using '+') lack native screen reader context.
**Action:** Always add explicit `aria-label` attributes to such elements to ensure accessibility.
