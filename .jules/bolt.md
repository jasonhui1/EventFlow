## 2024-04-10 - Optimize BFS queue performance in simulateEvent
**Learning:** Using queue.shift() inside graph traversals creates an O(N^2) bottleneck for large graphs because shift() forces O(N) array re-indexing on every step.
**Action:** Always use an array with a `queueIndex` read pointer (or a dedicated Queue data structure) instead of `shift()` when implementing BFS on non-trivial graphs.
