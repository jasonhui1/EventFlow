## 2024-05-18 - Replacing Array.find with Map lookup in loop
**Learning:** O(N*M) lookups inside loops block rendering when parsing large lists. Replacing Array.find with a precomputed Map lookup changes it to O(N).
**Action:** Always check if inside `forEach` or `map` we are doing another array lookup like `.find()`, and if so, pre-compute a lookup Map.
