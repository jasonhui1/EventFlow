## 2025-04-20 - Map-Based Optimization for Parent Node Lookup
**Learning:** Pre-computing mapping configurations (O(1)) over arrays instead of querying dynamically iteratively with \`.filter()\` or \`.find()\` operations significantly reduces lookup time, particularly in recursive tree walks spanning an arbitrary number of times in heavy flow architectures such as the ones in \`src/utils/simulationUtils.js\`.
**Action:** When repeatedly traversing trees to query edges, always pre-process inputs to avoid generating deep $O(E \times N)$ execution complexities.
