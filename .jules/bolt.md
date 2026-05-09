## 2024-05-09 - Sidebar Render Optimization
**Learning:** In Sidebar.jsx, an O(N*M) nested array lookup (`folders.find()`) within the `filteredEvents.forEach` loop was causing unnecessary performance overhead during component re-renders. Moving the precomputed `foldersById` Map lookup before the loop allowed replacing the `.find()` with an O(1) Map lookup.
**Action:** Use precomputed Maps instead of `.find()` inside loops when iterating over lists, particularly in frequently re-rendered React components like sidebars.
