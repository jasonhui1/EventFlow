## 2024-03-01 - Interactive Tab Components Accessibility
**Learning:** When creating complex UI components with nested actions like tabs with close buttons, using native `button` elements is problematic as nesting interactive elements violates HTML specs.
**Action:** Use a focusable `div` with `role="tab"`, `tabIndex={0}`, and implement an `onKeyDown` handler (for `Enter` and `Space` keys) to handle keyboard activation, while keeping the child close button accessible.
