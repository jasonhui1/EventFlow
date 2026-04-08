## 2024-05-24 - BFS Queue Optimization in simulateEvent
**Learning:** Using `queue.shift()` in Breadth-First Search (BFS) graph traversals creates a significant performance bottleneck on large graphs because `Array.prototype.shift()` is an (N)$ operation, leading to (N^2)$ traversal time.
**Action:** Always replace `queue.shift()` with an (1)$ read-pointer (e.g., `queueIndex`) when implementing queue-based processing algorithms to maintain (N)$ time complexity.
