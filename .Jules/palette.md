## 2024-04-03 - Dynamic ARIA labels for dynamic list items
**Learning:** For dynamic components like lists or tab bars, relying only on `title` attributes for icon-only buttons (like a close button) is insufficient for screen readers, as they won't uniquely identify which item the button acts upon.
**Action:** Always complement generic icon-only buttons in dynamic lists with explicit, descriptive `aria-label`s that utilize the dynamic data (e.g., `aria-label={"Close " + itemName + " tab"}`).
