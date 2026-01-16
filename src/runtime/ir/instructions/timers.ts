/**
 * Timer Instructions: TON, TOF, TP
 *
 * Implements IEC 61131-3 timer behaviors:
 * - TON (On-Delay Timer): Delays setting output TRUE
 * - TOF (Off-Delay Timer): Delays setting output FALSE
 * - TP (Pulse Timer): Generates fixed-duration pulse
 */

import { TimerInstance } from '../../../core/ir/types';

/**
 * Execute TON (On-Delay Timer)
 *
 * When IN goes TRUE, starts counting up to PT.
 * Q becomes TRUE when ET >= PT.
 * When IN goes FALSE, resets ET to 0 and Q to FALSE.
 *
 * @param instance - Timer instance (contains state)
 * @param IN - Input signal
 * @param PT - Preset time in milliseconds
 * @param currentTime - Current timestamp in milliseconds
 * @returns Updated timer instance
 */
export function executeTON(
  instance: TimerInstance | undefined,
  IN: boolean,
  PT: number,
  currentTime: number
): TimerInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'TON',
      IN: false,
      PT: 0,
      Q: false,
      ET: 0,
      _start_time: undefined,
      _triggered: false,
    };
  }

  // Create a copy to avoid mutating the original
  const timer: TimerInstance = { ...instance };

  // Update input
  const prevIN = timer.IN;
  timer.IN = IN;
  timer.PT = PT;

  if (IN) {
    // Input is TRUE - timer is running or should start
    if (!prevIN) {
      // Rising edge of IN - start timer
      timer._start_time = currentTime;
      timer.ET = 0;
      timer.Q = false;
    } else {
      // IN was already TRUE - continue timing
      if (timer._start_time !== undefined) {
        timer.ET = currentTime - timer._start_time;

        // Limit ET to PT (don't count beyond preset)
        if (timer.ET >= PT) {
          timer.ET = PT;
          timer.Q = true;
        }
      }
    }
  } else {
    // Input is FALSE - reset timer
    timer.ET = 0;
    timer.Q = false;
    timer._start_time = undefined;
  }

  return timer;
}

/**
 * Execute TOF (Off-Delay Timer)
 *
 * When IN goes FALSE, starts counting up to PT.
 * Q becomes FALSE when ET >= PT.
 * When IN goes TRUE, resets ET to 0 and Q to TRUE immediately.
 *
 * @param instance - Timer instance (contains state)
 * @param IN - Input signal
 * @param PT - Preset time in milliseconds
 * @param currentTime - Current timestamp in milliseconds
 * @returns Updated timer instance
 */
export function executeTOF(
  instance: TimerInstance | undefined,
  IN: boolean,
  PT: number,
  currentTime: number
): TimerInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'TOF',
      IN: IN, // Use current IN value
      PT: PT,
      Q: true, // For TOF, Q starts TRUE
      ET: 0,
      _start_time: !IN ? currentTime : undefined, // Start timing if IN is FALSE
      _triggered: false,
    };
  }

  // Create a copy to avoid mutating the original
  const timer: TimerInstance = { ...instance };

  // Update input
  const prevIN = timer.IN;
  timer.IN = IN;
  timer.PT = PT;

  if (!IN) {
    // Input is FALSE - timer is running or should start
    if (prevIN) {
      // Falling edge of IN - start timer
      timer._start_time = currentTime;
      timer.ET = 0;
      timer.Q = true; // Output stays TRUE during timing
    } else {
      // IN was already FALSE - continue timing
      if (timer._start_time !== undefined) {
        timer.ET = currentTime - timer._start_time;

        // Limit ET to PT
        if (timer.ET >= PT) {
          timer.ET = PT;
          timer.Q = false; // Turn off after delay
        }
      }
    }
  } else {
    // Input is TRUE - output is TRUE, no timing
    timer.ET = 0;
    timer.Q = true;
    timer._start_time = undefined;
  }

  return timer;
}

/**
 * Execute TP (Pulse Timer)
 *
 * On rising edge of IN, Q goes TRUE for PT duration, then goes FALSE.
 * One-shot pulse - retriggering during pulse has no effect.
 *
 * @param instance - Timer instance (contains state)
 * @param IN - Input signal
 * @param PT - Preset time in milliseconds
 * @param currentTime - Current timestamp in milliseconds
 * @returns Updated timer instance
 */
export function executeTP(
  instance: TimerInstance | undefined,
  IN: boolean,
  PT: number,
  currentTime: number
): TimerInstance {
  // Initialize instance if it doesn't exist
  if (!instance) {
    instance = {
      type: 'TP',
      IN: false,
      PT: 0,
      Q: false,
      ET: 0,
      _start_time: undefined,
      _triggered: false,
    };
  }

  // Create a copy to avoid mutating the original
  const timer: TimerInstance = { ...instance };

  // Update input
  const prevIN = timer.IN;
  timer.IN = IN;
  timer.PT = PT;

  // Detect rising edge of IN
  const risingEdge = IN && !prevIN;

  if (risingEdge && !timer._triggered) {
    // Rising edge detected and not already triggered - start pulse
    timer._start_time = currentTime;
    timer.ET = 0;
    timer.Q = true;
    timer._triggered = true;
  }

  // If pulse is active, update elapsed time
  if (timer._triggered && timer._start_time !== undefined) {
    timer.ET = currentTime - timer._start_time;

    if (timer.ET >= PT) {
      // Pulse duration complete
      timer.ET = PT;
      timer.Q = false;
      timer._triggered = false; // Ready for next trigger
    }
  }

  // Reset triggered flag when IN goes low
  if (!IN) {
    timer._triggered = false;
  }

  return timer;
}

/**
 * Create a new timer instance
 */
export function createTimerInstance(type: 'TON' | 'TOF' | 'TP'): TimerInstance {
  return {
    type,
    IN: false,
    PT: 0,
    Q: false,
    ET: 0,
    _start_time: undefined,
    _triggered: false,
  };
}
