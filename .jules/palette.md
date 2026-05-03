## 2024-05-03 - Icon-Only Button Accessibility
**Learning:** Custom icon-only buttons like \`.modal-close\` (using the '×' character) and \`.tab-new\` (using the '+' character) in this application lack native screen reader context and keyboard focus indicators.
**Action:** Always add explicit \`aria-label\` attributes and distinct \`:focus-visible\` styles to such elements to ensure accessibility for screen readers and keyboard navigation.
