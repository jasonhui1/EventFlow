---
title: "Global Event Fixed Prompts"
created: "2026-04-21T10:00:00Z"
status: "approved"
authors: ["TechLead", "User"]
type: "design"
design_depth: "standard"
task_complexity: "medium"
---

# Global Event Fixed Prompts Design Document

## Problem Statement

**Overview**: The current event simulation logic requires prompts to be defined at the individual event level or node level. There is no way to apply a consistent "global" prompt across all events in a project without manually editing each one.

**User Impact**: Users want to be able to prepend or append fixed text to *every* generated prompt project-wide to set a consistent context or stylistic modifier (e.g., a specific lighting or camera style) without repetition.

**Key Requirements**:
1. Add two global prompt slots: **Global Prepend** (before the entire prompt chain) and **Global Append** (after the entire prompt chain).
2. Persist these global prompts in the project's data file (`eventflow-data.json`).
3. Provide a dedicated modal UI (`GlobalPromptModal.jsx`) for managing these prompts.

## Requirements

### Functional Requirements

1. **REQ-1 (State Management)**: `useStore.js` must store `globalPrependPrompt` and `globalAppendPrompt` as part of the project state.
2. **REQ-2 (Persistence)**: The global prompts must be saved to `data/eventflow-data.json` whenever the project is saved.
3. **REQ-3 (UI Integration)**: A new `GlobalPromptModal.jsx` component must be implemented to provide a dedicated editing interface for these prompts.
4. **REQ-4 (Simulation Logic)**: The `getComposedPrompt` function in `simulationUtils.js` must be updated to prepend the `globalPrependPrompt` and append the `globalAppendPrompt` to the final prompt string.

### Non-Functional Requirements

1. **REQ-5 (Performance)**: The prompt composition logic must remain performant, with no noticeable overhead from adding these global strings.
2. **REQ-6 (UI Consistency)**: The new configuration modal must match the existing styling and interaction patterns of the app.

## Approach

### Selected Approach: Pragmatic Extension (Recommended)

**Summary**: We'll extend the existing zustand store and simulation utilities with dedicated fields for global prepend and append prompts. This approach is straightforward, performant, and directly addresses the user request with minimal architectural disruption.

**Architecture**:
- **Store**: Add `globalPrependPrompt` and `globalAppendPrompt` to the initial state in `useStore.js`.
- **UI**: Implement `GlobalPromptModal.jsx` to manage these fields.
- **Engine**: Update `getComposedPrompt` to include these parts at the start and end of the composition array.

### Alternatives Considered

#### Generic Global Parts
- **Description**: Allow users to add any number of global prompt "parts" with priority weights for ordering.
- **Pros**: Highly flexible for future global additions.
- **Cons**: More complex UI and state management; overkill for the current request.
- **Rejected Because**: The user explicitly asked for "one for prepend, one for append," which this approach would complicate unnecessarily.

### Decision Matrix

| Criterion | Weight | Pragmatic Extension | Generic Global Parts |
|-----------|--------|---------------------|----------------------|
| Ease of Implementation | 40% | 5: Very straightforward | 2: Requires more state/UI work |
| User Flexibility | 30% | 3: Meets current needs | 5: Very flexible |
| Maintenance | 30% | 5: Minimal overhead | 3: More complex logic |
| **Weighted Total** | | **4.4** | **3.2** |

## Architecture

### Component Diagram

```
[UI Layer: GlobalPromptModal.jsx] --> [State Layer: useStore.js]
                                              |
                                              v
[Simulation Layer: simulationUtils.js] <-- [State Layer: useStore.js]
```

### Data Flow

1. User opens `GlobalPromptModal.jsx` and enters global prepend/append strings.
2. State is updated in `useStore.js` and persists to `eventflow-data.json`.
3. When `simulateEvent` is triggered, it calls `getComposedPrompt`.
4. `getComposedPrompt` reads the global prompts from the store and integrates them:
   - `parts.unshift(globalPrependPrompt)` (at the start).
   - `parts.push(globalAppendPrompt)` (at the end).
5. The final prompt is returned and used in the simulation.

### Key Interfaces

```typescript
interface GlobalConfig {
  globalPrependPrompt: string;
  globalAppendPrompt: string;
}

interface PromptStore {
  config: GlobalConfig;
  updateGlobalPrependPrompt: (prompt: string) => void;
  updateGlobalAppendPrompt: (prompt: string) => void;
}
```

**Rationale Annotations**:
- `GlobalPromptModal.jsx` reuse `ResizingTextarea.jsx` — *Ensures the same editing experience as the existing Prompt List and Costume editor.*
- `getComposedPrompt` integration — *By using the existing 'parts' array logic, we maintain the ability to easily label and debug each prompt segment.*

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **Schema Compatibility** | LOW | LOW | Use default empty strings in the store to ensure existing projects load without errors. |
| **Prompt Bloat** | LOW | MEDIUM | Ensure the UI for global prompts clearly communicates they apply to *everything*, potentially leading to long prompts if not managed carefully. |
| **Logic Conflict** | LOW | LOW | Use the existing `parts` array in `getComposedPrompt` to maintain clear ordering and avoid overwriting event-specific logic. |

**Rationale Annotations**:
- **Schema Compatibility** — *By using default values, we ensure that projects saved before this feature was added can still be loaded and used.*
- **Prompt Bloat** — *Providing a central UI for global prompts allows users to easily see and manage their global context in one place.*

## Success Criteria

1. Users can open a dedicated **Global Prompts** modal from the UI.
2. The modal provides two textareas: **Global Prepend** and **Global Append**.
3. Changes to these prompts are persisted in the project's state and `eventflow-data.json`.
4. The simulation output (`getComposedPrompt`) correctly integrates the global prepend at the very beginning and the global append at the very end.

**Rationale Annotations**:
- **Persistence** — *Ensures the user's configuration is saved across sessions.*
- **Correct Integration** — *Validates that the global strings are applied at the correct extremes of the prompt chain.*
