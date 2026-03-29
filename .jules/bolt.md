## 2024-05-20 - O(N) Traversal Bottleneck in Graph Simulation
**Learning:** In deeply nested graph simulation flows like `simulateEvent`, performing `O(N)` linear searches over arrays (e.g., `nodes.find` or `edges.filter`) inside recursive functions like `getInheritedPrompts` and `getParentNodes` causes exponential slowdowns.
**Action:** Always precompute `Map`s for ID-to-Node lookups and `target`-to-edges lookups upfront in the top-level traversal loop, and pass them down as optional parameters to maintain `O(1)` performance during recursive graph walks.
