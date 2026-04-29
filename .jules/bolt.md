## 2025-02-12 - Sidebar Map Lookup Optimization
**Learning:** In highly nested, recursive components like `Sidebar.jsx`, putting an O(N) array method like `.find()` inside a parent loop (`filteredEvents.forEach`) mapping state causes an O(N*M) lookup penalty. Moving precomputed lookup dictionaries like `foldersById` (wrapped in `useMemo`) above the filtering logic mitigates this significantly.
**Action:** When filtering or looping over large global state objects, always precompute dictionaries in `useMemo` above the loop and use an O(1) Map/dictionary lookup instead of repeating `.find()`.
