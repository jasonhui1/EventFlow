import { describe, it, expect, vi } from 'vitest';
import {
  simulateEvent,
  isNodeInFieldBounds,
  selectFieldChildNodes,
  calculateMoodChange,
  getMoodTagForValue,
  routeBranchNode,
  routeIfNode
} from '../simulationUtils';
import type { AppNode, AppEdge, FieldNode, IfNode } from '../../types/graph';
import type { MoodConfig, AppEvent } from '../../types/type';

describe('Simulation Utilities Integration Tests', () => {
  it('1. Cyclic Reference Node Loop: should terminate safely without infinite loops', () => {
    // Setup:
    // Main Event references Sub-Event A.
    // Sub-Event A references Sub-Event B.
    // Sub-Event B references Sub-Event A.

    const mainNodes: AppNode[] = [
      {
        id: 'main-start',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Main Start' }
      },
      {
        id: 'main-ref-A',
        type: 'referenceNode',
        position: { x: 100, y: 0 },
        data: {
          label: 'Ref A',
          referenceId: 'sub-event-A',
          referenceName: 'Sub-Event A'
        }
      },
      {
        id: 'main-event',
        type: 'eventNode',
        position: { x: 200, y: 0 },
        data: {
          label: 'Main Event',
          localPrompt: ['Main Prompt']
        }
      },
      {
        id: 'main-end',
        type: 'endNode',
        position: { x: 300, y: 0 },
        data: { label: 'Main End' }
      }
    ];

    const mainEdges: AppEdge[] = [
      { id: 'e1', source: 'main-start', target: 'main-ref-A' },
      { id: 'e2', source: 'main-ref-A', target: 'main-event' },
      { id: 'e3', source: 'main-event', target: 'main-end' }
    ];

    const subNodesA: AppNode[] = [
      {
        id: 'subA-start',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Sub A Start' }
      },
      {
        id: 'subA-ref-B',
        type: 'referenceNode',
        position: { x: 100, y: 0 },
        data: {
          label: 'Ref B',
          referenceId: 'sub-event-B',
          referenceName: 'Sub-Event B'
        }
      },
      {
        id: 'subA-event',
        type: 'eventNode',
        position: { x: 200, y: 0 },
        data: {
          label: 'Sub A Event',
          localPrompt: ['Sub A Prompt']
        }
      },
      {
        id: 'subA-end',
        type: 'endNode',
        position: { x: 300, y: 0 },
        data: { label: 'Sub A End' }
      }
    ];

    const subEdgesA: AppEdge[] = [
      { id: 'ea1', source: 'subA-start', target: 'subA-ref-B' },
      { id: 'ea2', source: 'subA-ref-B', target: 'subA-event' },
      { id: 'ea3', source: 'subA-event', target: 'subA-end' }
    ];

    const subNodesB: AppNode[] = [
      {
        id: 'subB-start',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Sub B Start' }
      },
      {
        id: 'subB-ref-A',
        type: 'referenceNode',
        position: { x: 100, y: 0 },
        data: {
          label: 'Ref A (Cyclic)',
          referenceId: 'sub-event-A',
          referenceName: 'Sub-Event A'
        }
      },
      {
        id: 'subB-event',
        type: 'eventNode',
        position: { x: 200, y: 0 },
        data: {
          label: 'Sub B Event',
          localPrompt: ['Sub B Prompt']
        }
      },
      {
        id: 'subB-end',
        type: 'endNode',
        position: { x: 300, y: 0 },
        data: { label: 'Sub B End' }
      }
    ];

    const subEdgesB: AppEdge[] = [
      { id: 'eb1', source: 'subB-start', target: 'subB-ref-A' },
      { id: 'eb2', source: 'subB-ref-A', target: 'subB-event' },
      { id: 'eb3', source: 'subB-event', target: 'subB-end' }
    ];

    const allEvents: AppEvent[] = [
      {
        id: 'main-event-id',
        name: 'Main Event',
        nodes: mainNodes,
        edges: mainEdges
      },
      {
        id: 'sub-event-A',
        name: 'Sub-Event A',
        nodes: subNodesA,
        edges: subEdgesA
      },
      {
        id: 'sub-event-B',
        name: 'Sub-Event B',
        nodes: subNodesB,
        edges: subEdgesB
      }
    ];

    const results = simulateEvent(
      allEvents,
      mainNodes,
      mainEdges
    );

    const labels = results.map(r => r.label);
    expect(labels).toContain('Sub B Event');
    expect(labels).toContain('Sub A Event');
    expect(labels).toContain('Main Event');
    
    expect(results.filter(r => r.type === 'eventNode').length).toBe(3);
  });

  it('2. Conditional If-Else Branching & Inputs: should route correctly for all input permutations', () => {
    const nodes: AppNode[] = [
      {
        id: 'start',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Start',
          inputs: [
            { id: 'in-1', label: 'Input 1', enabled: false },
            { id: 'in-2', label: 'Input 2', enabled: false }
          ]
        }
      },
      {
        id: 'if-1',
        type: 'ifNode',
        position: { x: 100, y: 0 },
        data: {
          label: 'If 1',
          conditionInputIds: ['in-1']
        }
      },
      {
        id: 'true-1',
        type: 'eventNode',
        position: { x: 200, y: -50 },
        data: {
          label: 'True 1',
          localPrompt: ['True 1 Prompt']
        }
      },
      {
        id: 'false-1',
        type: 'eventNode',
        position: { x: 200, y: 50 },
        data: {
          label: 'False 1',
          localPrompt: ['False 1 Prompt']
        }
      },
      {
        id: 'if-2',
        type: 'ifNode',
        position: { x: 300, y: 0 },
        data: {
          label: 'If 2',
          conditionInputIds: ['in-2']
        }
      },
      {
        id: 'true-2',
        type: 'eventNode',
        position: { x: 400, y: -50 },
        data: {
          label: 'True 2',
          localPrompt: ['True 2 Prompt']
        }
      },
      {
        id: 'false-2',
        type: 'eventNode',
        position: { x: 400, y: 50 },
        data: {
          label: 'False 2',
          localPrompt: ['False 2 Prompt']
        }
      },
      {
        id: 'end',
        type: 'endNode',
        position: { x: 500, y: 0 },
        data: { label: 'End' }
      }
    ];

    const edges: AppEdge[] = [
      { id: 'e-start-if1', source: 'start', target: 'if-1' },
      { id: 'e-if1-true1', source: 'if-1', target: 'true-1', sourceHandle: 'true_output' },
      { id: 'e-if1-false1', source: 'if-1', target: 'false-1', sourceHandle: 'false_output' },
      { id: 'e-true1-if2', source: 'true-1', target: 'if-2' },
      { id: 'e-false1-if2', source: 'false-1', target: 'if-2' },
      { id: 'e-if2-true2', source: 'if-2', target: 'true-2', sourceHandle: 'true_output' },
      { id: 'e-if2-false2', source: 'if-2', target: 'false-2', sourceHandle: 'false_output' },
      { id: 'e-true2-end', source: 'true-2', target: 'end' },
      { id: 'e-false2-end', source: 'false-2', target: 'end' }
    ];

    // Permutation 1: True-True
    const resTT = simulateEvent([], nodes, edges, '', [], new Set(), { 'in-1': true, 'in-2': true });
    const labelsTT = resTT.map(r => r.label);
    expect(labelsTT).toEqual(['True 1', 'True 2']);

    // Permutation 2: True-False
    const resTF = simulateEvent([], nodes, edges, '', [], new Set(), { 'in-1': true, 'in-2': false });
    const labelsTF = resTF.map(r => r.label);
    expect(labelsTF).toEqual(['True 1', 'False 2']);

    // Permutation 3: False-True
    const resFT = simulateEvent([], nodes, edges, '', [], new Set(), { 'in-1': false, 'in-2': true });
    const labelsFT = resFT.map(r => r.label);
    expect(labelsFT).toEqual(['False 1', 'True 2']);

    // Permutation 4: False-False
    const resFF = simulateEvent([], nodes, edges, '', [], new Set(), { 'in-1': false, 'in-2': false });
    const labelsFF = resFF.map(r => r.label);
    expect(labelsFF).toEqual(['False 1', 'False 2']);
  });

  it('3. Spatial Containment & Weighted Random Selection: should filter by field boundaries, weights, and shuffle if enabled', () => {
    const nodes: AppNode[] = [
      {
        id: 'start',
        type: 'startNode',
        position: { x: 0, y: -50 },
        data: { label: 'Start' }
      },
      {
        id: 'field-1',
        type: 'fieldNode',
        position: { x: 0, y: 0 },
        width: 200,
        height: 200,
        data: {
          label: 'Field 1',
          selectCount: 2,
          randomizeOrder: false,
          childWeights: {
            'node-A': 100,
            'node-B': 100,
            'node-C': 0
          }
        }
      },
      {
        id: 'field-2',
        type: 'fieldNode',
        position: { x: 250, y: 250 },
        width: 100,
        height: 100,
        data: {
          label: 'Field 2',
          selectCount: 0,
          randomizeOrder: false,
          childWeights: {
            'node-D': 100
          }
        }
      },
      {
        id: 'node-A',
        type: 'eventNode',
        position: { x: 50, y: 50 },
        data: { label: 'Node A', localPrompt: ['Prompt A'] }
      },
      {
        id: 'node-B',
        type: 'eventNode',
        position: { x: 150, y: 150 },
        data: { label: 'Node B', localPrompt: ['Prompt B'] }
      },
      {
        id: 'node-C',
        type: 'eventNode',
        position: { x: 160, y: 160 },
        data: { label: 'Node C', localPrompt: ['Prompt C'] }
      },
      {
        id: 'node-D',
        type: 'eventNode',
        position: { x: 300, y: 300 },
        data: { label: 'Node D', localPrompt: ['Prompt D'] }
      },
      {
        id: 'end',
        type: 'endNode',
        position: { x: 400, y: 400 },
        data: { label: 'End' }
      }
    ];

    const edges: AppEdge[] = [
      { id: 'e-s-a', source: 'start', target: 'node-A' },
      { id: 'e-a-b', source: 'node-A', target: 'node-B' },
      { id: 'e-b-c', source: 'node-B', target: 'node-C' },
      { id: 'e-c-d', source: 'node-C', target: 'node-D' },
      { id: 'e-d-e', source: 'node-D', target: 'end' }
    ];

    const results = simulateEvent([], nodes, edges);
    const labels = results.map(r => r.label);

    expect(labels).toContain('Node A');
    expect(labels).toContain('Node B');
    expect(labels).not.toContain('Node D');
    expect(labels).not.toContain('Node C');

    // Test Shuffling
    const shuffleNodes: AppNode[] = [
      {
        id: 'start-shuffle',
        type: 'startNode',
        position: { x: 0, y: -50 },
        data: { label: 'Start' }
      },
      {
        id: 'field-3',
        type: 'fieldNode',
        position: { x: 400, y: 400 },
        width: 200,
        height: 200,
        data: {
          label: 'Field 3',
          selectCount: 3,
          randomizeOrder: true,
          childWeights: {
            'node-X': 100,
            'node-Y': 100,
            'node-Z': 100
          }
        }
      },
      {
        id: 'node-X',
        type: 'eventNode',
        position: { x: 450, y: 450 },
        data: { label: 'Node X', localPrompt: ['Prompt X'] }
      },
      {
        id: 'node-Y',
        type: 'eventNode',
        position: { x: 460, y: 460 },
        data: { label: 'Node Y', localPrompt: ['Prompt Y'] }
      },
      {
        id: 'node-Z',
        type: 'eventNode',
        position: { x: 470, y: 470 },
        data: { label: 'Node Z', localPrompt: ['Prompt Z'] }
      },
      {
        id: 'end-shuffle',
        type: 'endNode',
        position: { x: 700, y: 700 },
        data: { label: 'End' }
      }
    ];

    const shuffleEdges: AppEdge[] = [
      { id: 'es-x', source: 'start-shuffle', target: 'node-X' },
      { id: 'ex-y', source: 'node-X', target: 'node-Y' },
      { id: 'ey-z', source: 'node-Y', target: 'node-Z' },
      { id: 'ez-e', source: 'node-Z', target: 'end-shuffle' }
    ];

    // No shuffle run
    const noShuffleNodes: AppNode[] = shuffleNodes.map(n => 
      n.id === 'field-3' ? { ...n, data: { ...n.data, randomizeOrder: false } } as AppNode : n
    );
    const resNoShuffle = simulateEvent([], noShuffleNodes, shuffleEdges);
    const labelsNoShuffle = resNoShuffle.map(r => r.label);
    expect(labelsNoShuffle).toEqual(['Node X', 'Node Y', 'Node Z']);

    const resShuffle = simulateEvent([], shuffleNodes, shuffleEdges);
    const labelsShuffle = resShuffle.map(r => r.label);
    
    expect(labelsShuffle).toHaveLength(3);
    expect(labelsShuffle).toContain('Node X');
    expect(labelsShuffle).toContain('Node Y');
    expect(labelsShuffle).toContain('Node Z');
    expect(labelsShuffle).not.toEqual(['Node X', 'Node Y', 'Node Z']);
  });

  it('4. Deep Mood Tier Trait Clamping & Tags: should clamp and transition tiers correctly', () => {
    const moodConfig: MoodConfig = {
      tiers: [
        { id: 'very_negative', min: -100, max: -50, label: 'Very Negative' },
        { id: 'negative', min: -50, max: -20, label: 'Negative' },
        { id: 'neutral', min: -20, max: 20, label: 'Neutral' },
        { id: 'positive', min: 20, max: 50, label: 'Positive' },
        { id: 'very_positive', min: 50, max: 100, label: 'Very Positive' }
      ],
      tags: {
        very_negative: [{ id: 't-vn', tag: 'despair', weight: 100 }],
        negative: [{ id: 't-n', tag: 'sad', weight: 100 }],
        neutral: [{ id: 't-ne', tag: 'calm', weight: 100 }],
        positive: [{ id: 't-p', tag: 'happy', weight: 100 }],
        very_positive: [{ id: 't-vp', tag: 'ecstatic', weight: 100 }]
      },
      initialMoodRange: { min: 0, max: 0 }
    };

    const nodes: AppNode[] = [
      {
        id: 'start',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      },
      {
        id: 'node-1',
        type: 'eventNode',
        position: { x: 100, y: 0 },
        data: {
          label: 'Mood Positive',
          moodChangeMin: 35,
          moodChangeMax: 35
        }
      },
      {
        id: 'node-2',
        type: 'eventNode',
        position: { x: 200, y: 0 },
        data: {
          label: 'Mood Very Positive Clamped',
          moodChangeMin: 80,
          moodChangeMax: 80
        }
      },
      {
        id: 'node-3',
        type: 'eventNode',
        position: { x: 300, y: 0 },
        data: {
          label: 'Mood Negative',
          moodChangeMin: -140,
          moodChangeMax: -140
        }
      },
      {
        id: 'node-4',
        type: 'eventNode',
        position: { x: 400, y: 0 },
        data: {
          label: 'Mood Very Negative Clamped',
          moodChangeMin: -80,
          moodChangeMax: -80
        }
      },
      {
        id: 'end',
        type: 'endNode',
        position: { x: 500, y: 0 },
        data: { label: 'End' }
      }
    ];

    const edges: AppEdge[] = [
      { id: 'e-s-1', source: 'start', target: 'node-1' },
      { id: 'e-1-2', source: 'node-1', target: 'node-2' },
      { id: 'e-2-3', source: 'node-2', target: 'node-3' },
      { id: 'e-3-4', source: 'node-3', target: 'node-4' },
      { id: 'e-4-e', source: 'node-4', target: 'end' }
    ];

    const results = simulateEvent([], nodes, edges, '', [], new Set(), {}, moodConfig, 0);

    expect(results).toHaveLength(4);

    expect(results[0].mood).toBe(35);
    expect(results[0].moodTag).toBe('happy');

    expect(results[1].mood).toBe(100);
    expect(results[1].moodTag).toBe('ecstatic');

    expect(results[2].mood).toBe(-40);
    expect(results[2].moodTag).toBe('sad');

    expect(results[3].mood).toBe(-100);
    expect(results[3].moodTag).toBe('despair');
  });

  it('5. Multi-path Inheritance & Disabled Source Pruning: should prune disabled source prompts and merge others', () => {
    const nodes: AppNode[] = [
      {
        id: 'start',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      },
      {
        id: 'node-A',
        type: 'eventNode',
        position: { x: 100, y: -50 },
        data: {
          label: 'Node A',
          inheritedPrompt: ['Prompt A']
        }
      },
      {
        id: 'node-B',
        type: 'eventNode',
        position: { x: 100, y: 50 },
        data: {
          label: 'Node B',
          inheritedPrompt: ['Prompt B']
        }
      },
      {
        id: 'node-D',
        type: 'eventNode',
        position: { x: 100, y: 150 },
        data: {
          label: 'Node D',
          inheritedPrompt: ['Prompt D']
        }
      },
      {
        id: 'node-C',
        type: 'eventNode',
        position: { x: 200, y: 0 },
        data: {
          label: 'Node C',
          localPrompt: ['Prompt C'],
          disabledInheritedSources: ['node-B']
        }
      },
      {
        id: 'end',
        type: 'endNode',
        position: { x: 300, y: 0 },
        data: { label: 'End' }
      }
    ];

    const edges: AppEdge[] = [
      { id: 'e-s-a', source: 'start', target: 'node-A' },
      { id: 'e-s-b', source: 'start', target: 'node-B' },
      { id: 'e-s-d', source: 'start', target: 'node-D' },
      { id: 'e-a-c', source: 'node-A', target: 'node-C' },
      { id: 'e-b-c', source: 'node-B', target: 'node-C' },
      { id: 'e-d-c', source: 'node-D', target: 'node-C' },
      { id: 'e-c-e', source: 'node-C', target: 'end' }
    ];

    const results = simulateEvent([], nodes, edges);
    
    const resultC = results.find(r => r.originalId === 'node-C');
    expect(resultC).toBeDefined();

    const prompts = resultC!.parts.map(p => p.prompt);
    
    expect(prompts).toContain('Prompt A');
    expect(prompts).toContain('Prompt D');
    expect(prompts).toContain('Prompt C');
    expect(prompts).not.toContain('Prompt B');

    expect(resultC!.prompt).toContain('Prompt A');
    expect(resultC!.prompt).toContain('Prompt D');
    expect(resultC!.prompt).toContain('Prompt C');
    expect(resultC!.prompt).not.toContain('Prompt B');
  });
});

