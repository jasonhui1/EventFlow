## 2025-02-27 - Sidebar Re-rendering Optimization
**Learning:** The Sidebar component heavily uses array filtering and finding (O(N) operations) inside loops and useMemo hooks, particularly for event-folder relationships. Given a large number of events/folders, this becomes a performance bottleneck.
**Action:** Use Map or object lookups to group events by folder in O(N) rather than O(N*M), and structure folder hierarchy lookup efficiently.
