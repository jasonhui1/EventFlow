// promptEngine.js

// 1. The Color Dictionary
export const COLOR_RULES = {
    PLAIN: ['black', 'white', 'charcoal', 'brown',],
    NEUTRAL: ['black', 'white', 'grey', 'navy', 'brown', 'charcoal', 'beige', 'silver'],
    WARM: ['red', 'maroon', 'pink', 'orange', 'yellow', 'burgundy', 'peach'],
    COOL: ['aqua', 'light blue', 'blue', 'green', 'purple', 'royal blue', 'teal'],
    PASTEL: ['mint green', 'baby pink', 'powder blue', 'pale yellow'],
    // PASTEL: ['mint green', 'lavender', 'baby pink', 'powder blue', 'pale yellow'],
    // VIBRANT: ['primary red', 'electric blue', 'hot pink', 'cyan', 'lime green', 'magenta'],
    // JEWEL: ['ruby red', 'emerald green', 'sapphire blue', 'amethyst', 'deep teal'],
    // EARTH: ['olive green', 'terracotta', 'rust', 'mustard yellow', 'khaki'],
    // GOTHIC: ['crimson', 'midnight blue', 'dark plum', 'wine'],
    SPECIAL: ['plaid', 'checkered', 'striped']
};
const allColorNames = Object.values(COLOR_RULES).flat();
// Sort longest-first so "light blue" matches before "blue"
allColorNames.sort((a, b) => b.length - a.length);

const COMPLEMENTARY_PAIRS = [
    // The Orange/Blue Spectrum (Cinematic & Energetic)
    ['blue', 'orange'],
    ['teal', 'orange'],
    ['teal', 'peach'],
    ['cyan', 'orange'],

    // The Yellow/Purple Spectrum (Striking & Royal)
    ['purple', 'yellow'],
    ['amethyst', 'yellow'], // A jewel tone paired with a warm bright

    // The Green/Red-Pink Spectrum (Natural, Preppy, & Cute)
    ['green', 'burgundy'],
    ['olive green', 'pink'], // Incredibly popular in modern streetwear/anime casual
    ['mint green', 'pink'],  // Classic pastel "magical girl" or cute casual vibe
    ['green', 'peach'],

    // The Yellow/Blue Spectrum (Classic & Cheerful)
    ['blue', 'yellow'],
    ['royal blue', 'yellow'],
    ['light blue', 'yellow'],

    // The Red/Blue Spectrum (Bold & Heroic - classic anime protagonist colors)
    ['red', 'blue'],
    ['red', 'light blue'] // Very common for school uniform ribbons on blue skirts
];

const colorMap = {};
for (const [cat, colors] of Object.entries(COLOR_RULES)) {
    colors.forEach(c => colorMap[c] = cat);
}

export function hasFashionConflict(mainText, accentText) {
    const colorPattern = new RegExp('\\b(' + allColorNames.join('|') + ')\\b', 'gi');

    const getColors = (text) => {
        const matches = text.match(colorPattern) || [];
        return matches.map(w => w.toLowerCase()).filter(w => colorMap[w]);
    };
    const mainColors = getColors(mainText);
    const accentColors = getColors(accentText);
    // const allColors = [...mainColors, ...accentColors];
    // const categories = allColors.map(c => colorMap[c]);

    // // --- 1. Pattern Clash ---
    // const patternCount = categories.filter(cat => cat === 'SPECIAL').length;
    // if (patternCount > 1) return true;

    // --- 2. Saturation Clash (Pastel vs Vibrant) ---
    // if (categories.includes('VIBRANT') && categories.includes('PASTEL')) {
    //     return true;
    // }

    // // --- 3. The "Vibe" Clash (Earth vs Jewel) ---
    // if (categories.includes('EARTH') && categories.includes('JEWEL')) {
    //     return true;
    // }

    const mainHasWarm = mainColors.some(c => colorMap[c] === 'WARM');
    const mainHasCool = mainColors.some(c => colorMap[c] === 'COOL');

    // RULE 1: Big items cannot clash with each other! 
    // If the top and bottom roll Warm and Cool, instantly reject it.
    if (mainHasWarm && mainHasCool) {
        return true;
    }

    // RULE 2: Check for complementary pairs between Main and Accents
    const totalColors = [...mainColors, ...accentColors];
    const totalHasWarm = totalColors.some(c => colorMap[c] === 'WARM');
    const totalHasCool = totalColors.some(c => colorMap[c] === 'COOL');

    if (totalHasWarm && totalHasCool) {
        // Since we know the Main items don't clash, this means an Accent is clashing with a Main item.
        // Check if this specific combination is on our approved whitelist.
        const isComplementary = COMPLEMENTARY_PAIRS.some(pair =>
            totalColors.includes(pair[0]) && totalColors.includes(pair[1])
        );

        // If it is NOT an approved complementary pair, reject it.
        return !isComplementary;
    }

    return false; // The outfit is perfectly balanced!
}


