## 2024-05-18 - [O(1) folder lookup in playlist generator]
**Learning:** Performance in `src/utils/playlistGenerator.js` was improved by replacing an O(N) array lookup (`folders.find()`) in `getInheritedFolderTags` with an O(1) Map lookup passed via `folders._byId`, significantly reducing time complexity from O(E * F * D) to O(E * D).
**Action:** When working with nested loops and repeated lookups within them, look for opportunities to pre-compute maps for O(1) access to avoid exponential growth in CPU usage.
