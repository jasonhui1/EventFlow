/**
 * File-based data store for the EventFlow API server.
 * Reads/writes a JSON file on disk. Keeps an in-memory cache
 * that is refreshed on writes and lazily on reads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'data', 'eventflow-data.json');

let cache = null;
let lastModified = 0;
let eventsByFolderCache = null;

/**
 * Read the JSON file and return parsed data.
 * Uses in-memory cache if the file hasn't changed.
 */
function readData() {
    try {
        const stat = fs.statSync(DATA_PATH);
        const mtime = stat.mtimeMs;

        if (cache && mtime === lastModified) {
            return cache;
        }

        const raw = fs.readFileSync(DATA_PATH, 'utf-8');
        cache = JSON.parse(raw);
        lastModified = mtime;
        eventsByFolderCache = null; // Invalidate cache
        return cache;
    } catch (err) {
        console.error('[DataStore] Failed to read data file:', err.message);
        return { events: [], folders: [], moodConfig: null };
    }
}

/**
 * Write data to the JSON file and update cache.
 */
function writeData(data) {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
        cache = data;
        lastModified = fs.statSync(DATA_PATH).mtimeMs;
        eventsByFolderCache = null; // Invalidate cache
        return true;
    } catch (err) {
        console.error('[DataStore] Failed to write data file:', err.message);
        return false;
    }
}

// ─── Public API ──────────────────────────────────────────────

export function getEvents() {
    return readData().events || [];
}

export function getFolders() {
    return readData().folders || [];
}

export function getMoodConfig() {
    return readData().moodConfig || null;
}

export function getEventById(id) {
    const events = getEvents();
    return events.find(e => e.id === id) || null;
}

export function getFolderById(id) {
    const folders = getFolders();
    return folders.find(f => f.id === id) || null;
}

/**
 * Get all events belonging to a folder (direct children only).
 */
export function getEventsByFolder(folderId) {
    const events = getEvents();

    if (!eventsByFolderCache) {
        eventsByFolderCache = new Map();
        eventsByFolderCache.set(null, []);
        for (const event of events) {
            const fId = event.folderId || null;
            if (!eventsByFolderCache.has(fId)) {
                eventsByFolderCache.set(fId, []);
            }
            eventsByFolderCache.get(fId).push(event);
        }
    }

    if (folderId === null || folderId === 'root') {
        return eventsByFolderCache.get(null) || [];
    }
    return eventsByFolderCache.get(folderId) || [];
}

/**
 * Replace the entire data store (used by frontend auto-push).
 */
export function replaceData(payload) {
    const data = {
        events: payload.events || [],
        folders: payload.folders || [],
        moodConfig: payload.moodConfig || null,
        openTabs: payload.openTabs || [],
        activeTabId: payload.activeTabId || null,
        updatedAt: payload.updatedAt || new Date().toISOString(),
    };
    return writeData(data);
}

/**
 * Export the full data store.
 */
export function exportData() {
    return readData();
}
