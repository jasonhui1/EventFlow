## 2024-04-14 - TabBar Keyboard Accessibility
**Learning:** For accessibility in dynamic components like tabs created via divs, explicit roles (`role="tablist"` and `role="tab"`), `tabIndex`, and `onKeyDown` handlers are required to ensure they can be accessed and activated by screen readers and keyboard users. `e.target === e.currentTarget` helps prevent child button interactions from bubbling up.
**Action:** Always add semantic roles, keyboard event handlers and `tabIndex={0}` to custom interactive components that mimic native interactive elements.
