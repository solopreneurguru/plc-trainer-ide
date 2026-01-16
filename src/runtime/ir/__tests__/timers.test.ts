/**
 * Timer Instructions Tests
 *
 * Tests for TON, TOF, and TP timer behaviors
 */

import { describe, it, expect } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { Program, TimerInstance } from '../../../core/ir/types';
import { createEmptyProgram, createOperandExpression, createNumberLiteral } from '../../../core/ir/types';

describe('Timer Instructions', () => {
  describe('TON (On-Delay Timer)', () => {
    it('should start timing when IN goes TRUE', () => {
      const runtime = new IRRuntime();

      // Create program with TON timer
      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TON Timer Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TON',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000), // 1000ms = 1 second
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('timer_output', false);
      runtime.setTagValue('elapsed_time', 0);

      // Initial scan - IN is FALSE
      let result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(false);
      expect(result.tagValues['elapsed_time']).toBe(0);

      // Set IN to TRUE
      runtime.setTagValue('start_button', true);

      // Scan 1 - Timer starts (ET should be 0 immediately after rising edge)
      result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(false);
      expect(result.tagValues['elapsed_time']).toBe(0);

      // Wait 500ms and scan again
      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Simulate 500ms passing
      result = runtime.executeScan(startTime + 500);
      expect(result.tagValues['timer_output']).toBe(false);
      expect(result.tagValues['elapsed_time']).toBeGreaterThanOrEqual(490); // Allow small tolerance
      expect(result.tagValues['elapsed_time']).toBeLessThanOrEqual(510);

      // Simulate 1000ms passing (PT reached)
      result = runtime.executeScan(startTime + 1000);
      expect(result.tagValues['timer_output']).toBe(true); // Q should be TRUE
      expect(result.tagValues['elapsed_time']).toBe(1000); // ET should equal PT
    });

    it('should reset when IN goes FALSE', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TON Reset Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TON',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', true);

      // Start timer
      let result = runtime.executeScan();
      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Run for 500ms
      result = runtime.executeScan(startTime + 500);
      expect(result.tagValues['elapsed_time']).toBeGreaterThan(0);

      // Set IN to FALSE - should reset
      runtime.setTagValue('start_button', false);
      result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(false);
      expect(result.tagValues['elapsed_time']).toBe(0);
    });

    it('should not count beyond PT', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TON PT Limit Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TON',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', true);

      let result = runtime.executeScan();
      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Simulate 2000ms passing (double the PT)
      result = runtime.executeScan(startTime + 2000);

      // ET should be clamped to PT
      expect(result.tagValues['elapsed_time']).toBe(1000);
      expect(result.tagValues['timer_output']).toBe(true);
    });
  });

  describe('TOF (Off-Delay Timer)', () => {
    it('should start timing when IN goes FALSE', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TOF Timer Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TOF',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', true);

      // When IN is TRUE, Q should be TRUE and ET should be 0
      let result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(true);
      expect(result.tagValues['elapsed_time']).toBe(0);

      // Set IN to FALSE - timer starts
      runtime.setTagValue('start_button', false);
      result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(true); // Q stays TRUE during timing
      expect(result.tagValues['elapsed_time']).toBe(0);

      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Simulate 500ms passing
      result = runtime.executeScan(startTime + 500);
      expect(result.tagValues['timer_output']).toBe(true); // Still TRUE
      expect(result.tagValues['elapsed_time']).toBeGreaterThanOrEqual(490);

      // Simulate 1000ms passing (PT reached)
      result = runtime.executeScan(startTime + 1000);
      expect(result.tagValues['timer_output']).toBe(false); // Q becomes FALSE
      expect(result.tagValues['elapsed_time']).toBe(1000);
    });

    it('should reset to Q=TRUE when IN goes TRUE', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TOF Reset Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TOF',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', false);

      // Start timer (IN=FALSE)
      let result = runtime.executeScan();
      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Run for 500ms
      result = runtime.executeScan(startTime + 500);
      expect(result.tagValues['timer_output']).toBe(true);

      // Set IN to TRUE - should reset
      runtime.setTagValue('start_button', true);
      result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(true);
      expect(result.tagValues['elapsed_time']).toBe(0);
    });
  });

  describe('TP (Pulse Timer)', () => {
    it('should generate a pulse on rising edge of IN', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TP Pulse Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TP',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', false);

      // Initial scan
      let result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(false);

      // Rising edge - pulse starts
      runtime.setTagValue('start_button', true);
      result = runtime.executeScan();
      expect(result.tagValues['timer_output']).toBe(true); // Q goes TRUE
      expect(result.tagValues['elapsed_time']).toBe(0);

      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Simulate 500ms passing (pulse still active)
      result = runtime.executeScan(startTime + 500);
      expect(result.tagValues['timer_output']).toBe(true);
      expect(result.tagValues['elapsed_time']).toBeGreaterThanOrEqual(490);

      // Simulate 1000ms passing (pulse complete)
      result = runtime.executeScan(startTime + 1000);
      expect(result.tagValues['timer_output']).toBe(false); // Q goes FALSE
      expect(result.tagValues['elapsed_time']).toBe(1000);
    });

    it('should not retrigger while pulse is active', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TP Retrigger Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TP',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', false);
      runtime.executeScan();

      // Trigger pulse
      runtime.setTagValue('start_button', true);
      let result = runtime.executeScan();
      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const startTime = timer1._start_time!;

      // Simulate 500ms passing
      result = runtime.executeScan(startTime + 500);

      // Try to retrigger (IN still TRUE) - should have no effect
      const etBefore = result.tagValues['elapsed_time'];

      result = runtime.executeScan(startTime + 600);
      expect(result.tagValues['elapsed_time']).toBeGreaterThan(etBefore);
      expect(result.tagValues['timer_output']).toBe(true); // Still running original pulse
    });

    it('should allow retriggering after pulse completes', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'TP Retrigger After Complete Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TP',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'start_button' }),
                      PT: createNumberLiteral(500),
                    },
                    outputs: {
                      Q: { tag: 'timer_output' },
                      ET: { tag: 'elapsed_time' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('start_button', false);
      runtime.executeScan();

      // First pulse
      runtime.setTagValue('start_button', true);
      let result = runtime.executeScan();
      let timer1 = result.tagValues['Timer1'] as TimerInstance;
      let startTime = timer1._start_time!;

      // Complete first pulse
      result = runtime.executeScan(startTime + 500);
      expect(result.tagValues['timer_output']).toBe(false);

      // Release IN
      runtime.setTagValue('start_button', false);
      result = runtime.executeScan();

      // Trigger second pulse
      runtime.setTagValue('start_button', true);
      result = runtime.executeScan();
      timer1 = result.tagValues['Timer1'] as TimerInstance;
      startTime = timer1._start_time!;

      expect(result.tagValues['timer_output']).toBe(true); // New pulse started
      expect(result.tagValues['elapsed_time']).toBe(0); // ET reset
    });
  });

  describe('Multiple Timers', () => {
    it('should handle multiple timers independently', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        ...createEmptyProgram(),
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Multiple Timers Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'TON',
                    instance: { tag: 'Timer1' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'input1' }),
                      PT: createNumberLiteral(1000),
                    },
                    outputs: {
                      Q: { tag: 'output1' },
                    },
                  },
                  {
                    type: 'call',
                    id: 'stmt_2',
                    function_name: 'TON',
                    instance: { tag: 'Timer2' },
                    inputs: {
                      IN: createOperandExpression({ tag: 'input2' }),
                      PT: createNumberLiteral(500),
                    },
                    outputs: {
                      Q: { tag: 'output2' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input1', true);
      runtime.setTagValue('input2', true);

      let result = runtime.executeScan();
      const timer1 = result.tagValues['Timer1'] as TimerInstance;
      const timer2 = result.tagValues['Timer2'] as TimerInstance;
      const startTime = timer1._start_time!;

      // After 500ms, Timer2 should be done but Timer1 still running
      result = runtime.executeScan(startTime + 500);

      expect(result.tagValues['output1']).toBe(false); // Timer1 not done yet
      expect(result.tagValues['output2']).toBe(true); // Timer2 done

      // After 1000ms, both should be done
      result = runtime.executeScan(startTime + 1000);

      expect(result.tagValues['output1']).toBe(true); // Timer1 done
      expect(result.tagValues['output2']).toBe(true); // Timer2 still done
    });
  });
});
