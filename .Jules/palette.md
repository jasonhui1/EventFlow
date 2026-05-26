## 2024-05-17 - Dynamic ARIA labels for nested structures
**Learning:** When adding ARIA labels to components nested within loops (like tree view folders or items), dynamically interpolating the item's name (`aria-label={\`Add Event to ${folder.name}\`}`) provides significantly better screen reader context than static labels.
**Action:** Always prefer dynamically generated, context-rich ARIA labels for list or tree items rather than generic actions.
