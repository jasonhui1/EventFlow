## 2024-05-24 - [simulationUtils optimization]
**Learning:** O(n^2) or O(n^3) traversals in large node graphs can severely impact performance. Replacing `nodes.find()` and `edges.filter()` with `Map` lookups, specifically caching maps like `_nodeMap` and `_edgesByTarget` on parent/reference events across recursive calls to `getInheritedPrompts`, drastically reduces redundant O(N) ops.
**Action:** Identify recursive functions doing `Array.find` or `Array.filter` on lists of nodes/edges and replace them with `Map` lookups initialized at the top level and passed down as parameters.
