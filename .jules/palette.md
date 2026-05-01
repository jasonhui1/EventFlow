## 2024-05-01 - Added aria-label and focus-visible to modal close buttons
**Learning:** Custom icon-only buttons like `.modal-close` (using '×' character) often lack screen reader context and keyboard focus indicators, making modals difficult to dismiss for non-mouse users.
**Action:** Always add explicit `aria-label`s and distinct `:focus-visible` states to custom modal close controls to ensure accessibility parity with native elements.
