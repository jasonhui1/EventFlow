## 2026-03-20 - Recursive Graph Traversal Optimization
**Learning:** O(N) Array.prototype.find inside deep, recursive graph traversals like `getComposedPrompt` can cause severe performance bottlenecks when building prompt chains.
**Action:** When working with React Flow (or node/edge arrays), hoist `Map` creation to the entry function (`simulateEvent`) for O(1) ID-to-Node lookups and pass it down via an options object.
