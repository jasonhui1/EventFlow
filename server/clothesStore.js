/**
 * File-based store for clothes/costume template data.
 * Reads from data/clothes.json. Separate from the main eventflow data
 * since clothes are a shared reference database, not per-event state.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLOTHES_PATH = path.join(__dirname, '..', 'data', 'clothes.json');

let cache = null;
let lastModified = 0;

/**
 * Read the clothes JSON file and return parsed data.
 * Uses in-memory cache if the file hasn't changed.
 */
function readClothes() {
    try {
        const stat = fs.statSync(CLOTHES_PATH);
        const mtime = stat.mtimeMs;

        if (cache && mtime === lastModified) {
            return cache;
        }

        const raw = fs.readFileSync(CLOTHES_PATH, 'utf-8');
        cache = JSON.parse(raw);
        lastModified = mtime;
        return cache;
    } catch (err) {
        console.error('[ClothesStore] Failed to read clothes file:', err.message);
        return {};
    }
}

/**
 * Write clothes data to the JSON file and update cache.
 */
function writeClothes(data) {
    try {
        const dir = path.dirname(CLOTHES_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(CLOTHES_PATH, JSON.stringify(data, null, 4), 'utf-8');
        cache = data;
        lastModified = fs.statSync(CLOTHES_PATH).mtimeMs;
        return true;
    } catch (err) {
        console.error('[ClothesStore] Failed to write clothes file:', err.message);
        return false;
    }
}

// ─── Public API ──────────────────────────────────────────────

/** Get the full clothes database (all costume templates). */
export function getAllClothes() {
    return readClothes();
}

/** Get a single costume template by name. */
export function getCostumeTemplate(name) {
    const clothes = readClothes();
    return clothes[name] || null;
}

/** Get the list of available costume names. */
export function getCostumeNames() {
    return Object.keys(readClothes());
}

/** Save the full clothes database (for future editing support). */
export function saveClothes(data) {
    return writeClothes(data);
}
