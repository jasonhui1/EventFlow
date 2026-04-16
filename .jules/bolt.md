## 2024-05-14 - Replace Array.shift() with queue index in graph BFS
**Learning:** In deeply recursive graph traversals (like `simulateEvent`), using `queue.shift()` for BFS queues creates an O(N^2) bottleneck because `Array.shift()` is an O(N) operation.
**Action:** Always use a `queueIndex` read-pointer (`queue[queueIndex++]`) to maintain O(1) time complexity when processing queues in hot paths.
