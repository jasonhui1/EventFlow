## 2024-05-18 - Sidebar Folder Rendering Optimization
**Learning:** React re-renders with heavy array operations (like O(N*M) lookups inside `.filter` and `.some` loops) during list rendering can cause significant performance bottlenecks, especially in heavily nested structures like the Sidebar's folder view.
**Action:** Always precompute lookups using Maps (O(1)) wrapped in `useMemo` when rendering hierarchical data in React to optimize lookup performance from O(N*M) to O(N).
