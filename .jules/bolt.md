## 2024-04-24 - BulkExportModal Array Lookup Bottleneck
**Learning:** In React components like `BulkExportModal.jsx`, mapping over a list of items (`filteredEvents`) and performing `Array.prototype.find()` on another array (`selections`) inside the render cycle or selection handlers leads to an O(N*M) performance issue.
**Action:** Replace `Array.prototype.find()` with a Map or a dictionary (O(1) lookups) before the iteration when mapping or filtering large lists.
