## 2024-05-19 - [O(N*M) Loop Optimization in processFields]
**Learning:** The `processFields` function in `src/utils/simulationUtils.js` iterates over `childNodes = nodes.filter(node => ...)` for each field node inside `fieldNodes.forEach`. This results in an `O(numFields * numNodes)` nested loop, recalculating bounding box checks on every node for every field.
**Action:** Always extract and separate static lists (like `fieldNodes` and `nonFieldNodes`) before nested spatial checks, reducing the inner loop size and avoiding redundant operations.
