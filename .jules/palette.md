## 2025-04-29 - Improve Accessibility by adding aria-labels to icon-only buttons
**Learning:** React flow / folder-based UIs frequently rely on compact, icon-only action buttons (e.g., delete, rename, edit) inside highly interactive elements like tree views or tabs. These buttons are invisible to screen readers without proper aria-labels, making the interface completely inaccessible for assistive technologies.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons, dynamically interpolating context where applicable (e.g., `aria-label={`Delete ${folder.name}`}`).
