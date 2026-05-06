## 2025-02-28 - Optimize Sidebar Component Filtering

**Learning:** Replaced an O(N*M) nested array lookup (folders.find within filteredEvents.forEach) with an O(N) lookup using a precomputed map (`foldersById`).

**Action:** Whenever iterating through a large list and performing a lookup against another collection, precompute a hash map (or object map) for O(1) lookups instead of using `.find()`, especially in React render cycles where performance is critical.
