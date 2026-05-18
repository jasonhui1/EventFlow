## 2024-05-18 - Nested array \`.find()\` loops optimization
**Learning:** In React components like \`Sidebar.jsx\` and \`BulkExportModal.jsx\`, operations doing nested \`.find()\` on arrays inside loops/renders (e.g., \`events.find\` inside \`forEach\` or \`map\`) lead to O(N*M) time complexity, becoming a severe bottleneck when processing large sets of elements.
**Action:** Replace \`array.find()\` within loops with O(1) Map lookups or object precomputations whenever feasible, dramatically reducing execution time (from ~138ms to ~4ms for 5000 items).
