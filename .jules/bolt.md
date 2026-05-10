## 2024-05-24 - BulkExportModal Map Lookup Optimization
**Learning:** O(N*M) performance bottlenecks can easily occur when using `.find()` inside loops that iterate over state arrays. Replacing `.find()` operations inside map iterations with `O(1)` lookups via precomputed Map objects significantly improves render and processing efficiency in React components.
**Action:** Always verify loops over arrays for potential optimization by checking if interior searches can be precomputed into Map objects prior to iteration.
