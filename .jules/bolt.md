
## 2024-11-20 - Memoizing recursive node and event lookups
**Learning:** During recursive event simulations, repeated `find()` calls over large `nodes` and `allEvents` arrays lead to O(N^2) behavior in graph traversals. Mutating global event arrays or caching within standard options creates stale references in a React context.
**Action:** When evaluating graph models across events, use scoped `nodeMap` and `eventCache` arguments mapped upfront. Pass them down through recursive trees (like `getInheritedPrompts`), being careful to reset the `nodeMap` to `null` on cross-event references while retaining the top-level `eventCache` to preserve O(1) lookups seamlessly.
