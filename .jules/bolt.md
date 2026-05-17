## 2025-05-17 - O(N*M) Lookup in BulkExportModal
**Learning:** Found nested arrays `.find()` loops inside `.forEach()` causing significant slowdowns when large arrays are involved. It resulted in O(N^2) complexity instead of O(N).
**Action:** Always replace inner lookups within loops or map arrays with `new Map()` construction before the loop to convert O(N*M) lookups to O(1) hash lookups, especially when dealing with data sizes that can scale up linearly in both dimensions (selections * events).
