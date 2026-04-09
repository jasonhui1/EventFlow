## 2024-03-01 - Replace BFS queue.shift() with queueIndex read-pointer
**Learning:** In graph traversals (like `simulateEvent`), using `queue.shift()` for BFS queues is an O(N) operation that creates performance bottlenecks during large traversals.
**Action:** Instead, use a `queueIndex` read-pointer to iterate through the array to maintain O(1) time complexity.