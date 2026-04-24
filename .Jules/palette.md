## 2024-04-04 - Initializing Palette Journal
**Learning:** Started tracking UX/a11y insights.
**Action:** Will document critical learnings here.

## 2026-04-04 - Dynamic ARIA Labels in Lists
**Learning:** For accessibility in dynamic components (like lists or tab bars), `title` attributes alone are insufficient. Always complement them with explicit, descriptive `aria-label`s that utilize dynamic data (e.g., `aria-label={"Close " + itemName + " tab"}`) to ensure elements like icon-only buttons are uniquely identifiable by screen readers.
**Action:** Ensure dynamic components with icon buttons include contextual `aria-label`s tied to the specific item being interacted with.
