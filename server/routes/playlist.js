/**
 * Playlist generation route.
 */
import { Router } from 'express';
import * as simulationService from '../services/simulationService.js';

const router = Router();

/**
 * POST /api/playlist/generate
 * Generate a playlist of events, optionally with simulation results.
 * Body: { length, slotTemplates?, simulate? }
 */
router.post('/generate', (req, res) => {
    try {
        const { length = 5, slotTemplates = [], simulate = false } = req.body || {};
        const result = simulationService.generateSimulationPlaylist({ length, slotTemplates, simulate });
        res.json(result);
    } catch (error) {
        console.error('Playlist generation error:', error);
        res.status(500).json({ error: 'Failed to generate playlist' });
    }
});

export default router;
