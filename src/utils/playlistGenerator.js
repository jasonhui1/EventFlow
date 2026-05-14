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
        // Optimisation: Use O(1) Map lookup if available
        const folder = folders._byId ? folders._byId.get(currentFolderId) : folders.find(f => f.id === currentFolderId);
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
 * Check if an event matches a set of tag constraints
 * @param {Object} effective - Effective tags for the event
 * @param {Array} requiredTags - Tags that MUST be present (at least one)
 * @param {Array} excludedTags - Tags that MUST NOT be present
 * @returns {boolean}
 */
const matchesConstraints = (effective, requiredTags = [], excludedTags = []) => {
    // 1. Excluded tags: if any present, fail
    if (excludedTags.length > 0) {
        const hasExcluded = effective.tags.some(tag => excludedTags.includes(tag));
        if (hasExcluded) return false;
    }

    // 2. Required tags: if defined, at least one must be present
    if (requiredTags.length > 0) {
        const hasRequired = effective.tags.some(tag => requiredTags.includes(tag));
        if (!hasRequired) return false;
    }

    return true;
};

/**
 * Check if event matches folder constraints
 * @param {Object} event
 * @param {Array} requiredFolderIds
 * @returns {boolean}
 */
const matchesFolderConstraints = (event, requiredFolderIds = []) => {
    if (!requiredFolderIds || requiredFolderIds.length === 0) return true;
    return requiredFolderIds.includes(event.folderId);
};

/**
 * Weighted random selection with probability-based soft targeting
 * @param {Array} candidates - All valid candidates
 * @param {Object} slotConfig - Configuration for this slot (preferredTags, etc.)
 * @returns {Object} - Selected candidate
 */
const selectCandidate = (candidates, slotConfig = {}) => {
    const { preferredTags = [], preferredFolders = [] } = slotConfig;
    const hasPreferences = preferredTags.length > 0 || preferredFolders.length > 0;

    if (!hasPreferences) {
        return weightedRandomSelect(candidates);
    }

    // Split into preferred and standard pools
    const preferredPool = candidates.filter(({ event, effective }) => {
        const matchesTag = preferredTags.some(tag => effective.tags.includes(tag));
        const matchesFolder = preferredFolders.includes(event.folderId);
        return matchesTag || matchesFolder;
    });

    // Strategy: 75% chance to pick from preferred pool (if not empty)
    // 25% chance (or if preferred is empty) to pick from all valid candidates
    const PREFERRED_CHANCE = 0.75;

    if (preferredPool.length > 0 && Math.random() < PREFERRED_CHANCE) {
        // console.log(`[Playlist] Promoting preferred pool (${preferredPool.length} candidates)`);
        return weightedRandomSelect(preferredPool);
    }

    return weightedRandomSelect(candidates);
};

/**
 * Generate a playlist of events respecting compatibility constraints.
 * @param {Array} events - All available events
 * @param {number} length - Desired playlist length
 * @param {Array} folders - All folders (for tag inheritance)
 * @param {Array} slotTemplates - Optional array of slot configuration objects
 * @returns {Array} - Array of selected event objects (in order)
 */
export const generatePlaylist = (events, length, folders = [], slotTemplates = []) => {
    const playlist = [];
    const activeTags = new Set();
    const activeExclusions = new Set();
    const pickedIds = new Set();

    // Optimisation: O(1) folder lookup map
    const foldersMap = new Map();
    for (let i = 0; i < folders.length; i++) {
        foldersMap.set(folders[i].id, folders[i]);
    }
    const foldersWithMap = Object.assign([...folders], { _byId: foldersMap });

    // Pre-compute effective tags for all events
    const eventsWithEffective = events.map(event => ({
        event,
        effective: getEffectiveTags(event, foldersWithMap),
    }));

    // Track dynamic forward constraints from the *previously selected* event
    let currentForwardConstraints = {
        nextPreferredTags: [],
        nextRequiredTags: [],
        nextExcludedTags: []
    };

    for (let i = 0; i < length; i++) {
        // 1. Combine Slot Template + Forward Constraints
        const template = slotTemplates[i] || {};

        // Merge constraints (arrays)
        const combinedRequiredTags = [
            ...(template.requiredTags || []),
            ...(currentForwardConstraints.nextRequiredTags || [])
        ];

        const combinedExcludedTags = [
            ...(currentForwardConstraints.nextExcludedTags || []) // Templates don't usually have exclusions, but could add if needed
        ];

        const combinedPreferredTags = [
            ...(template.preferredTags || []),
            ...(currentForwardConstraints.nextPreferredTags || [])
        ];

        const requiredFolders = template.requiredFolders || [];
        const preferredFolders = template.preferredFolders || [];

        // 2. Filter valid candidates (Hard Constraints + Logic)
        let candidates = eventsWithEffective.filter(({ event, effective }) => {
            // Base logic (dupes, incompatibility)
            if (!isValidCandidate(event, effective, activeTags, activeExclusions, pickedIds)) return false;

            // Folder Hard Constraint
            if (!matchesFolderConstraints(event, requiredFolders)) return false;

            // Tag Hard Constraints
            if (!matchesConstraints(effective, combinedRequiredTags, combinedExcludedTags)) return false;

            return true;
        });

        // 3. Fallback Mechanism: If hard constraints result in 0 candidates, relax them
        if (candidates.length === 0) {
            // Check if it was the hard constraints that killed it
            const looseCandidates = eventsWithEffective.filter(({ event, effective }) =>
                isValidCandidate(event, effective, activeTags, activeExclusions, pickedIds)
            );

            if (looseCandidates.length > 0) {
                console.warn(`[Playlist] Step ${i + 1}: No candidates matched HARD constraints. Falling back to soft preferences.`);
                candidates = looseCandidates;
                // Treat the required tags as preferred now so we still try to pick them if possible
                combinedPreferredTags.push(...combinedRequiredTags);
            } else {
                console.log(`[Playlist] No valid candidates at step ${i + 1} even after relaxing constraints. Stopping.`);
                break;
            }
        }

        // 4. Selection (Soft Preferences via Probability)
        const selectionConfig = {
            preferredTags: combinedPreferredTags,
            preferredFolders: preferredFolders
        };

        const selected = selectCandidate(candidates, selectionConfig);
        playlist.push(selected.event);
        pickedIds.add(selected.event.id);

        // 5. Update State
        selected.effective.tags.forEach(tag => activeTags.add(tag));
        selected.effective.incompatibleTags.forEach(tag => activeExclusions.add(tag));

        // 6. Update Forward Constraints for NEXT step
        currentForwardConstraints = {
            nextPreferredTags: selected.event.nextPreferredTags || [],
            nextRequiredTags: selected.event.nextRequiredTags || [],
            nextExcludedTags: selected.event.nextExcludedTags || []
        };

        console.log(`[Playlist] Step ${i + 1}: Selected "${selected.event.name}"`,
            `| ReqTags: [${combinedRequiredTags}] PrefTags: [${combinedPreferredTags}]`,
            `| Next Constraints:`, currentForwardConstraints);
    }

    return playlist;
};
