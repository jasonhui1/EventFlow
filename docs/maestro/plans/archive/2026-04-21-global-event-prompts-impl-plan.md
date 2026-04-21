---
title: "Global Event Fixed Prompts Implementation Plan"
design_ref: "docs/maestro/plans/2026-04-21-global-event-prompts-design.md"
created: "2026-04-21T11:00:00Z"
status: "draft"
total_phases: 3
estimated_files: 5
task_complexity: "medium"
---

# Global Event Fixed Prompts Implementation Plan

## Plan Overview

- **Total phases**: 3
- **Agents involved**: `coder`
- **Estimated effort**: Medium. Extends the existing state store and prompt composition logic with a new configuration UI.

## Dependency Graph

```
Phase 1 (Store) --> Phase 2 (Logic) --> Phase 3 (UI & Verification)
```

## Execution Strategy

| Stage | Phases | Execution | Agent Count | Notes |
|-------|--------|-----------|-------------|-------|
| 1     | Phase 1 | Sequential | 1 | Store & Data Foundation |
| 2     | Phase 2 | Sequential | 1 | Simulation Engine Update |
| 3     | Phase 3 | Sequential | 1 | UI & Final Verification |

## Phase 1: Store & Data Foundation

### Objective
Add `globalPrependPrompt` and `globalAppendPrompt` to the zustand store and ensure they persist to `eventflow-data.json`.

### Agent: coder
### Parallel: No

### Files to Modify

- `src/store/useStore.js` — Add `globalPrependPrompt` and `globalAppendPrompt` to initial state. Add `updateGlobalPrependPrompt` and `updateGlobalAppendPrompt` actions.
- `data/eventflow-data.json` — Add these fields to the root object as empty strings to initialize the schema.

### Implementation Details

- **State Interface**:
  ```typescript
  interface GlobalConfig {
    globalPrependPrompt: string;
    globalAppendPrompt: string;
  }
  ```
- **Store Actions**:
  - `updateGlobalPrependPrompt(prompt: string)`
  - `updateGlobalAppendPrompt(prompt: string)`
- **Persistence**: Ensure `saveProject` includes these global fields.

### Validation

- Open `useStore.js` and verify state fields and actions.
- Call `updateGlobalPrependPrompt` from the console and verify the store updates.

### Dependencies

- Blocked by: None
- Blocks: Phase 2, Phase 3

---

## Phase 2: Simulation Logic Integration

### Objective
Update the prompt composition logic in `simulationUtils.js` to incorporate the global prompts from the store.

### Agent: coder
### Parallel: No

### Files to Modify

- `src/utils/simulationUtils.js` — Update `getComposedPrompt` to read from the store and integrate global strings.

### Implementation Details

- **getComposedPrompt**:
  - Retrieve `globalPrependPrompt` and `globalAppendPrompt` from the store.
  - `if (globalPrependPrompt) parts.unshift({ label: 'Global Prepend', text: globalPrependPrompt });`
  - `if (globalAppendPrompt) parts.push({ label: 'Global Append', text: globalAppendPrompt });`
  - *Note: Ensure the label and text structure matches how the system handles 'parts'.*

### Validation

- Run a simulation and check the `parts` array (if logged) or the final joined prompt to ensure the global strings are present at the extremes.

### Dependencies

- Blocked by: Phase 1
- Blocks: Phase 3

---

## Phase 3: UI & Final Verification

### Objective
Implement the `GlobalPromptModal.jsx` and add a trigger in `App.jsx`. Verify the full end-to-end flow.

### Agent: coder
### Parallel: No

### Files to Create

- `src/components/GlobalPromptModal.jsx` — Implement the configuration UI with two textareas and save/cancel buttons.

### Files to Modify

- `src/App.jsx` — Add a button or menu item to open the `GlobalPromptModal`.

### Implementation Details

- **GlobalPromptModal**:
  - Use `Modal` and `ResizingTextarea` from `src/components`.
  - Bind values to `globalPrependPrompt` and `globalAppendPrompt` from the store.
- **App.jsx**:
  - Add `setIsGlobalPromptModalOpen` state.
  - Place the button near other configuration tools (like Mood Config).

### Validation

- Open the modal, enter text, save it.
- Run a simulation and verify the generated prompt includes the entered strings.
- Reload the app and verify the strings are persisted.

### Dependencies

- Blocked by: Phase 1, Phase 2
- Blocks: None

---

## File Inventory

| # | File | Phase | Purpose |
|---|------|-------|---------|
| 1 | `src/store/useStore.js` | 1 | State management for global prompts. |
| 2 | `data/eventflow-data.json` | 1 | Persistent storage for global prompts. |
| 3 | `src/utils/simulationUtils.js` | 2 | Prompt composition logic. |
| 4 | `src/components/GlobalPromptModal.jsx` | 3 | UI for managing global prompts. |
| 5 | `src/App.jsx` | 3 | UI entry point for global prompts. |

## Risk Classification

| Phase | Risk | Rationale |
|-------|------|-----------|
| 1 | LOW | Standard store extension. |
| 2 | LOW | Purely logical update to a modular function. |
| 3 | MEDIUM | Involves new UI component and layout changes in the main app. |

## Execution Profile

```
Execution Profile:
- Total phases: 3
- Parallelizable phases: 0
- Sequential-only phases: 3
- Estimated parallel wall time: 3 phases (serial)
- Estimated sequential wall time: 3 phases (serial)

Note: Native subagents currently run without user approval gates.
All tool calls are auto-approved without user confirmation.
```
