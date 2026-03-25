## 2024-03-25 - Initial UX Audit
**Learning:** Found multiple instances where icon-only buttons (like the sidebar collapse button or modal close buttons) lacked ARIA labels, relying only on `title` attributes.
**Action:** Consistently add `aria-label` alongside or instead of `title` for purely icon-based or symbol-based interactive elements across the application to enhance screen reader accessibility.
