## 2024-05-18 - Nested Interactive Element Accessibility (Tabs & Close Buttons)
**Learning:** Adding a generic `onClick` and `tabIndex=0` to a container `div` that includes a `button` (like a close icon) creates a nested interactive element anti-pattern. If a user focuses the container and presses `Enter`, the event can sometimes accidentally bubble or interact weirdly depending on how focus is managed, or standard screen readers will incorrectly process the button inside a button.
**Action:** When creating complex UI components with nested actions (like tabs with close buttons), use a focusable `<div>` with `role="tab"`, `tabIndex={0}`, and an `onKeyDown` handler for `Enter` and `Space` key activation. Crucially, within the `onKeyDown` handler, always check `e.target === e.currentTarget` to prevent nested interactive elements (like the close `<button>`) from incorrectly triggering the container's action.

## 2024-05-18 - ARIA labels for dynamic Tab Bar UI
**Learning:** `title` attributes alone on close buttons inside dynamic tab interfaces are insufficient for screen readers because they lack contextual association with what is actually being closed.
**Action:** Always complement generic icon-only buttons with explicit, descriptive `aria-label`s, utilizing dynamic data like item names where possible (e.g., `aria-label={\`Close \${tabName} tab\`}`).

## 2024-05-18 - Pointer Events Override
**Learning:** Overriding `pointer-events: none` on parent wrapper classes using `pointer-events: all !important` can lead to unpredictable behavior because `all` is primarily an SVG value and may not behave consistently across browsers for standard HTML elements.
**Action:** Always prefer `pointer-events: auto !important` for standard HTML elements to ensure default browser behavior and better cross-browser compatibility.