describe('Extracted Helper Functions Unit Tests', () => {
  describe('isNodeInFieldBounds', () => {
    it('should return false if the node is the field node itself or is a fieldNode type', () => {
      const field: FieldNode = {
        id: 'field-1',
        type: 'fieldNode',
        position: { x: 10, y: 10 },
        width: 100,
        height: 100,
        data: { label: 'Field 1' }
      };
      
      const nodeSameId: AppNode = {
        id: 'field-1',
        type: 'eventNode',
        position: { x: 50, y: 50 },
        data: { label: 'Event' }
      };

      const anotherField: AppNode = {
        id: 'field-2',
        type: 'fieldNode',
        position: { x: 50, y: 50 },
        data: { label: 'Field 2' }
      };

      expect(isNodeInFieldBounds(nodeSameId, field)).toBe(false);
      expect(isNodeInFieldBounds(anotherField, field)).toBe(false);
    });

    it('should return true if node is within field bounds', () => {
      const field: FieldNode = {
        id: 'field-1',
        type: 'fieldNode',
        position: { x: 10, y: 10 },
        width: 100,
        height: 100,
        data: { label: 'Field 1' }
      };

      const nodeIn: AppNode = {
        id: 'node-1',
        type: 'eventNode',
        position: { x: 50, y: 50 },
        data: { label: 'Event' }
      };

      expect(isNodeInFieldBounds(nodeIn, field)).toBe(true);
    });

    it('should return false if node is outside field bounds', () => {
      const field: FieldNode = {
        id: 'field-1',
        type: 'fieldNode',
        position: { x: 10, y: 10 },
        width: 100,
        height: 100,
        data: { label: 'Field 1' }
      };

      const nodeOut: AppNode = {
        id: 'node-2',
        type: 'eventNode',
        position: { x: 200, y: 50 },
        data: { label: 'Event' }
      };

      expect(isNodeInFieldBounds(nodeOut, field)).toBe(false);
    });
  });

  describe('selectFieldChildNodes', () => {
    it('should select child nodes up to selectCount and populate unlockedByField', () => {
      const childNodes: AppNode[] = [
        { id: 'node-A', type: 'eventNode', position: { x: 0, y: 0 }, data: { label: 'A' } },
        { id: 'node-B', type: 'eventNode', position: { x: 0, y: 0 }, data: { label: 'B' } },
        { id: 'node-C', type: 'eventNode', position: { x: 0, y: 0 }, data: { label: 'C' } }
      ];
      
      const unlocked = new Set<string>();
      selectFieldChildNodes(childNodes, 2, { 'node-A': 100, 'node-B': 100, 'node-C': 0 }, unlocked);
      
      expect(unlocked.size).toBe(2);
      expect(unlocked.has('node-C')).toBe(false);
    });
  });

  describe('calculateMoodChange', () => {
    it('should return current mood if node is not an eventNode', () => {
      const node: AppNode = {
        id: 'start-node',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      };

      expect(calculateMoodChange(node, 10)).toBe(10);
    });

    it('should calculate changed mood and clamp it', () => {
      const node: AppNode = {
        id: 'event-node',
        type: 'eventNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Event',
          moodChangeMin: 50,
          moodChangeMax: 50
        }
      };

      expect(calculateMoodChange(node, 80)).toBe(100);
      expect(calculateMoodChange(node, -20)).toBe(30);
    });
  });

  describe('getMoodTagForValue', () => {
    it('should select tag based on tiers and weights', () => {
      const moodConfig: MoodConfig = {
        tiers: [
          { id: 'negative', min: -100, max: 0, label: 'Negative' },
          { id: 'positive', min: 0, max: 100, label: 'Positive' }
        ],
        tags: {
          negative: [{ id: 't-neg', tag: 'sad', weight: 100 }],
          positive: [{ id: 't-pos', tag: 'happy', weight: 100 }]
        },
        initialMoodRange: { min: 0, max: 0 }
      };

      expect(getMoodTagForValue(50, moodConfig)).toBe('happy');
      expect(getMoodTagForValue(-50, moodConfig)).toBe('sad');
    });

    it('should correctly evaluate boundaries using the min <= value < max rule (with inclusive upper limit for the last tier)', () => {
      const moodConfig: MoodConfig = {
        tiers: [
          { id: 'very_negative', min: -100, max: -50, label: 'Very Negative' },
          { id: 'negative', min: -50, max: -20, label: 'Negative' },
          { id: 'neutral', min: -20, max: 20, label: 'Neutral' },
          { id: 'positive', min: 20, max: 50, label: 'Positive' },
          { id: 'very_positive', min: 50, max: 100, label: 'Very Positive' }
        ],
        tags: {
          very_negative: [{ id: 't-vn', tag: 'despair', weight: 100 }],
          negative: [{ id: 't-n', tag: 'sad', weight: 100 }],
          neutral: [{ id: 't-ne', tag: 'calm', weight: 100 }],
          positive: [{ id: 't-p', tag: 'happy', weight: 100 }],
          very_positive: [{ id: 't-vp', tag: 'ecstatic', weight: 100 }]
        },
        initialMoodRange: { min: 0, max: 0 }
      };

      // Boundary: -50 falls into negative (min -50 <= -50 < -20)
      expect(getMoodTagForValue(-50, moodConfig)).toBe('sad');

      // Boundary: -20 falls into neutral (min -20 <= -20 < 20)
      expect(getMoodTagForValue(-20, moodConfig)).toBe('calm');

      // Boundary: 20 falls into positive (min 20 <= 20 < 50)
      expect(getMoodTagForValue(20, moodConfig)).toBe('happy');

      // Boundary: 50 falls into very_positive (min 50 <= 50 < 100)
      expect(getMoodTagForValue(50, moodConfig)).toBe('ecstatic');

      // Boundary: 100 (upper bound of last tier) falls into very_positive (inclusive limit)
      expect(getMoodTagForValue(100, moodConfig)).toBe('ecstatic');
    });
  });

  describe('routeBranchNode', () => {
    it('should return outgoing edges filtered by selected handle', () => {
      const edges: AppEdge[] = [
        { id: 'e1', source: 'branch', target: 'a', sourceHandle: 'handle-1' },
        { id: 'e2', source: 'branch', target: 'b', sourceHandle: 'handle-1' },
        { id: 'e3', source: 'branch', target: 'c', sourceHandle: 'handle-2' }
      ];

      const selected = routeBranchNode(edges);
      expect(selected.length).toBeGreaterThan(0);
      const chosenHandle = selected[0].sourceHandle;
      expect(selected.every(e => e.sourceHandle === chosenHandle)).toBe(true);
    });
  });

  describe('routeIfNode', () => {
    it('should route to true_output handle if condition input is met', () => {
      const node: IfNode = {
        id: 'if-1',
        type: 'ifNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'If Node',
          conditionInputIds: ['in-1']
        }
      };

      const edges: AppEdge[] = [
        { id: 'e-true', source: 'if-1', target: 'a', sourceHandle: 'true_output' },
        { id: 'e-false', source: 'if-1', target: 'b', sourceHandle: 'false_output' }
      ];

      const processedNodes: AppNode[] = [
        {
          id: 'start',
          type: 'startNode',
          position: { x: 0, y: 0 },
          data: {
            label: 'Start Node',
            inputs: [
              { id: 'in-1', label: 'Input 1', enabled: true }
            ]
          }
        }
      ];

      const selected = routeIfNode(node, edges, processedNodes);
      expect(selected).toEqual([edges[0]]);
    });

    it('should route to false_output handle if condition input is not met', () => {
      const node: IfNode = {
        id: 'if-1',
        type: 'ifNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'If Node',
          conditionInputIds: ['in-1']
        }
      };

      const edges: AppEdge[] = [
        { id: 'e-true', source: 'if-1', target: 'a', sourceHandle: 'true_output' },
        { id: 'e-false', source: 'if-1', target: 'b', sourceHandle: 'false_output' }
      ];

      const processedNodes: AppNode[] = [
        {
          id: 'start',
          type: 'startNode',
          position: { x: 0, y: 0 },
          data: {
            label: 'Start Node',
            inputs: [
              { id: 'in-1', label: 'Input 1', enabled: false }
            ]
          }
        }
      ];

      const selected = routeIfNode(node, edges, processedNodes);
      expect(selected).toEqual([edges[1]]);
    });
  });
});


