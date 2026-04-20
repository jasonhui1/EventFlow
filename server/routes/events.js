/**
 * Event routes — listing, detail, and simulation.
 */
import { Router } from 'express';
import { getEvents, getEventById, getMoodConfig } from '../dataStore.js';
import { simulateEvent, getComposedPrompt } from '../../src/utils/simulationUtils.js';
import { generateCostumePrompt } from '../../src/utils/promptEngine.js';
import { getAllClothes } from '../clothesStore.js';

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
    const event = getEventById(req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const allEvents = getEvents();
    const promptNodes = (event.nodes || [])
        .filter(n => n.type === 'eventNode' || n.type === 'groupNode')
        .map(node => {
            const composed = getComposedPrompt(
                node.id,
                allEvents,
                event.nodes,
                event.edges || [],
                event.fixedPrompt || '',
                { randomize: false }
            );
            return {
                nodeId: node.id,
                label: node.data?.label || node.type,
                type: node.type,
                prompt: composed.full,
                parts: composed.parts,
            };
        });

    res.json({ eventId: event.id, eventName: event.name, prompts: promptNodes });
});

/**
 * POST /api/events/:id/simulate
 * Run the simulation engine on a specific event.
 * Body: { inputOverrides?, count? }
 */
router.post('/:id/simulate', (req, res) => {
    const event = getEventById(req.params.id);
    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    const { inputOverrides = {}, count = 1 } = req.body || {};
    const allEvents = getEvents();
    const moodConfig = getMoodConfig();

    const clothesDB = getAllClothes();
    
    // Inject costume string if applicable
    let fixedPrompt = event.fixedPrompt || '';
    const costumePromptStr = generateCostumePrompt(event.costumes || [], clothesDB);
    if (costumePromptStr) {
        fixedPrompt = [fixedPrompt, costumePromptStr].filter(Boolean).join(', ');
    }

    const simulations = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
        const results = simulateEvent(
            allEvents,
            event.nodes || [],
            event.edges || [],
            fixedPrompt,
            [],              // incomingContextParts
            new Set(),       // visitedEventIds
            inputOverrides,
            moodConfig
        );

        simulations.push({
            results: results.map(r => ({
                id: r.id,
                originalId: r.originalId,
                label: r.label,
                type: r.type,
                prompt: r.prompt,
                parts: r.parts,
                mood: r.mood,
                moodTag: r.moodTag,
            })),
        });
    }

    res.json({
        eventId: event.id,
        eventName: event.name,
        count: simulations.length,
        simulations,
    });
});

/**
 * POST /api/simulate/bulk
 * Simulate multiple events at once.
 * Body: { selections: [{ eventId, inputOverrides? }] }
 */
router.post('/simulate/bulk', (req, res) => {
    // Note: this route is mounted at /api/events, so the full path is /api/events/simulate/bulk
    // But we'll also mount it at /api/simulate/bulk in index.js
    const { selections = [] } = req.body || {};
    const allEvents = getEvents();
    const moodConfig = getMoodConfig();

    const results = selections.map(({ eventId, inputOverrides = {} }) => {
        const event = allEvents.find(e => e.id === eventId);
        if (!event) {
            return { eventId, error: 'Event not found' };
        }

        const clothesDB = getAllClothes();
        let fixedPrompt = event.fixedPrompt || '';
        const costumePromptStr = generateCostumePrompt(event.costumes || [], clothesDB);
        if (costumePromptStr) {
            fixedPrompt = [fixedPrompt, costumePromptStr].filter(Boolean).join(', ');
        }

        const simResults = simulateEvent(
            allEvents,
            event.nodes || [],
            event.edges || [],
            fixedPrompt,
            [],
            new Set(),
            inputOverrides,
            moodConfig
        );

        return {
            eventId: event.id,
            eventName: event.name,
            prompts: simResults.map(r => r.prompt),
            results: simResults,
        };
    });

    res.json({ results });
});

export default router;