// 2. Core Helper Functions
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Resolves a single bracket's contents based on ^ weights (e.g., "skirt^3$pants")
export function getWeightedRandom(tokenString) {
    const cleanString = tokenString.replace(/[<>]/g, '');
    const options = cleanString.split('$');

    let totalWeight = 0;
    const weightedOptions = options.map(opt => {
        const parts = opt.split('^');
        const item = parts[0].trim();
        const weight = parts.length > 1 ? parseFloat(parts[1]) : 1; // Default weight is 1

        totalWeight += weight;
        return { item, weight };
    });

    let randomNum = Math.random() * totalWeight;

    for (const option of weightedOptions) {
        randomNum -= option.weight;
        if (randomNum <= 0) {
            return option.item === "none" ? "" : option.item;
        }
    }
    return "";
}

// Resolves a single bracket: weighted random → color category expansion → sync lookup
function resolveChoice(tokenString, syncMap = {}) {
    let choice = getWeightedRandom(tokenString);

    // Check if the rolled choice is a color category tag (e.g., "WARM" → "red")
    const upperChoice = choice.toUpperCase();
    if (COLOR_RULES[upperChoice]) {
        choice = getRandomElement(COLOR_RULES[upperChoice]);
    } else if (upperChoice.startsWith('@')) {
        choice = syncMap[upperChoice.substring(1)] || '';
    }

    return choice;
}

// Pre-resolves sync definitions from a "sync" key in the outfit template JSON.
// e.g. { "MAIN": "neutral^3$cool" } → { "MAIN": "navy" }
function resolveSyncDefinitions(syncDefs, lockedSyncMap = null) {
    if (lockedSyncMap) return lockedSyncMap; // If it's locked, use the saved one
    const syncMap = {};
    if (!syncDefs) return syncMap;

    for (const [name, options] of Object.entries(syncDefs)) {
        syncMap[name.toUpperCase()] = resolveChoice(`<${options}>`);
    }
    return syncMap;
}


// 3. The Recursive Parser
// Handles infinite nesting from the inside out and swaps color tags
// syncMap: optional shared object for <@NAME> / <@NAME$> color syncing across layers
export function processPromptString(template, syncMap = {}) {
    if (!template) return "";

    let resolvedString = template;

    // Regex explanation: /<([^<>]+)>/g matches innermost brackets only
    // It keeps looping until no brackets are left in the string
    while (/<[^<>]+>/.test(resolvedString)) {
        resolvedString = resolvedString.replace(/<([^<>]+)>/g, (match) => {
            return resolveChoice(match, syncMap);
        });
    }

    return resolvedString;
}


