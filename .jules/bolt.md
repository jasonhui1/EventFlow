## 2024-05-16 - O(N) array search inside a loop

**Learning:** `Array.prototype.find()` nested inside loop structures (e.g. `map()` or `forEach()`) leads to O(N*M) time complexity. This is especially prevalent when merging or querying large datasets like in the Bulk Export modal or Sidebar components.
**Action:** Replace `Array.prototype.find()` inside loops with an initial `Map` generation, yielding an O(N) preprocessing step with O(1) lookups during iteration.
