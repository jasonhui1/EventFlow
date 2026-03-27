
## 2024-03-27 - O(N) Deep Array Traversals in Event Simulations
**Learning:** During complex simulations (like EventFlow graph tree evaluation), repeatedly performing O(N) array traversals (e.g., `nodes.find()`) inside recursive functions leads to significant performance bottlenecks (O(N^2) or worse).
**Action:** Always pre-compute and pass down O(1) Map lookups for objects (like `nodeMap`) before initiating deep recursive or iterative flow simulations to minimize latency.
