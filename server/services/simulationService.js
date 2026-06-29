/**
 * Simulation Service
 * Orchestrates event simulation and playlist generation.
 * Extracts logic from route handlers to provide a clean, testable API.
 */
import { 
    getEvents, 
    getEventById, 
    getFolders, 
    getMoodConfig, 
    getGlobalPrependPrompt, 
    getGlobalAppendPrompt 
} from '../dataStore.js';
import { getAllClothes } from '../clothesStore.js';
import { simulateEvent, getComposedPrompt } from '../../shared/utils/simulationUtils.js';
import { generateCostumePrompt } from '../../shared/utils/promptEngine.js';
import { generatePlaylist } from '../../shared/utils/playlistGenerator.js';

/**
 * Standardizes a single simulation result.
 * Ensures consistent field names and structure across all simulation types.
 */
function formatSimulationResult(simResults) {
    return simResults.map(r => ({
        id: r.id,
        originalId: r.originalId,
        label: r.label,
        type: r.type,
        prompt: r.prompt,
        parts: r.parts,
        mood: r.mood,
        moodTag: r.moodTag,
    }));
}

/**
 * Internal helper to perform a single simulation run.
 * Handles data fetching and shared utility orchestration.
 */
function performSimulation(event, allEvents, moodConfig, clothesDB, globalPrepend, globalAppend, options = {}) {
    const { 
        inputOverrides = {}, 
        initialMood = null,
        visitedEventIds = new Set()
    } = options;

    // Inject costume string if applicable
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
        [],              // incomingContextParts
        visitedEventIds,
        inputOverrides,
        moodConfig,
        initialMood,
        globalPrepend,
        globalAppend
    );

    return formatSimulationResult(simResults);
}

/**
 * Runs simulation for a single event.
 * Supports multiple iterations (count) and input overrides.
 * 
 * @param {string} eventId - The ID of the event to simulate.
 * @param {Object} options - Simulation options.
 * @param {Object} options.inputOverrides - Map of input IDs to boolean values.
 * @param {number} options.count - Number of simulations to run (max 100).
 * @param {number} options.initialMood - Starting mood value (-100 to 100).
 * @returns {Object} Unified simulation result object.
 */
export function runSimulation(eventId, options = {}) {
    const { 
        inputOverrides = {}, 
        count = 1, 
        initialMood = null 
    } = options;

    const event = getEventById(eventId);
    if (!event) {
        throw new Error(`Event not found: ${eventId}`);
    }

    const allEvents = getEvents();
    const moodConfig = getMoodConfig();
    const clothesDB = getAllClothes();
    const globalPrepend = getGlobalPrependPrompt();
    const globalAppend = getGlobalAppendPrompt();

    const simulations = [];
    const maxCount = Math.min(count, 100);

    for (let i = 0; i < maxCount; i++) {
        const results = performSimulation(event, allEvents, moodConfig, clothesDB, globalPrepend, globalAppend, {
            inputOverrides,
            initialMood
        });

        simulations.push({ results });
    }

    return {
        eventId: event.id,
        eventName: event.name,
        count: simulations.length,
        simulations,
    };
}

/**
 * Generates a playlist and optionally simulates each event.
 * 
 * @param {Object} options - Playlist generation options.
 * @param {number} options.length - Number of events in the playlist.
 * @param {Array} options.slotTemplates - Constraints for each playlist slot.
 * @param {boolean} options.simulate - Whether to run simulation for each event.
 * @returns {Object} Playlist object with optional simulation results.
 */
export function generateSimulationPlaylist(options = {}) {
    const { 
        length = 5, 
        slotTemplates = [], 
        simulate = false 
    } = options;

    const events = getEvents();
    const folders = getFolders();
    const moodConfig = getMoodConfig();
    const clothesDB = getAllClothes();
    const globalPrepend = getGlobalPrependPrompt();
    const globalAppend = getGlobalAppendPrompt();

    const playlist = generatePlaylist(events, Math.min(length, 100), folders, slotTemplates);

    const result = {
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

    if (simulate) {
        result.simulatedPrompts = playlist.map(event => {
            const results = performSimulation(event, events, moodConfig, clothesDB, globalPrepend, globalAppend);
            return {
                eventId: event.id,
                eventName: event.name,
                prompts: results.map(r => r.prompt),
                results: results,
            };
        });
    }

    return result;
}

/**
 * Runs bulk simulation for multiple events.
 * 
 * @param {Array} selections - Array of { eventId, inputOverrides } objects.
 * @returns {Object} Object containing results for each selection.
 */
export function runBulkSimulation(selections = []) {
    const allEvents = getEvents();
    const moodConfig = getMoodConfig();
    const clothesDB = getAllClothes();
    const globalPrepend = getGlobalPrependPrompt();
    const globalAppend = getGlobalAppendPrompt();

    const results = selections.map(({ eventId, inputOverrides = {} }) => {
        const event = allEvents.find(e => e.id === eventId);
        if (!event) {
            return { eventId, error: 'Event not found' };
        }

        const simResults = performSimulation(event, allEvents, moodConfig, clothesDB, globalPrepend, globalAppend, {
            inputOverrides
        });

        return {
            eventId: event.id,
            eventName: event.name,
            prompts: simResults.map(r => r.prompt),
            results: simResults,
        };
    });

    return { results };
}

/**
 * Gets composed prompts for all event nodes in a single event.
 * Useful for previewing without running simulation randomness.
 * 
 * @param {string} eventId - The ID of the event.
 * @returns {Object} Object containing prompts for each node.
 */
export function getEventPrompts(eventId) {
    const event = getEventById(eventId);
    if (!event) {
        throw new Error(`Event not found: ${eventId}`);
    }

    const allEvents = getEvents();
    const globalPrepend = getGlobalPrependPrompt();
    const globalAppend = getGlobalAppendPrompt();

    const promptNodes = (event.nodes || [])
        .filter(n => n.type === 'eventNode' || n.type === 'groupNode')
        .map(node => {
            const composed = getComposedPrompt(
                node.id,
                allEvents,
                event.nodes,
                event.edges || [],
                event.fixedPrompt || '',
                { 
                    randomize: false,
                    globalPrependPrompt: globalPrepend,
                    globalAppendPrompt: globalAppend
                }
            );

            return {
                nodeId: node.id,
                label: node.data?.label || node.type,
                type: node.type,
                prompt: composed.full,
                parts: composed.parts,
            };
        });

    return {
        eventId: event.id,
        eventName: event.name,
        prompts: promptNodes,
    };
}
