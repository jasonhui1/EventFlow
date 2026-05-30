/**
 * Folder routes — listing and detail with nested event lookup.
 */
import { Router } from 'express';
import { getFolders, getFolderById, getEvents, getEventsByFolder } from '../dataStore.js';

const router = Router();

/**
 * Build a nested tree structure from flat folder array.
 */
function buildFolderTree(folders, allEvents) {
    const folderMap = new Map();

    // Pre-calculate event counts in a single pass (O(N))
    // This avoids O(N*M) nested loops when filtering events for each folder
    const eventCounts = new Map();
    let rootEventCount = 0;
    for (const e of allEvents) {
        if (e.folderId) {
            eventCounts.set(e.folderId, (eventCounts.get(e.folderId) || 0) + 1);
        } else {
            rootEventCount++;
        }
    }

    // Initialize all folders with their pre-calculated event counts
    folders.forEach(f => {
        folderMap.set(f.id, {
            ...f,
            children: [],
            eventCount: eventCounts.get(f.id) || 0,
        });
    });

    const roots = [];

    folders.forEach(f => {
        const node = folderMap.get(f.id);
        if (f.parentId && folderMap.has(f.parentId)) {
            folderMap.get(f.parentId).children.push(node);
        } else {
            roots.push(node);
        }
    });

    // rootEventCount is already calculated in the first pass

    return { roots, rootEventCount };
}

/**
 * GET /api/folders
 * List all folders as a tree structure.
 */
router.get('/', (req, res) => {
    const folders = getFolders();
    const allEvents = getEvents();
    const tree = buildFolderTree(folders, allEvents);

    res.json({
        folders,
        tree: tree.roots,
        rootEventCount: tree.rootEventCount,
    });
});

/**
 * GET /api/folders/:id
 * Get a specific folder and its direct child events.
 */
router.get('/:id', (req, res) => {
    const folder = getFolderById(req.params.id);
    if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    const events = getEventsByFolder(req.params.id);
    const childFolders = getFolders().filter(f => f.parentId === req.params.id);

    res.json({
        folder,
        events: events.map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            tags: e.tags || [],
            weight: e.weight,
            nodeCount: e.nodes?.length || 0,
        })),
        childFolders,
    });
});

export default router;