// Evaluates multiple ? (exclude if present) and # (require if present)
export function applyConditionals(promptString) {
    // 1. Break the prompt into an array of individual items
    let segments = promptString.split(',').map(s => s.trim()).filter(Boolean);

    // 2. Build a "clean" reference list of all targets (stripping their operators)
    // Example: "eyes?closed eyes" becomes just "eyes"
    let cleanTargets = segments.map(seg => {
        let matchIndex = seg.search(/[?#]/);
        return matchIndex === -1 ? seg : seg.substring(0, matchIndex).trim();
    });

    let finalSegments = [];

    // 3. Evaluate each segment against the rest of the clean prompt
    segments.forEach((seg, currentIndex) => {
        let matchIndex = seg.search(/[?#]/);

        // If this item has no conditions, just keep it and move on
        if (matchIndex === -1) {
            finalSegments.push(seg);
            return;
        }

        let target = seg.substring(0, matchIndex).trim();
        let conditionsPart = seg.substring(matchIndex);

        // Grab ALL conditions attached to this item (e.g., "?closed eyes", "?head out of frame")
        let conditions = [...conditionsPart.matchAll(/([?#])([^?#]+)/g)];

        let shouldKeep = true;

        // Create a string of all OTHER items to check against (so it doesn't trigger on itself)
        let otherTargetsString = cleanTargets.filter((_, i) => i !== currentIndex).join(' ');

        for (let cond of conditions) {
            let operator = cond[1];
            let conditionText = cond[2].trim();

            // Escape special characters and check if the exact condition exists as a whole word
            let escapedCondition = conditionText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            let checkRegex = new RegExp('\\b' + escapedCondition + '\\b', 'i');
            let isPresent = checkRegex.test(otherTargetsString);

            if (operator === '?') {
                // EXCLUDE if present
                if (isPresent) {
                    shouldKeep = false;
                    break; // Fails immediately, stop checking other conditions
                }
            } else if (operator === '#') {
                // REQUIRE to be present
                if (!isPresent) {
                    shouldKeep = false;
                    break; // Missing a required tag, stop checking
                }
            }
        }

        // If it passed all conditions, add it to the final prompt
        if (shouldKeep && target !== "") {
            finalSegments.push(target);
        }
    });

    return finalSegments.join(', ');
}


// 4. String Formatter
// Cleans up messy punctuation left by empty variables or weird JSON formatting
export function cleanupPrompt(promptString) {
    let finalPrompt = promptString
        .replace(/\s+/g, ' ')           // Remove extra spaces
        .replace(/ ,/g, ',')            // Fix spaces before commas
        .replace(/,{2,}/g, ',')         // Collapse multiple commas into one
        .trim();

    // Strip trailing or leading commas
    if (finalPrompt.endsWith(',')) finalPrompt = finalPrompt.slice(0, -1);
    if (finalPrompt.startsWith(',')) finalPrompt = finalPrompt.slice(1).trim();

    return finalPrompt;
}

export function convertText(prompt) {
    return processPromptString(prompt);
}


// THE NEW CORE ENGINE
export function generateOutfitParts(outfitTemplate, customPrompts = {}, lockedSyncMap = null) {
    if (!outfitTemplate) return { parts: {}, syncMap: {} };

    const mainLayers = ['outerwear', 'top', 'bottom'];
    const accentLayers = ['neckwear', 'legwear', 'accessories'];
    const MAX_RETRIES = 100;

    let finalParts = { ...customPrompts };

    // Use the locked sync map if provided, otherwise roll a new one
    let syncMap = resolveSyncDefinitions(outfitTemplate.sync, lockedSyncMap);

    const rollGroup = (layers) => {
        let result = {};
        for (const layer of layers) {
            if (customPrompts[layer] !== undefined) {
                result[layer] = customPrompts[layer].trim();
            } else if (outfitTemplate[layer]) {
                const processed = processPromptString(outfitTemplate[layer], syncMap);
                result[layer] = processed.trim();
            }
        }
        return result;
    };

    const getCombinedString = (partsObj) => Object.values(partsObj).filter(Boolean).join(', ');

    let tempMainParts = {};
    let finalMainString = "";

    // --- PHASE 1: Generate valid Main Garments ---
    for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
        tempMainParts = rollGroup(mainLayers);
        finalMainString = getCombinedString(tempMainParts);
        if (!hasFashionConflict(finalMainString, "")) break;
    }
    Object.assign(finalParts, tempMainParts);

    // --- PHASE 2: Generate valid Accents ---
    let tempAccentParts = {};
    for (let attempts = 0; attempts < MAX_RETRIES; attempts++) {
        tempAccentParts = rollGroup(accentLayers);
        const finalAccentString = getCombinedString(tempAccentParts);
        if (!hasFashionConflict(finalMainString, finalAccentString)) break;
    }
    Object.assign(finalParts, tempAccentParts);

    // Return BOTH the parts and the syncMap so React can hold onto it
    return { parts: finalParts, syncMap };
}

export function generateOutfit(categoryName, outfitsDB, customPrompts = {}) {
    const outfitTemplate = outfitsDB[categoryName];
    if (!outfitTemplate) return "";

    const { parts } = generateOutfitParts(outfitTemplate, customPrompts);

    // Just join the raw parts together.
    return Object.values(parts).filter(Boolean).join(', ');
}

/**
 * Randomly select a costume based on weights and generate its prompt string.
 */
export function generateCostumePrompt(eventCostumes = [], clothesDB = {}) {
    if (!eventCostumes || eventCostumes.length === 0 || !clothesDB || Object.keys(clothesDB).length === 0) {
        return "";
    }

    const totalWeight = eventCostumes.reduce((sum, c) => sum + (Number(c.weight) || 1), 0);
    let roll = Math.random() * totalWeight;
    let selectedCostume = typeof eventCostumes[0] === 'string' ? eventCostumes[0] : eventCostumes[0].name;

    for (const c of eventCostumes) {
        const w = Number(c.weight) || 1;
        const name = typeof c === 'string' ? c : c.name;
        roll -= w;
        if (roll <= 0) {
            selectedCostume = name;
            break;
        }
    }

    return generateOutfit(selectedCostume, clothesDB);
}