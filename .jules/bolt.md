## 2024-03-22 - [Optimizing Recursive Lookups with Map in simulationUtils.js]
**Learning:** When recursing into `referenceNode` events in `simulationUtils.js`, constructing a new `nodeMap` specifically for the referenced event's nodes prevents O(N) lookup degradation since referenced events have their own distinct node arrays not covered by the parent map.
**Action:** Always create a scoped `Map` when traversing a new set of entities within a nested or recursive structure to maintain O(1) lookups.
