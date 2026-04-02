## 2025-02-21 - Optimize simulateEvent Graversal Traversal
**Learning:** In `src/utils/simulationUtils.js` graph traversals, nested array operations inside `while` loops (`array.find()`, `array.filter()`, `queue.shift()`) create massive $O(N \cdot E^2)$ bottlenecks during dense simulation graph evaluation.
**Action:** Favor hoisting `Map` creation for ID-to-Node and ID-to-Edge array lookups, passing them into recursive traversal components as cache objects for $O(1)$ lookups. Additionally, replace BFS `queue.shift()` with a `queueIndex` read-pointer.
