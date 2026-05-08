## 2024-05-08 - Icon-Only Button Accessibility Pattern
**Learning:** Icon-only buttons (like modal close "×" and sidebar action buttons) in this app often lack ARIA labels, making them inaccessible to screen readers.
**Action:** When working on interactive components with icon-only controls, explicitly add `aria-label` attributes to ensure they are accessible. Avoid relying solely on `title` attributes, as they aren't consistently announced by screen readers.
