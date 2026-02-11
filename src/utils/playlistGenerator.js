/**
 * Playlist Generator - Selects a sequence of event flows
 * respecting Tags, Incompatible Tags, and Required Tags constraints.
 */

/**
 * Check if an event is a valid candidate for the current playlist state.
 * @param {Object} event - The event to check
 * @param {Set} activeTags - Tags accumulated from already-selected events
 * @param {Set} activeExclusions - Incompatible tags accumulated from already-selected events
 * @param {Set} pickedIds - IDs of events already in the playlist
 * @returns {boolean}
 */
const isValidCandidate = (event, activeTags, activeExclusions, pickedIds) => {
    // Don't pick the same event twice
    if (pickedIds.has(event.id)) return false;

    const eventTags = event.tags || [];
    const eventIncompatible = event.incompatibleTags || [];
    const eventRequired = event.requiredTags || [];

    // Check 1: None of this event's tags should be in the active exclusions
    for (const tag of eventTags) {
        if (activeExclusions.has(tag)) return false;
    }

    // Check 2: None of this event's incompatible tags should be in the active tags
    for (const tag of eventIncompatible) {
        if (activeTags.has(tag)) return false;
    }

    // Check 3: All required tags must be present in active tags
    for (const tag of eventRequired) {
        if (!activeTags.has(tag)) return false;
    }

    return true;
};

/**
 * Generate a playlist of events respecting compatibility constraints.
 * @param {Array} events - All available events
 * @param {number} length - Desired playlist length
 * @returns {Array} - Array of selected event objects (in order)
 */
export const generatePlaylist = (events, length) => {
    const playlist = [];
    const activeTags = new Set();
    const activeExclusions = new Set();
    const pickedIds = new Set();

    for (let i = 0; i < length; i++) {
        // Find valid candidates
        const candidates = events.filter(e =>
            isValidCandidate(e, activeTags, activeExclusions, pickedIds)
        );

        if (candidates.length === 0) {
            console.log(`[Playlist] No valid candidates at step ${i + 1}. Stopping.`);
            break;
        }

        // Pick a random candidate
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        playlist.push(selected);
        pickedIds.add(selected.id);

        // Update state
        (selected.tags || []).forEach(tag => activeTags.add(tag));
        (selected.incompatibleTags || []).forEach(tag => activeExclusions.add(tag));

        console.log(`[Playlist] Step ${i + 1}: Selected "${selected.name}"`,
            `| Active Tags: [${[...activeTags]}]`,
            `| Exclusions: [${[...activeExclusions]}]`);
    }

    return playlist;
};
