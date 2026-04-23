## 2024-04-23 - Optimize Sidebar.jsx nested find lookups
**Learning:** In `Sidebar.jsx`, a `filteredEvents.forEach` loop was calling `folders.find()` on every iteration to check if a folder exists. This caused an O(N*M) performance bottleneck, specifically noticeable when scaling up events and folders in the UI.
**Action:** Replaced O(N*M) nested array lookups via `.find()` with O(1) dictionary lookups by precomputing a map of folders (`foldersById`) and moving its initialization before the loop, reducing the complexity to O(N).
