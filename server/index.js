/**
 * EventFlow API Server
 * 
 * Exposes the EventFlow data and simulation engine over HTTP
 * so external apps can query folders, events, and generate prompts.
 * 
 * Port: 4649 (chosen to avoid common port conflicts)
 * 
 * Usage:
 *   node server/index.js
 *   npm run api
 */
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

import eventsRouter from './routes/events.js';
import foldersRouter from './routes/folders.js';
import dataRouter from './routes/data.js';
import playlistRouter from './routes/playlist.js';
import clothesRouter from './routes/clothes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Sanitize __dirname for Windows (remove leading slash if it exists from URL-derived path)
const rootPath = __dirname.startsWith('/') && __dirname.includes(':') ? __dirname.substring(1) : __dirname;

const PORT = process.env.EVENTFLOW_PORT || 4649;

const app = express();

// ─── Diagnostics ──────────────────────────────────────────────
console.log(`[Startup] PID: ${process.pid} | Node: ${process.version}`);


// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large payloads for full data sync

// ─── Disable Caching ─────────────────────────────────────────
/**
 * Prevent browsers from caching API responses (especially GET /api/data/export)
 * to ensure new tabs/apps always see the latest source of truth.
 */
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// ─── Request logging ─────────────────────────────────────────
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/events', eventsRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/data', dataRouter);
app.use('/api/playlist', playlistRouter);
app.use('/api/clothes', clothesRouter);

// ─── Docs routes (Prioritized) ───────────────────────────────
app.get('/api/docs', async (req, res) => {
    const filePath = path.resolve(rootPath, 'openapi.yaml');
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.send(content);
    } catch (err) {
        console.error(`[Docs Error] Failed to read openapi.yaml:`, err.message);
        res.status(404).json({ 
            error: 'Documentation retrieval failed', 
            message: err.message,
            path: filePath 
        });
    }
});

app.get('/api/docs/ui', async (req, res) => {
    const filePath = path.resolve(rootPath, 'swagger-ui.html');
    try {
        const content = await fs.promises.readFile(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(content);
    } catch (err) {
        console.error(`[Docs Error] Failed to read swagger-ui.html:`, err.message);
        res.status(404).json({ 
            error: 'Documentation UI failed', 
            message: err.message,
            path: filePath 
        });
    }
});





// Bulk simulate shortcut (also accessible via /api/events/simulate/bulk)
app.post('/api/simulate/bulk', (req, res) => {
    // Forward to the events router handler
    req.url = '/simulate/bulk';
    eventsRouter.handle(req, res);
});

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', port: PORT, uptime: process.uptime() });
});

// ─── API index ───────────────────────────────────────────────
app.get('/api', (req, res) => {
    res.json({
        name: 'EventFlow API',
        version: '1.0',
        endpoints: [
            { method: 'GET', path: '/api/events', description: 'List all events' },
            { method: 'GET', path: '/api/events/:id', description: 'Get event details' },
            { method: 'GET', path: '/api/events/:id/prompts', description: 'Get composed prompts for event nodes' },
            { method: 'POST', path: '/api/events/:id/simulate', description: 'Simulate an event flow' },
            { method: 'POST', path: '/api/simulate/bulk', description: 'Simulate multiple events' },
            { method: 'GET', path: '/api/folders', description: 'List all folders (tree)' },
            { method: 'GET', path: '/api/folders/:id', description: 'Get folder with events' },
            { method: 'POST', path: '/api/playlist/generate', description: 'Generate event playlist' },
            { method: 'POST', path: '/api/data/sync', description: 'Push data from frontend' },
            { method: 'GET', path: '/api/data/export', description: 'Export full data store' },
            { method: 'GET', path: '/api/clothes', description: 'Get all costume templates' },
            { method: 'GET', path: '/api/clothes/names', description: 'List costume template names' },
            { method: 'GET', path: '/api/clothes/:name', description: 'Get single costume template' },
            { method: 'GET', path: '/api/health', description: 'Server health check' },
            { method: 'GET', path: '/api/docs', description: 'OpenAPI Specification (YAML)' },
            { method: 'GET', path: '/api/docs/ui', description: 'Interactive Swagger UI' },
        ],
    });
});

// ─── Docs routes ─────────────────────────────────────────────
// (Moved to top)


// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.url} - No route matched. PID: ${process.pid}`);
    res.status(404).json({ error: 'Not found', path: req.originalUrl, pid: process.pid });
});

// ─── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║         EventFlow API Server             ║
║                                          ║
║   http://localhost:${PORT}/api           ║
║                                          ║
║   Endpoints:                             ║
║     GET  /api/events                     ║
║     GET  /api/events/:id                 ║
║     POST /api/events/:id/simulate        ║
║     GET  /api/folders                    ║
║     POST /api/playlist/generate          ║
║     POST /api/data/sync                  ║
║     GET  /api/data/export                ║
║                                          ║
╚══════════════════════════════════════════╝
    `);
});
