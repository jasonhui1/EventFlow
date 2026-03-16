## 2026-03-16 - Sidebar List Unnecessary Rerenders
**Learning:** The Sidebar component previously filtered all events and rebuilt the folder tree on every single render. Since the Sidebar contains state for expanded folders (`expandedFolders`), simply toggling a folder would cause an O(N) recalculation of the entire event list and folder structure.
**Action:** Always check if list filtering and complex data transformations in React components are dependent on high-frequency local state. If they aren't, wrap them in `useMemo` to prevent unnecessary CPU cycles on every render.
