---
title: "Shared Code and Simulation Refactor"
created: "2026-04-21T10:00:00Z"
status: "approved"
authors: ["TechLead", "User"]
type: "design"
design_depth: "standard"
task_complexity: "medium"
---

# Shared Code and Simulation Refactor Design Document

## Problem Statement

The project currently has significant logic duplication between the Express server and the React UI, particularly in simulation logic, prompt generation, and event handling. This leads to maintenance challenges, potential bugs where one side is updated but the other isn't, and a lack of a single source of truth for core gameplay rules. Additionally, the server routes `events.js` and `playlist.js` repeat complex simulation setup code that should be unified.

## Requirements

### Functional Requirements

1. **REQ-1**: Centralize shared utilities (`simulationUtils.js`, `promptEngine.js`, `playlistGenerator.js`) in a top-level `/shared/` directory.
2. **REQ-2**: Ensure both the Vite-powered UI and the Node-powered server can import from the new `/shared/` directory.
3. **REQ-3**: Extract a common `SimulationService` in the backend to handle simulation orchestration.
4. **REQ-4**: Deduplicate `events.js` and `playlist.js` by calling the new `SimulationService`.

### Non-Functional Requirements

1. **REQ-N1**: Maintain zero external dependencies in the shared utilities to keep them lightweight.
2. **REQ-N2**: All existing tests and simulation functionality must remain identical after the refactor.
3. **REQ-N3**: Use consistent naming and layering patterns in the new backend service layer.

### Constraints

- Tech Stack: Vite (React) Frontend, Express (Node.js) Backend.
- Architecture: Flat routes structure with Store layer for persistence.

## Approach

### Selected Approach

**Targeted Extract & Share (Approach 1)**

We'll move existing shared logic to a top-level `/shared/` directory and create a single `simulationService.js` in a new `server/services/` directory to deduplicate the most egregious repetition in the server routes.

### Alternatives Considered

#### Full Architectural Refactor (Approach 2)

- **Description**: Comprehensive restructuring with services for every domain and full standardization.
- **Pros**: Clean, professional-grade architecture; eliminates all duplication.
- **Cons**: High implementation effort and regression risk.
- **Rejected Because**: The scope of a full refactor was disproportionate to the immediate need for sharing simulation logic between UI and server.

### Decision Matrix

| Criterion | Weight | Approach 1 (Targeted) | Approach 2 (Full) |
|-----------|--------|-----------------------|-------------------|
| Deduplication Effectiveness | 40% | 4: Fixes major issues | 5: Fixes everything |
| Implementation Speed | 30% | 5: Very fast | 2: Time-consuming |
| Maintainability | 20% | 3: Some debt remains | 5: Excellent |
| Risk Management | 10% | 5: Low risk | 3: Higher risk |
| **Weighted Total** | | **4.4** | **3.8** |

## Architecture

### Component Diagram

```
[UI/React]         [Server/Express]
    |                    |
    +----[Shared/Utils]--+
             |
    [simulationUtils.js]
    [promptEngine.js]
    [playlistGenerator.js]
```

### Data Flow

1. Server Routes receive HTTP POST requests.
2. Route Handlers call `SimulationService.js` (Server-side only).
3. `SimulationService` fetches data from Stores.
4. `SimulationService` applies business logic using Shared Utilities.
5. `SimulationService` returns processed results to the Route.
6. Route sends JSON response back to client.

### Key Interfaces

```javascript
// SimulationService.js
export const runSimulation = async (eventId, options) => { ... }
export const generateSimulationPlaylist = async (length, options) => { ... }
```

## Agent Team

| Phase | Agent(s) | Parallel | Deliverables |
|-------|----------|----------|--------------|
| 1     | refactor | No       | Shared directory and Service layer |
| 2     | coder    | No       | Route refactoring and validation |

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Regression in Simulation Logic | HIGH | MEDIUM | Detail validation before/after move |
| Import/Pathing Errors | MEDIUM | MEDIUM | Exhaustive search and verify builds |
| Sync/Replace Logic Compat | MEDIUM | LOW | Leave existing store signatures unchanged |

## Success Criteria

1. All simulation functionality in `events.js` and `playlist.js` continues to return identical results.
2. The frontend continues to function without errors after moving utilities to `/shared/`.
3. Backend route code is simplified, with core business logic moved to `SimulationService`.
