## 2024-05-01 - O(N) array finds in React rendering loops

**Learning:** Nested array loop traversals with O(N*M) complexity (e.g. `events.find` or `folders.find` inside `map`/`forEach`) in components like Sidebar and BulkExportModal can be significant rendering bottlenecks.

**Action:** Consistently extract and pre-compute O(1) Dictionary or Map lookups wrapped in `useMemo` for any nested find operation inside loops or renders.
