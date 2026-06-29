// Types for handles and connections
export interface NodeInput {
  id: string;
  label: string;
  enabled?: boolean; // Used in StartNode inputs
}

export interface NodeOutput {
  id: string;
  label: string;
  weight?: number; // Used in BranchNode outputs
}

// Bounding box dimensions
export interface Position {
  x: number;
  y: number;
}

export interface DimensionStyle {
  width: number;
  height: number;
}

// Base properties shared by all React Flow nodes
export interface BaseNode {
  id: string;
  position: Position;
  width?: number;
  height?: number;
  style?: DimensionStyle;
  zIndex?: number;
}

// ─── Discriminated Node Types ────────────────────────────────────

export interface EventNode extends BaseNode {
  type: 'eventNode';
  data: {
    label: string;
    content?: string;
    localPrompt?: string[];
    inheritedPrompt?: string[];
    usePerspective?: boolean;
    cameraAbove?: boolean;
    cameraBelow?: boolean;
    cameraSide?: boolean;
    moodChangeMin?: number;
    moodChangeMax?: number;
    moodDisabled?: boolean;
    disabledInheritedSources?: string[];
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface GroupNode extends BaseNode {
  type: 'groupNode';
  data: {
    label: string;
    fixedPrompt?: string;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface BranchNode extends BaseNode {
  type: 'branchNode';
  data: {
    label: string;
    condition?: string;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface ReferenceNode extends BaseNode {
  type: 'referenceNode';
  data: {
    label: string;
    referenceId: string | null;
    referenceName: string;
    carryForwardText?: string;
    inputOverrides?: Record<string, boolean>;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface StartNode extends BaseNode {
  type: 'startNode';
  data: {
    label: string;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface EndNode extends BaseNode {
  type: 'endNode';
  data: {
    label: string;
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface IfNode extends BaseNode {
  type: 'ifNode';
  data: {
    label: string;
    conditionInputIds?: string[];
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface CarryForwardNode extends BaseNode {
  type: 'carryForwardNode';
  data: {
    label: string;
    inheritedPrompt?: string[];
    inputs?: NodeInput[];
    outputs?: NodeOutput[];
  };
}

export interface FieldNode extends BaseNode {
  type: 'fieldNode';
  data: {
    label: string;
    selectCount?: number;
    randomizeOrder?: boolean;
    childWeights?: Record<string, number>;
  };
}

// The Discriminated Union mapping all possible node configurations
export type AppNode =
  | EventNode
  | GroupNode
  | BranchNode
  | ReferenceNode
  | StartNode
  | EndNode
  | IfNode
  | CarryForwardNode
  | FieldNode;

// Edge connector definition
export interface AppEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}
