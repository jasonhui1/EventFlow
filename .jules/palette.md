## 2024-05-04 - Accessible Custom Icon Buttons
**Learning:** Custom icon-only buttons like `.modal-close` (using '×') and `.tab-close`/`.tab-new` (using '+' and '×') in this application completely lack native screen reader context and visible focus indicators, creating significant barriers for non-mouse users.
**Action:** Always add explicit `aria-label` attributes to provide screen reader context, and distinct `:focus-visible` styles with `outline` to ensure keyboard navigation visibility for any non-standard or custom-styled icon buttons.
