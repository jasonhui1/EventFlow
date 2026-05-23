## 2024-05-23 - Optimizing O(N * E) Recursive Traversals
**Learning:** In deeply nested or recursive graph traversal functions (like React Flow pathfinding), repeatedly performing O(N) array `.find()` lookups to resolve nodes from edge targets creates O(N * E) scaling bottlenecks.
**Action:** Always precompute an O(1) `Map` lookup and pass it down the recursive call stack to drop the time complexity to O(E), preventing performance degradation as the graph grows.
