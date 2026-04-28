## 2025-04-28 - Missing ARIA Labels on Icon Buttons
**Learning:** Found several icon-only buttons (`×`, `+📌`, `✎`, `⚙️`, etc.) without `aria-label` attributes across multiple React components, relying solely on `title` attributes which are insufficient for robust screen reader support. This is a common pattern in this app's components (modals, sidebars, tabs).
**Action:** Always ensure that icon-only interactive elements contain explicit `aria-label` attributes to ensure they are accessible. `title` alone should not be relied upon.
