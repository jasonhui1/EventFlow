## 2024-10-24 - O(N) Array Shift in BFS Queue Bottleneck
**Learning:** In graph traversals (like `simulateEvent`), using `queue.shift()` for BFS queues is an O(N) operation that creates significant performance bottlenecks during large traversals due to array re-indexing on every dequeue.
**Action:** Always use a `queueIndex` read-pointer (e.g., `let queueIndex = 0; while (queueIndex < queue.length) { const item = queue[queueIndex++]; }`) to iterate through the array instead, maintaining O(1) time complexity for queue processing.
