import type { AppEdge, AppNode } from "./graph";

// Costume object inside events
export interface CostumeConfig {
  name: string;
  weight?: number;
}

export type EventCostume = string | CostumeConfig;

// Core Event structure in the library
export interface AppEvent {
  id: string;
  name: string;
  description?: string;
  fixedPrompt?: string;
  tags?: string[];
  incompatibleTags?: string[];
  requiredTags?: string[];
  weight?: number;
  nodes: AppNode[];
  edges: AppEdge[];
  costumes?: EventCostume[];
  folderId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Folder node structure for inheritance
export interface AppFolder {
  id: string;
  parentId?: string | null;
  name?: string;
  tags?: string[];
  incompatibleTags?: string[];
  requiredTags?: string[];
}

// Mood Configuration Tiers & Tags
export interface MoodTier {
  id: string;
  min: number;
  max: number;
  label: string;
}

export interface MoodTag {
  id: string;
  tag: string;
  weight?: number;
}

export interface MoodConfig {
  tiers: MoodTier[];
  tags: Record<string, MoodTag[]>;
  initialMoodRange?: { min: number; max: number }; // <-- Add this line!
}