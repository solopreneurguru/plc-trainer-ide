/**
 * Latch Instruction Tests
 *
 * Tests SR (Set-Reset) and RS (Reset-Set) bistable flip-flop behaviors.
 */

import { describe, it, expect } from 'vitest';
import { executeSR, executeRS } from '../instructions/latches';
import { LatchInstance } from '../../../core/ir/types';

describe('Latch Instructions', () => {
  describe('SR (Set-Reset) - Set has priority', () => {
    it('should set output Q to TRUE when S is TRUE', () => {
      const instance: LatchInstance = {
        type: 'SR',
        S: false,
        R: false,
        Q: false,
      };

      // S=1, R=0 → Q=1
      const result = executeSR(instance, true, false);
      expect(result.Q).toBe(true);
      expect(result.S).toBe(true);
      expect(result.R).toBe(false);
    });

    it('should reset output Q to FALSE when S is FALSE and R is TRUE', () => {
      const instance: LatchInstance = {
        type: 'SR',
        S: false,
        R: false,
        Q: true, // Currently set
      };

      // S=0, R=1 → Q=0
      const result = executeSR(instance, false, true);
      expect(result.Q).toBe(false);
      expect(result.S).toBe(false);
      expect(result.R).toBe(true);
    });

    it('should maintain previous state when both S and R are FALSE (bistable memory)', () => {
      // Test maintaining TRUE
      let instance: LatchInstance = {
        type: 'SR',
        S: false,
        R: false,
        Q: true,
      };

      // S=0, R=0 → Q=previous (TRUE)
      let result = executeSR(instance, false, false);
      expect(result.Q).toBe(true);

      // Test maintaining FALSE
      instance = {
        type: 'SR',
        S: false,
        R: false,
        Q: false,
      };

      // S=0, R=0 → Q=previous (FALSE)
      result = executeSR(instance, false, false);
      expect(result.Q).toBe(false);
    });

    it('should give priority to SET when both S and R are TRUE', () => {
      const instance: LatchInstance = {
        type: 'SR',
        S: false,
        R: false,
        Q: false,
      };

      // S=1, R=1 → Q=1 (Set has priority in SR)
      const result = executeSR(instance, true, true);
      expect(result.Q).toBe(true);
    });

    it('should demonstrate latch behavior in a sequence', () => {
      let instance: LatchInstance | undefined = undefined;

      // Initial state: S=0, R=0, Q=0 (auto-initialized)
      instance = executeSR(instance, false, false);
      expect(instance.Q).toBe(false);

      // Set the latch
      instance = executeSR(instance, true, false);
      expect(instance.Q).toBe(true);

      // Remove set signal - latch should remain TRUE
      instance = executeSR(instance, false, false);
      expect(instance.Q).toBe(true);

      // Reset the latch
      instance = executeSR(instance, false, true);
      expect(instance.Q).toBe(false);

      // Remove reset signal - latch should remain FALSE
      instance = executeSR(instance, false, false);
      expect(instance.Q).toBe(false);

      // Set again
      instance = executeSR(instance, true, false);
      expect(instance.Q).toBe(true);
    });

    it('should initialize with default values when instance is undefined', () => {
      const result = executeSR(undefined, false, false);
      expect(result.type).toBe('SR');
      expect(result.S).toBe(false);
      expect(result.R).toBe(false);
      expect(result.Q).toBe(false);
    });
  });

  describe('RS (Reset-Set) - Reset has priority', () => {
    it('should set output Q to TRUE when S is TRUE and R is FALSE', () => {
      const instance: LatchInstance = {
        type: 'RS',
        S: false,
        R: false,
        Q: false,
      };

      // S=1, R=0 → Q=1
      const result = executeRS(instance, true, false);
      expect(result.Q).toBe(true);
      expect(result.S).toBe(true);
      expect(result.R).toBe(false);
    });

    it('should reset output Q to FALSE when R is TRUE', () => {
      const instance: LatchInstance = {
        type: 'RS',
        S: false,
        R: false,
        Q: true, // Currently set
      };

      // S=0, R=1 → Q=0
      const result = executeRS(instance, false, true);
      expect(result.Q).toBe(false);
      expect(result.S).toBe(false);
      expect(result.R).toBe(true);
    });

    it('should maintain previous state when both S and R are FALSE (bistable memory)', () => {
      // Test maintaining TRUE
      let instance: LatchInstance = {
        type: 'RS',
        S: false,
        R: false,
        Q: true,
      };

      // S=0, R=0 → Q=previous (TRUE)
      let result = executeRS(instance, false, false);
      expect(result.Q).toBe(true);

      // Test maintaining FALSE
      instance = {
        type: 'RS',
        S: false,
        R: false,
        Q: false,
      };

      // S=0, R=0 → Q=previous (FALSE)
      result = executeRS(instance, false, false);
      expect(result.Q).toBe(false);
    });

    it('should give priority to RESET when both S and R are TRUE', () => {
      const instance: LatchInstance = {
        type: 'RS',
        S: false,
        R: false,
        Q: true, // Start with TRUE to see reset priority
      };

      // S=1, R=1 → Q=0 (Reset has priority in RS)
      const result = executeRS(instance, true, true);
      expect(result.Q).toBe(false);
    });

    it('should demonstrate latch behavior in a sequence', () => {
      let instance: LatchInstance | undefined = undefined;

      // Initial state: S=0, R=0, Q=0 (auto-initialized)
      instance = executeRS(instance, false, false);
      expect(instance.Q).toBe(false);

      // Set the latch
      instance = executeRS(instance, true, false);
      expect(instance.Q).toBe(true);

      // Remove set signal - latch should remain TRUE
      instance = executeRS(instance, false, false);
      expect(instance.Q).toBe(true);

      // Reset the latch
      instance = executeRS(instance, false, true);
      expect(instance.Q).toBe(false);

      // Remove reset signal - latch should remain FALSE
      instance = executeRS(instance, false, false);
      expect(instance.Q).toBe(false);

      // Set again
      instance = executeRS(instance, true, false);
      expect(instance.Q).toBe(true);
    });

    it('should initialize with default values when instance is undefined', () => {
      const result = executeRS(undefined, false, false);
      expect(result.type).toBe('RS');
      expect(result.S).toBe(false);
      expect(result.R).toBe(false);
      expect(result.Q).toBe(false);
    });
  });

  describe('SR vs RS comparison', () => {
    it('should demonstrate different priority behavior', () => {
      // SR: Set has priority
      const srInstance: LatchInstance = {
        type: 'SR',
        S: false,
        R: false,
        Q: false,
      };

      // RS: Reset has priority
      const rsInstance: LatchInstance = {
        type: 'RS',
        S: false,
        R: false,
        Q: true, // Start with TRUE to see the difference
      };

      // Both inputs TRUE
      const srResult = executeSR(srInstance, true, true);
      const rsResult = executeRS(rsInstance, true, true);

      // SR: Set has priority → Q=1
      expect(srResult.Q).toBe(true);

      // RS: Reset has priority → Q=0
      expect(rsResult.Q).toBe(false);
    });

    it('should behave identically when only one input is active', () => {
      // Set only
      const sr1 = executeSR(undefined, true, false);
      const rs1 = executeRS(undefined, true, false);
      expect(sr1.Q).toBe(true);
      expect(rs1.Q).toBe(true);

      // Reset only (starting from TRUE)
      const sr2 = executeSR({ type: 'SR', S: false, R: false, Q: true }, false, true);
      const rs2 = executeRS({ type: 'RS', S: false, R: false, Q: true }, false, true);
      expect(sr2.Q).toBe(false);
      expect(rs2.Q).toBe(false);

      // Neither (memory)
      const sr3 = executeSR({ type: 'SR', S: false, R: false, Q: true }, false, false);
      const rs3 = executeRS({ type: 'RS', S: false, R: false, Q: true }, false, false);
      expect(sr3.Q).toBe(true);
      expect(rs3.Q).toBe(true);
    });
  });
});
