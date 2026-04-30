## 2025-02-20 - O(N*M) nested array lookups in Sidebar.jsx
**Learning:** Found O(N*M) complexity in the Sidebar component where recursive `getChildFolders` and `filteredEvents.forEach` iterated over folders and performed internal `.filter()` and `.find()` array methods during each re-render.
**Action:** Always precompute relationships into O(1) Map/dictionary structures wrapped in `useMemo` (e.g. `foldersById` and `foldersByParentId`) when querying parent-child data in React render cycles to turn O(N*M) bottlenecks into O(N+M).
