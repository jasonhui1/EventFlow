## 2025-02-28 - Sidebar Performance Optimization
**Learning:** O(N) array methods like \`.filter()\` inside recursive rendering components (like \`renderFolder\` calling \`getChildFolders\`) cause significant performance bottlenecks as the number of nodes scales.
**Action:** Always precompute relationships using O(1) Map lookups (e.g., grouping by \`parentId\` via \`useMemo\`) before the render loop starts to avoid redundant O(N) traversals per node.
