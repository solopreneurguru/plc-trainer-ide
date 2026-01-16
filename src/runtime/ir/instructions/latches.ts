/**
 * Latch Instructions: SR, RS
 *
 * Implements IEC 61131-3 bistable latch behaviors:
 * - SR (Set-Reset): Set input has priority over Reset
 * - RS (Reset-Set): Reset input has priority over Set
 */

import { LatchInstance } from '../../../core/ir/types';

/**
 * Execute SR (Set-Reset Latch)
 *
 * Bistable flip-flop where Set has priority.
 * - S=TRUE: Q becomes TRUE (regardless of R)
 * - S=FALSE, R=TRUE: Q becomes FALSE
 * - S=FALSE, R=FALSE: Q maintains previous state
 *
 * Truth table:
 * S | R | Q
 * --|---|---
 * 0 | 0 | previous Q (memory)
 * 0 | 1 | 0 (reset)
 * 1 | 0 | 1 (set)
 * 1 | 1 | 1 (set has priority)
 *
 * @param instance - Latch instance (contains state)
 * @param S - Set input
 * @param R - Reset input
 * @returns Updated latch instance
 */
export function executeSR(
  instance: LatchInstance | undefined,
  S: boolean,
  R: boolean
): LatchInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'SR',
      S: false,
      R: false,
      Q: false,
    };
  }

  // Create a copy to avoid mutating the original
  const latch: LatchInstance = { ...instance };

  // Update inputs
  latch.S = S;
  latch.R = R;

  // SR logic: Set has priority
  if (S) {
    latch.Q = true; // Set takes priority
  } else if (R) {
    latch.Q = false; // Reset when S is false
  }
  // else: maintain previous state (bistable memory)

  return latch;
}

/**
 * Execute RS (Reset-Set Latch)
 *
 * Bistable flip-flop where Reset has priority.
 * - R=TRUE: Q becomes FALSE (regardless of S)
 * - R=FALSE, S=TRUE: Q becomes TRUE
 * - R=FALSE, S=FALSE: Q maintains previous state
 *
 * Truth table:
 * S | R | Q
 * --|---|---
 * 0 | 0 | previous Q (memory)
 * 0 | 1 | 0 (reset has priority)
 * 1 | 0 | 1 (set)
 * 1 | 1 | 0 (reset has priority)
 *
 * @param instance - Latch instance (contains state)
 * @param S - Set input
 * @param R - Reset input
 * @returns Updated latch instance
 */
export function executeRS(
  instance: LatchInstance | undefined,
  S: boolean,
  R: boolean
): LatchInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'RS',
      S: false,
      R: false,
      Q: false,
    };
  }

  // Create a copy to avoid mutating the original
  const latch: LatchInstance = { ...instance };

  // Update inputs
  latch.S = S;
  latch.R = R;

  // RS logic: Reset has priority
  if (R) {
    latch.Q = false; // Reset takes priority
  } else if (S) {
    latch.Q = true; // Set when R is false
  }
  // else: maintain previous state (bistable memory)

  return latch;
}

/**
 * Create a new latch instance
 */
export function createLatchInstance(type: 'SR' | 'RS'): LatchInstance {
  return {
    type,
    S: false,
    R: false,
    Q: false,
  };
}
