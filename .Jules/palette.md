## 2024-05-24 - Dynamic ARIA Labels in Lists
**Learning:** For dynamic components like lists or tab bars, `title` attributes alone are insufficient for screen readers. Icon-only buttons (like a generic "x" for close) become indistinguishable.
**Action:** Always complement icon-only buttons in dynamic lists with explicit, descriptive `aria-label`s that utilize dynamic data (e.g., `aria-label={"Close " + itemName + " tab"}`) to ensure elements are uniquely identifiable by screen readers.
