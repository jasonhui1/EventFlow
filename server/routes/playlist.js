/**
 * Playlist generation route.
 */
import { Router } from 'express';
import { getEvents, getFolders, getMoodConfig } from '../dataStore.js';
import { generatePlaylist } from '../../src/utils/playlistGenerator.js';
import { simulateEvent } from '../../src/utils/simulationUtils.js';

const router = Router();

/**
 * POST /api/playlist/generate
 * Generate a playlist of events, optionally with simulation results.
 * Body: { length, slotTemplates?, simulate? }
 */
router.post('/generate', (req, res) => {
    const { length = 5, slotTemplates = [], simulate = false } = req.body || {};

    const events = getEvents();
    const folders = getFolders();
    const moodConfig = getMoodConfig();

    const playlist = generatePlaylist(events, Math.min(length, 100), folders, slotTemplates);

    const response = {
        length: playlist.length,
        playlist: playlist.map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            tags: e.tags || [],
            folderId: e.folderId || null,
            weight: e.weight,
        })),
    };

    // Optionally simulate each event in the playlist
    if (simulate) {
        response.simulatedPrompts = playlist.map(event => {
            const results = simulateEvent(
                events,
                event.nodes || [],
                event.edges || [],
                event.fixedPrompt || '',
                [],
                new Set(),
                {},
                moodConfig,
            );

            return {
                eventId: event.id,
                eventName: event.name,
                prompts: results.map(r => r.prompt),
                results,
            };
        });
    }

    res.json(response);
});

export default router;
