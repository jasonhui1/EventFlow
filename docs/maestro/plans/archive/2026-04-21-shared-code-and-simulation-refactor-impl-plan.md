---
title: "Shared Code and Simulation Refactor Implementation Plan"
design_ref: "docs/maestro/plans/2026-04-21-shared-code-and-simulation-refactor-design.md"
created: "2026-04-21T10:30:00Z"
status: "draft"
total_phases: 3
estimated_files: 8
task_complexity: "medium"
---

# Shared Code and Simulation Refactor Implementation Plan

## Plan Overview

- **Total phases**: 3
- **Agents involved**: `refactor`, `coder`
- **Estimated effort**: Medium. Focuses on directory restructuring, service layer extraction, and endpoint deduplication.

## Dependency Graph

```
Phase 1: Shared Foundation
    |
Phase 2: Simulation Service
    |
Phase 3: Route Integration & Validation
```

## Execution Strategy

| Stage | Phases | Execution | Agent Count | Notes |
|-------|--------|-----------|-------------|-------|
| 1     | Phase 1 | Sequential | 1 | Restructuring |
| 2     | Phase 2 | Sequential | 1 | Business Logic |
| 3     | Phase 3 | Sequential | 1 | Integration |

## Phase 1: Shared Foundation

### Objective
Create the top-level `/shared/` directory and move core utilities there, ensuring both UI and Server can still resolve them.

### Agent: `refactor`
### Parallel: No

### Files to Create
- `shared/utils/.gitkeep` — Ensure directory is tracked.

### Files to Modify
- `src/utils/simulationUtils.js` -> `shared/utils/simulationUtils.js` (Move)
- `src/utils/promptEngine.js` -> `shared/utils/promptEngine.js` (Move)
- `src/utils/playlistGenerator.js` -> `shared/utils/playlistGenerator.js` (Move)
- `vite.config.js` — Add `@shared` alias pointing to `/shared`.
- `tsconfig.json` — Add `@shared/*` paths for IDE support.
- `src/store/useStore.js` — Update imports to `@shared/utils/...`.
- `src/components/EventSimulationModal.jsx` — Update imports to `@shared/utils/...`.

### Implementation Details
- Use `git mv` (or just `mv` and `rm`) to move files.
- Update `vite.config.js` `resolve.alias` section.
- Update `tsconfig.json` `compilerOptions.paths` section.

### Validation
- Run `npm run dev` (if applicable) to ensure frontend build passes.
- Check that moved files are reachable via relative paths from the server.

### Dependencies
- Blocked by: None
- Blocks: Phase 2

---

## Phase 2: Simulation Service

### Objective
Extract simulation orchestration logic from route handlers into a dedicated server-side service.

### Agent: `coder`
### Parallel: No

### Files to Create
- `server/services/simulationService.js` — Implements `runSimulation` and `generateSimulationPlaylist`.

### Files to Modify
- `server/routes/events.js` — Initial analysis to identify simulation code to extract.
- `server/routes/playlist.js` — Initial analysis to identify simulation code to extract.

### Implementation Details
- `runSimulation(eventId, options)`:
  - Fetches event from `dataStore`.
  - Composes prompt using `shared/utils/simulationUtils.js`.
  - Generates costume prompt using `shared/utils/promptEngine.js`.
  - Returns combined result.
- `generateSimulationPlaylist(length, options)`:
  - Uses `playlistGenerator.js` to get event sequence.
  - Runs `runSimulation` on each event if `simulate` is true.

### Validation
- Unit test for `SimulationService.js` if possible, or manual verification via route integration.

### Dependencies
- Blocked by: Phase 1
- Blocks: Phase 3

---

## Phase 3: Route Integration & Validation

### Objective
Refactor routes to use the new service and verify end-to-end functionality.

### Agent: `coder`
### Parallel: No

### Files to Modify
- `server/routes/events.js` — Replace simulation logic in POST endpoints with calls to `SimulationService`.
- `server/routes/playlist.js` — Replace simulation logic in POST endpoints with calls to `SimulationService`.

### Implementation Details
- Import `SimulationService` into both route files.
- Update `router.post('/:id/simulate')` and `router.post('/simulate/bulk')` in `events.js`.
- Update `router.post('/generate')` in `playlist.js`.
- Ensure error handling is consistent.

### Validation
- Perform manual HTTP requests (using `curl` or similar) to verify:
  - Event simulation still works.
  - Playlist generation with simulation still works.
- Verify frontend "Simulation" and "Playlist" features still work.

### Dependencies
- Blocked by: Phase 2
- Blocks: None

---

## File Inventory

| # | File | Phase | Purpose |
|---|------|-------|---------|
| 1 | `shared/utils/simulationUtils.js` | 1 | Shared simulation logic |
| 2 | `shared/utils/promptEngine.js` | 1 | Shared prompt generation |
| 3 | `shared/utils/playlistGenerator.js` | 1 | Shared playlist logic |
| 4 | `vite.config.js` | 1 | Path alias configuration |
| 5 | `tsconfig.json` | 1 | Path alias configuration |
| 6 | `server/services/simulationService.js` | 2 | New backend service layer |
| 7 | `server/routes/events.js` | 3 | Refactored events route |
| 8 | `server/routes/playlist.js` | 3 | Refactored playlist route |

## Risk Classification

| Phase | Risk | Rationale |
|-------|------|-----------|
| 1 | MEDIUM | Breaking frontend build due to path changes. |
| 2 | LOW | New code addition, isolated from existing paths. |
| 3 | MEDIUM | Regressions in core simulation API behavior. |

## Execution Profile

```
Execution Profile:
- Total phases: 3
- Parallelizable phases: 0
- Sequential-only phases: 3
- Estimated parallel wall time: N/A
- Estimated sequential wall time: 2-3 hours

Note: Native subagents currently run without user approval gates.
All tool calls are auto-approved without user confirmation.
```

## Cost Estimation

| Phase | Agent | Model | Est. Input | Est. Output | Est. Cost |
|-------|-------|-------|-----------|------------|----------|
| 1 | refactor | Pro | 3,000 | 1,000 | $0.10 |
| 2 | coder | Pro | 4,000 | 1,500 | $0.15 |
| 3 | coder | Pro | 5,000 | 1,000 | $0.14 |
| **Total** | | | **12,000** | **3,500** | **$0.39** |
