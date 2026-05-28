## 2024-05-18 - Nested filter hidden in routing logic
**Learning:** Found a classic O(N*M) nested loop pattern disguised in `server/routes/folders.js` where `allEvents.filter()` was being called inside a `folders.forEach()` loop during tree construction. As data grows, this scales terribly.
**Action:** Always scrutinize nested array iterations (`.map`, `.forEach`) for inner `.filter()` or `.find()` calls. Extract the inner operation into a single-pass frequency Map or lookup dictionary outside the loop.
