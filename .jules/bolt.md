## 2024-06-25 - Use Queue Index for BFS Traversals
**Learning:** In deeply nested graph traversals (like `simulateEvent`), using `queue.shift()` for BFS queues creates an O(N) operation per node, which becomes an O(N^2) bottleneck for extremely large synthetic graphs (e.g. 1000+ nodes).
**Action:** Always use a `queueIndex` read-pointer (`queue[queueIndex++]`) instead of `.shift()` for BFS array queues to maintain O(1) time complexity.
