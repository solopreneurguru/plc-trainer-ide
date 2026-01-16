/**
 * Counter Instructions: CTU, CTD, CTUD
 *
 * Implements IEC 61131-3 counter behaviors:
 * - CTU (Count Up): Increments on rising edge
 * - CTD (Count Down): Decrements on rising edge
 * - CTUD (Count Up/Down): Combined up/down counter
 */

import { CounterInstance } from '../../../core/ir/types';

/**
 * Execute CTU (Count Up Counter)
 *
 * Increments CV on rising edge of CU.
 * Q becomes TRUE when CV >= PV.
 * R (Reset) sets CV to 0.
 *
 * @param instance - Counter instance (contains state)
 * @param CU - Count up input (rising edge triggers count)
 * @param R - Reset input
 * @param PV - Preset value (limit)
 * @returns Updated counter instance
 */
export function executeCTU(
  instance: CounterInstance | undefined,
  CU: boolean,
  R: boolean,
  PV: number
): CounterInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'CTU',
      CU: false,
      R: false,
      PV: 0,
      Q: false,
      CV: 0,
      _prev_CU: false,
    };
  }

  // Create a copy to avoid mutating the original
  const counter: CounterInstance = { ...instance };

  // Store previous CU state for edge detection
  const prevCU = counter._prev_CU || false;

  // Update inputs
  counter.CU = CU;
  counter.R = R;
  counter.PV = PV;
  counter._prev_CU = CU;

  // Reset has priority
  if (R) {
    counter.CV = 0;
    counter.Q = false;
  } else {
    // Detect rising edge on CU
    const risingEdge = CU && !prevCU;

    if (risingEdge) {
      // Increment counter (don't overflow beyond max int)
      if (counter.CV < 32767) {
        counter.CV++;
      }
    }

    // Update output based on CV >= PV
    counter.Q = counter.CV >= PV;
  }

  return counter;
}

/**
 * Execute CTD (Count Down Counter)
 *
 * Decrements CV on rising edge of CD.
 * Q becomes TRUE when CV <= 0.
 * LD (Load) sets CV to PV.
 *
 * @param instance - Counter instance (contains state)
 * @param CD - Count down input (rising edge triggers count)
 * @param LD - Load input (sets CV = PV)
 * @param PV - Preset value
 * @returns Updated counter instance
 */
export function executeCTD(
  instance: CounterInstance | undefined,
  CD: boolean,
  LD: boolean,
  PV: number
): CounterInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'CTD',
      CD: false,
      LD: false,
      PV: 0,
      Q: false,
      CV: 0,
      _prev_CD: false,
    };
  }

  // Create a copy to avoid mutating the original
  const counter: CounterInstance = { ...instance };

  // Store previous CD state for edge detection
  const prevCD = counter._prev_CD || false;

  // Update inputs
  counter.CD = CD;
  counter.LD = LD;
  counter.PV = PV;
  counter._prev_CD = CD;

  // Load has priority
  if (LD) {
    counter.CV = PV;
    counter.Q = counter.CV <= 0;
  } else {
    // Detect rising edge on CD
    const risingEdge = CD && !prevCD;

    if (risingEdge) {
      // Decrement counter (don't underflow below min int)
      if (counter.CV > -32768) {
        counter.CV--;
      }
    }

    // Update output based on CV <= 0
    counter.Q = counter.CV <= 0;
  }

  return counter;
}

/**
 * Execute CTUD (Count Up/Down Counter)
 *
 * Combined counter that can count both up and down.
 * QU becomes TRUE when CV >= PV (count up limit).
 * QD becomes TRUE when CV <= 0 (count down limit).
 *
 * @param instance - Counter instance (contains state)
 * @param CU - Count up input (rising edge triggers increment)
 * @param CD - Count down input (rising edge triggers decrement)
 * @param R - Reset input (sets CV to 0)
 * @param LD - Load input (sets CV to PV)
 * @param PV - Preset value
 * @returns Updated counter instance
 */
export function executeCTUD(
  instance: CounterInstance | undefined,
  CU: boolean,
  CD: boolean,
  R: boolean,
  LD: boolean,
  PV: number
): CounterInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'CTUD',
      CU: false,
      CD: false,
      R: false,
      LD: false,
      PV: 0,
      QU: false,
      QD: false,
      CV: 0,
      _prev_CU: false,
      _prev_CD: false,
    };
  }

  // Create a copy to avoid mutating the original
  const counter: CounterInstance = { ...instance };

  // Store previous states for edge detection
  const prevCU = counter._prev_CU || false;
  const prevCD = counter._prev_CD || false;

  // Update inputs
  counter.CU = CU;
  counter.CD = CD;
  counter.R = R;
  counter.LD = LD;
  counter.PV = PV;
  counter._prev_CU = CU;
  counter._prev_CD = CD;

  // Reset has highest priority
  if (R) {
    counter.CV = 0;
  }
  // Load has second priority
  else if (LD) {
    counter.CV = PV;
  }
  // Count operations
  else {
    // Detect rising edges
    const risingEdgeCU = CU && !prevCU;
    const risingEdgeCD = CD && !prevCD;

    // If both edges occur simultaneously, they cancel out
    if (risingEdgeCU && risingEdgeCD) {
      // No change to CV
    } else if (risingEdgeCU) {
      // Count up (prevent overflow)
      if (counter.CV < 32767) {
        counter.CV++;
      }
    } else if (risingEdgeCD) {
      // Count down (prevent underflow)
      if (counter.CV > -32768) {
        counter.CV--;
      }
    }
  }

  // Update outputs
  counter.QU = counter.CV >= PV; // Count up limit reached
  counter.QD = counter.CV <= 0; // Count down limit reached

  return counter;
}

/**
 * Create a new counter instance
 */
export function createCounterInstance(type: 'CTU' | 'CTD' | 'CTUD'): CounterInstance {
  const base = {
    PV: 0,
    CV: 0,
  };

  switch (type) {
    case 'CTU':
      return {
        type: 'CTU',
        CU: false,
        R: false,
        PV: 0,
        Q: false,
        CV: 0,
        _prev_CU: false,
      };

    case 'CTD':
      return {
        type: 'CTD',
        CD: false,
        LD: false,
        PV: 0,
        Q: false,
        CV: 0,
        _prev_CD: false,
      };

    case 'CTUD':
      return {
        type: 'CTUD',
        CU: false,
        CD: false,
        R: false,
        LD: false,
        PV: 0,
        QU: false,
        QD: false,
        CV: 0,
        _prev_CU: false,
        _prev_CD: false,
      };
  }
}
