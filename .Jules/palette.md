## 2026-04-05 - Tab Bar Keyboard Accessibility
**Learning:** Custom interactive elements (like `div`s acting as tabs) require explicit semantic roles (`role="tablist"`, `role="tab"`) and keyboard event handlers (`onKeyDown` for 'Enter' and 'Space') to be accessible to screen reader and keyboard users.
**Action:** When creating custom tabs, always provide proper ARIA roles and ensure keyboard users can activate them using Enter and Space keys.
