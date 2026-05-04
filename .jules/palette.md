## 2026-05-04 - Add ARIA Labels and Focus Rings to Custom Icon Buttons
**Learning:** Custom icon-only buttons like `.modal-close` (using the '×' character), `.tab-close`, and `.tab-new` (using the '+' character) in this application lack native screen reader context and keyboard focus indicators.
**Action:** Always add explicit `aria-label` attributes and distinct `:focus-visible` styles to such elements to ensure accessibility.
