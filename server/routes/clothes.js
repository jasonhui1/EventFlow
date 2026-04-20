/**
 * Clothes/costume template routes.
 */
import { Router } from 'express';
import { getAllClothes, getCostumeTemplate, getCostumeNames, saveClothes } from '../clothesStore.js';

const router = Router();

/**
 * GET /api/clothes
 * Returns the full clothes database (all costume templates).
 */
router.get('/', (req, res) => {
    const clothes = getAllClothes();
    res.json({ clothes });
});

/**
 * GET /api/clothes/names
 * Returns just the list of available costume names.
 */
router.get('/names', (req, res) => {
    const names = getCostumeNames();
    res.json({ names });
});

/**
 * GET /api/clothes/:name
 * Returns a single costume template by name.
 */
router.get('/:name', (req, res) => {
    const template = getCostumeTemplate(req.params.name);
    if (!template) {
        return res.status(404).json({ error: 'Costume template not found' });
    }
    res.json({ name: req.params.name, template });
});

/**
 * PUT /api/clothes
 * Replaces the entire clothes database (for future editor support).
 */
router.put('/', (req, res) => {
    const { clothes } = req.body;
    if (!clothes || typeof clothes !== 'object') {
        return res.status(400).json({ error: 'Invalid clothes data' });
    }

    const success = saveClothes(clothes);
    if (success) {
        res.json({ success: true, count: Object.keys(clothes).length });
    } else {
        res.status(500).json({ error: 'Failed to save clothes data' });
    }
});

export default router;
