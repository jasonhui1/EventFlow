/**
 * Data sync routes — frontend pushes state here, external apps can export.
 */
import { Router } from 'express';
import { replaceData, exportData } from '../dataStore.js';

const router = Router();

/**
 * POST /api/data/sync
 * Receive the full state from the frontend and persist to disk.
 * Body: { events, folders, moodConfig, updatedAt }
 */
router.post('/sync', (req, res) => {
    const payload = req.body;

    if (!payload || !Array.isArray(payload.events)) {
        return res.status(400).json({ error: 'Invalid payload: events array required' });
    }

    const success = replaceData(payload);

    if (success) {
        console.log(`[Sync] Data updated — ${payload.events.length} events, ${(payload.folders || []).length} folders`);
        res.json({ success: true, updatedAt: new Date().toISOString() });
    } else {
        res.status(500).json({ success: false, error: 'Failed to write data file' });
    }
});

/**
 * GET /api/data/export
 * Export the current data store as JSON.
 */
router.get('/export', (req, res) => {
    const data = exportData();
    res.json({
        ...data,
        version: '1.0',
        exportedAt: new Date().toISOString(),
    });
});

export default router;
