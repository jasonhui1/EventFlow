/**
 * Event routes — listing, detail, and simulation.
 */
import { Router } from 'express';
import { getEvents, getEventById } from '../dataStore.js';
import * as simulationService from '../services/simulationService.js';

const router = Router();

/**
 * GET /api/events
 * List all events. Optional ?folderId= filter.
 * Returns lightweight summaries (no nodes/edges).
 */
router.get('/', (req, res) => {
    const { folderId } = req.query;
    let events = getEvents();

    if (folderId !== undefined) {
        if (folderId === 'root' || folderId === 'null') {
            events = events.filter(e => !e.folderId);
        } else {
            events = events.filter(e => e.folderId === folderId);
        }
    }

    // Return summaries without heavy node/edge data
    const summaries = events.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        folderId: e.folderId || null,
        tags: e.tags || [],
        weight: e.weight,
        nodeCount: e.nodes?.length || 0,
        edgeCount: e.edges?.length || 0,
        costumes: e.costumes || [],
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
    }));

    res.json({ events: summaries });
});

/**
 * GET /api/events/:id
 * Get a single event with full structure (nodes, edges, etc.).
 */
router.get('/:id', (req, res) => {
    const event = getEventById(req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ event });
});

/**
 * GET /api/events/:id/prompts
 * Get composed prompts for all event nodes in a single event.
 * Useful for previewing without running simulation randomness.
 */
router.get('/:id/prompts', (req, res) => {
    try {
        const result = simulationService.getEventPrompts(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Prompt preview error:', error);
        res.status(500).json({ error: 'Failed to get prompt previews' });
    }
});

/**
 * POST /api/events/:id/simulate
 * Run the simulation engine on a specific event.
 * Body: { inputOverrides?, count?, initialMood? }
 */
router.post('/:id/simulate', (req, res) => {
    try {
        const { inputOverrides = {}, count = 1, initialMood = null } = req.body || {};
        const result = simulationService.runSimulation(req.params.id, { inputOverrides, count, initialMood });
        res.json(result);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        console.error('Simulation error:', error);
        res.status(500).json({ error: 'Failed to run simulation' });
    }
});

/**
 * POST /api/simulate/bulk
 * Simulate multiple events at once.
 * Body: { selections: [{ eventId, inputOverrides? }] }
 */
router.post('/simulate/bulk', (req, res) => {
    try {
        const { selections = [] } = req.body || {};
        const result = simulationService.runBulkSimulation(selections);
        res.json(result);
    } catch (error) {
        console.error('Bulk simulation error:', error);
        res.status(500).json({ error: 'Failed to run bulk simulation' });
    }
});

export default router;
