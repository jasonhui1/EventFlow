# EventFlow Data Structure Reference

This document describes the data structures used in the EventFlow application, distinguishing between React Flow's native properties and custom application-specific properties.

---

## Node Structure

```javascript
{
  // ═══════════════════════════════════════════════════════════════
  // REACT FLOW NATIVE PROPERTIES (managed by React Flow)
  // ═══════════════════════════════════════════════════════════════
  id: "uuid-string",           // Unique identifier
  type: "eventNode",           // Node type (determines which component renders)
  position: { x: 100, y: 200 }, // Top-left corner position
  
  // Set by applyNodeChanges after NodeResizer resize:
  width: 350,                  // Actual width (after resize)
  height: 180,                 // Actual height (after resize)
  
  // Internal React Flow runtime properties (NOT persisted reliably):
  measured: { width, height }, // DOM-measured dimensions - DON'T USE FOR LOGIC
  selected: true,              // Selection state - passed to component as prop
  dragging: false,             // Drag state
  
  // ═══════════════════════════════════════════════════════════════
  // STYLE PROPERTIES (initial dimensions, passed to component)
  // ═══════════════════════════════════════════════════════════════
  style: {
    width: 200,                // Initial width (set at creation)
    height: 150,               // Initial height (set at creation)
  },
  
  // ═══════════════════════════════════════════════════════════════
  // CUSTOM DATA PROPERTIES (application-specific, in node.data)
  // ═══════════════════════════════════════════════════════════════
  data: {
    label: "Event Name",       // Display name
    // ... type-specific properties (see below)
  }
}
```

---

## Node Types & Their Custom Data

### `eventNode`
```javascript
data: {
  label: "Event Name",
  localPrompt: "prompt text",           // Prompt for this event only
  inheritedPrompt: "inherited text",    // Prompt that carries forward
  disabledInheritedSources: ["nodeId"], // Nodes to ignore inheritance from
  usePerspective: false,                // Add perspective to prompt
  cameraAbove: false,                   // Camera angle modifiers
  cameraBelow: false,
  cameraSide: false,
  outputs: [{ id: "output_xxx", label: "Output 1" }],
  inputs: [{ id: "input_xxx", label: "Input 1" }],
}
```

### `groupNode`
```javascript
data: {
  label: "Group Name",
  fixedPrompt: "group prompt",          // Fixed prompt for this group
  outputs: [{ id, label }],
  inputs: [{ id, label }],
}
```

### `branchNode`
```javascript
data: {
  label: "Branch",
  outputs: [{ id, label, weight: 50 }], // Weight affects random selection
  inputs: [{ id, label }],
}
```

### `fieldNode`
```javascript
data: {
  label: "Field",
  selectCount: 1,                       // Number of children to select
  randomizeOrder: true,                 // Shuffle execution order
  childWeights: { "nodeId": 50 },       // Weight per child node
}
// Note: dimensions read from node.width/height (React Flow native)
// Fallback to style.width/height (initial values)
```

### `referenceNode`
```javascript
data: {
  label: "Reference",
  referenceId: "event-uuid",            // ID of referenced event
  inputOverrides: { "inputId": true },  // Override start node inputs
}
```

### `ifNode`
```javascript
data: {
  label: "If",
  conditionInputIds: ["inputId"],       // Input IDs to check (AND logic)
}
```

### `startNode`
```javascript
data: {
  label: "Start",
  inputs: [{                            // Configurable inputs
    id: "input_xxx",
    label: "Input 1",
    enabled: true,                      // Toggle for simulation
  }],
}
```

### `endNode`
```javascript
data: {
  label: "End",
}
```

### `carryForwardNode`
```javascript
data: {
  label: "Carry Forward",
  inheritedPrompt: "text",              // Prompt that carries forward
}
```

---

## Edge Structure

```javascript
{
  // ═══════════════════════════════════════════════════════════════
  // REACT FLOW NATIVE PROPERTIES
  // ═══════════════════════════════════════════════════════════════
  id: "edge_uuid",             // Unique identifier
  source: "source-node-id",    // ID of source node
  target: "target-node-id",    // ID of target node
  sourceHandle: "output_xxx",  // Handle ID on source (nullable)
  targetHandle: "input_xxx",   // Handle ID on target (nullable)
  type: "smoothstep",          // Edge type (smoothstep, bezier, etc.)
  animated: true,              // Animated dash pattern
  
  // ═══════════════════════════════════════════════════════════════
  // STYLE PROPERTIES
  // ═══════════════════════════════════════════════════════════════
  style: {
    stroke: "#C9B5FF",         // Edge color
    strokeWidth: 2,            // Edge thickness
  }
}
```

---

## Event Structure (Top-Level Container)

```javascript
{
  id: "event-uuid",
  name: "Event Name",
  description: "Optional description",
  fixedPrompt: "Event-level prompt",    // Applied to all nodes in event
  folderId: "folder-uuid" | null,       // Parent folder
  costumes: [{ name: "Costume", weight: 1 }],
  nodes: [...],                         // Array of node objects
  edges: [...],                         // Array of edge objects
  createdAt: "ISO timestamp",
  updatedAt: "ISO timestamp",
}
```

---

## Store State Structure

```javascript
{
  // Current editing state
  currentEventId: "uuid",
  nodes: [...],                // Current event's nodes
  edges: [...],                // Current event's edges
  selectedNode: node | null,   // Currently selected node
  
  // Library
  events: [...],               // All events
  folders: [...],              // Folder structure
  
  // UI State
  contextMenu: { x, y, type } | null,
  
  // History (undo/redo)
  history: [{ nodes, edges }],
  historyIndex: 0,
  maxHistoryLength: 50,
  isUndoRedo: false,
}
```

---

## Key Behaviors

### Dimension Handling
| Source | When Available | Use Case |
|--------|---------------|----------|
| `node.width/height` | After resize (via applyNodeChanges) | ✅ Simulation, logic |
| `node.style.width/height` | Initial creation only | Fallback for initial size |
| `node.measured.width/height` | Runtime only (DOM) | ❌ Never use for logic |

### FieldNode Child Detection
Nodes are considered "inside" a fieldNode if their top-left position is within the field bounds:
```javascript
nodeX >= fieldX && nodeX < fieldX + fieldWidth &&
nodeY >= fieldY && nodeY < fieldY + fieldHeight
```

### Simulation Flow
1. Start from `startNode`s
2. Traverse via edges
3. Nodes inside fields are blocked until field selects them
4. `branchNode` randomly selects one output path
5. `ifNode` evaluates condition and takes true/false path
6. `referenceNode` recursively simulates referenced event
