/**
 * Playlist Generator - Selects a sequence of event flows
/*1``*9- * respecting Tags, Incompatible Tags, Required Tags, and Weighted Rarity.
 * Supports folder tag inheritance.
 */

/**
 * Collect tags from all ancestor folders (recursive).
 * @param {Object} event - The event object (must have folderId)
 * @param {Array} folders - All folders
 * @returns {{ tags: string[], incompatibleTags: string[], requiredTags: string[] }}
 */
const getInheritedFolderTags = (event, folders) => {
    const result = { tags: [], incompatibleTags: [], requiredTags: [] };
    let currentFolderId = event.folderId;

    while (currentFolderId) {
        const folder = folders.find(f => f.id === currentFolderId);
        if (!folder) break;

        result.tags.push(...(folder.tags || []));
        result.incompatibleTags.push(...(folder.incompatibleTags || []));
        result.requiredTags.push(...(folder.requiredTags || []));

        currentFolderId = folder.parentId;
    }

    return result;
};

/**
 * Get the effective (merged) tags for an event, including folder inheritance.
 */
const getEffectiveTags = (event, folders) => {
    const inherited = getInheritedFolderTags(event, folders);
    return {
        tags: [...new Set([...(event.tags || []), ...inherited.tags])],
        incompatibleTags: [...new Set([...(event.incompatibleTags || []), ...inherited.incompatibleTags])],
        requiredTags: [...new Set([...(event.requiredTags || []), ...inherited.requiredTags])],
    };
};

/**
 * Check if an event is a valid candidate for the current playlist state.
 * @param {Object} event - The event to check
 * @param {Object} effective - Effective tags for this event
 * @param {Set} activeTags - Tags accumulated from already-selected events
 * @param {Set} activeExclusions - Incompatible tags accumulated from already-selected events
 * @param {Set} pickedIds - IDs of events already in the playlist
 * @returns {boolean}
 */
const isValidCandidate = (event, effective, activeTags, activeExclusions, pickedIds) => {
    // Don't pick the same event twice
    if (pickedIds.has(event.id)) return false;

    // Check 1: None of this event's tags should be in the active exclusions
    for (const tag of effective.tags) {
        if (activeExclusions.has(tag)) return false;
    }

    // Check 2: None of this event's incompatible tags should be in the active tags
    for (const tag of effective.incompatibleTags) {
        if (activeTags.has(tag)) return false;
    }

    // Check 3: All required tags must be present in active tags
    for (const tag of effective.requiredTags) {
        if (!activeTags.has(tag)) return false;
    }

    return true;
};

/**
 * Weighted random selection from an array of candidates.
 * @param {Array} candidates - Array of { event, effective } objects
 * @returns {Object} - The selected candidate object
 */
const weightedRandomSelect = (candidates) => {
    const totalWeight = candidates.reduce((sum, c) => sum + (c.event.weight || 10), 0);
    let r = Math.random() * totalWeight;

    for (const candidate of candidates) {
        r -= (candidate.event.weight || 10);
        if (r <= 0) return candidate;
    }

    // Fallback (shouldn't happen)
    return candidates[candidates.length - 1];
};

/**
 * Generate a playlist of events respecting compatibility constraints.
 * @param {Array} events - All available events
 * @param {number} length - Desired playlist length
 * @param {Array} folders - All folders (for tag inheritance)
 * @returns {Array} - Array of selected event objects (in order)
 */
export const generatePlaylist = (events, length, folders = []) => {
    const playlist = [];
    const activeTags = new Set();
    const activeExclusions = new Set();
    const pickedIds = new Set();

    // Pre-compute effective tags for all events
    const eventsWithEffective = events.map(event => ({
        event,
        effective: getEffectiveTags(event, folders),
    }));

    for (let i = 0; i < length; i++) {
        // Find valid candidates
        const candidates = eventsWithEffective.filter(({ event, effective }) =>
            isValidCandidate(event, effective, activeTags, activeExclusions, pickedIds)
        );

        if (candidates.length === 0) {
            console.log(`[Playlist] No valid candidates at step ${i + 1}. Stopping.`);
            break;
        }

        // Weighted random selection
        const selected = weightedRandomSelect(candidates);
        playlist.push(selected.event);
        pickedIds.add(selected.event.id);

        // Update state with effective tags (includes folder inheritance)
        selected.effective.tags.forEach(tag => activeTags.add(tag));
        selected.effective.incompatibleTags.forEach(tag => activeExclusions.add(tag));

        console.log(`[Playlist] Step ${i + 1}: Selected "${selected.event.name}" (weight: ${selected.event.weight || 10})`,
            `| Active Tags: [${[...activeTags]}]`,
            `| Exclusions: [${[...activeExclusions]}]`);
    }

    return playlist;
};
