import { describe, it, expect } from 'vitest';
import { clamp, isEventNode } from '../simulationUtils';
import type { AppNode } from '../../types/graph';

describe('Sanity Check Utility Tests', () => {
  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('isEventNode', () => {
    it('should correctly identify event nodes', () => {
      const eventNode: AppNode = {
        id: 'node-1',
        type: 'eventNode',
        position: { x: 0, y: 0 },
        data: { label: 'Test Event' }
      } as any;

      const otherNode: AppNode = {
        id: 'node-2',
        type: 'startNode',
        position: { x: 0, y: 0 },
        data: { label: 'Start' }
      } as any;

      expect(isEventNode(eventNode)).toBe(true);
      expect(isEventNode(otherNode)).toBe(false);
    });
  });
});
