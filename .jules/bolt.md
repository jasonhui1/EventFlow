## 2024-05-15 - [O(N) Lookups in React Loops]
**Learning:** React component render cycles with large arrays (filteredEvents) shouldn't execute nested array lookups (folders.find) which leads to O(Events * Folders) complexity.
**Action:** Always map secondary large arrays (folders) into an O(1) object map (foldersById) beforehand and use the object for fast checks inside loops over the primary array.
