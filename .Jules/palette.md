## 2024-03-21 - [A11y] Complement title with aria-labels
**Learning:** `title` attributes are insufficient for screen readers in complex dynamic components like tab bars; always complement them with explicit, descriptive `aria-label`s.
**Action:** Add `aria-label` to icon-only buttons in complex UI components even if `title` attribute is already present.
