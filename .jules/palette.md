## 2026-05-05 - [Added focus-visible styles to custom icon buttons]
**Learning:** Custom icon-only buttons like `.modal-close`, `.tab-close`, and `.tab-new` lack native keyboard focus indicators.
**Action:** Always add explicit `aria-label` attributes and distinct `:focus-visible` styles to custom icon-only buttons to ensure accessibility.
