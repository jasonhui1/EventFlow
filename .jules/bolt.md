## 2024-05-08 - Fast Lookups in BulkExportModal
**Learning:** O(N*M) lookups inside `.map` and `.forEach` using `.find` cause significant layout blocking on larger arrays.
**Action:** Replaced `.find` calls with precomputed O(1) Maps to improve bulk export selection and mapping speeds.
