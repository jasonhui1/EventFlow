## 2024-04-25 - Improve TabBar accessibility
**Learning:** Found that the custom tab bar components (like `TabBar.jsx`) lacked keyboard support (focus states, `tabIndex`, keyboard event handlers) and screen reader support (roles, `aria-label`). This prevents keyboard users from easily switching tabs.
**Action:** Always add keyboard handlers (`onKeyDown`), focus outlines, and appropriate `aria-*` attributes when building custom interactive UI elements like tabs.
