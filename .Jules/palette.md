## 2025-02-13 - Dynamic ARIA Labels in Lists
**Learning:** For accessibility in dynamic components (like lists or tab bars), `title` attributes alone are insufficient. We must always complement them with explicit, descriptive `aria-label`s that utilize dynamic data (e.g., `aria-label={"Close " + itemName + " tab"}`) to ensure elements like icon-only buttons are uniquely identifiable by screen readers.
**Action:** When creating or modifying dynamic list items or tabs with icon-only actions, ensure an `aria-label` is applied that interpolates the item's identifying name.

## 2025-02-13 - Semantic Roles for Custom Tabs
**Learning:** When ensuring keyboard accessibility for custom tab components using non-native elements (e.g., `<div>`), use `role="tab"` for individual tab elements and `role="tablist"` for their parent container, rather than `role="button"`, to provide correct semantic structure for screen readers. Additionally, implement an `onKeyDown` handler that triggers on both 'Enter' and Space keys with `e.target === e.currentTarget` to prevent nested element triggers.
**Action:** When building interactive UI elements using non-native tags, explicitly add appropriate roles (like `tablist`/`tab`) and implement full keyboard event handlers that explicitly prevent default behaviors to mimic native focus and activation patterns.
