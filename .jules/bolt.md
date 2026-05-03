## 2024-05-03 - Replace O(N) array methods with O(1) dictionary lookups in Sidebar
**Learning:** Sidebar recursive rendering was using O(N) `.filter()` and `.find()` array methods inside recursive renders and iterations over all events. This caused O(N*M) time complexity for generating folder visibility maps and child events.
**Action:** Use precomputed O(1) dictionary lookups (e.g. `childFoldersByParent`) wrapped in `useMemo` over nested array lookups inside loops to prevent performance bottlenecks.
