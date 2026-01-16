/**
 * Counter Instructions Tests
 *
 * Tests for CTU, CTD, and CTUD counter behaviors
 */

import { describe, it, expect } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { Program } from '../../../core/ir/types';
import { createEmptyProgram, createOperandExpression, createNumberLiteral, createBoolLiteral } from '../../../core/ir/types';

describe('Counter Instructions', () => {
  describe('CTU (Count Up)', () => {
    it('should increment on rising edge of CU', () => {
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
                title: 'CTU Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTU',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createOperandExpression({ tag: 'count_pulse' }),
                      R: createOperandExpression({ tag: 'reset' }),
                      PV: createNumberLiteral(5),
                    },
                    outputs: {
                      Q: { tag: 'counter_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_pulse', false);
      runtime.setTagValue('reset', false);

      // Initial scan - CV should be 0
      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0);
      expect(result.tagValues['counter_done']).toBe(false);

      // Rising edge 1 - CV should be 1
      runtime.setTagValue('count_pulse', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(1);
      expect(result.tagValues['counter_done']).toBe(false);

      // CU stays TRUE - no change (not a rising edge)
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(1);

      // Falling edge - no change
      runtime.setTagValue('count_pulse', false);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(1);

      // Rising edge 2 - CV should be 2
      runtime.setTagValue('count_pulse', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(2);
    });

    it('should set Q when CV >= PV', () => {
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
                title: 'CTU Limit Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTU',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createOperandExpression({ tag: 'count_pulse' }),
                      R: createBoolLiteral(false),
                      PV: createNumberLiteral(3),
                    },
                    outputs: {
                      Q: { tag: 'counter_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_pulse', false);

      // Count up to PV
      for (let i = 0; i < 3; i++) {
        runtime.setTagValue('count_pulse', true);
        let result = runtime.executeScan();
        expect(result.tagValues['current_count']).toBe(i + 1);

        if (i < 2) {
          expect(result.tagValues['counter_done']).toBe(false);
        } else {
          // At i=2, CV=3, should equal PV
          expect(result.tagValues['counter_done']).toBe(true);
        }

        runtime.setTagValue('count_pulse', false);
        runtime.executeScan();
      }
    });

    it('should reset CV to 0 when R is TRUE', () => {
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
                title: 'CTU Reset Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTU',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createOperandExpression({ tag: 'count_pulse' }),
                      R: createOperandExpression({ tag: 'reset' }),
                      PV: createNumberLiteral(10),
                    },
                    outputs: {
                      Q: { tag: 'counter_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_pulse', false);
      runtime.setTagValue('reset', false);

      // Count up to 5
      for (let i = 0; i < 5; i++) {
        runtime.setTagValue('count_pulse', true);
        runtime.executeScan();
        runtime.setTagValue('count_pulse', false);
        runtime.executeScan();
      }

      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(5);

      // Reset
      runtime.setTagValue('reset', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0);
      expect(result.tagValues['counter_done']).toBe(false);
    });
  });

  describe('CTD (Count Down)', () => {
    it('should decrement on rising edge of CD', () => {
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
                title: 'CTD Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CD: createOperandExpression({ tag: 'count_pulse' }),
                      LD: createOperandExpression({ tag: 'load' }),
                      PV: createNumberLiteral(5),
                    },
                    outputs: {
                      Q: { tag: 'counter_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_pulse', false);
      runtime.setTagValue('load', true); // Load PV into CV

      // Load preset value
      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(5);
      expect(result.tagValues['counter_done']).toBe(false);

      // Disable load
      runtime.setTagValue('load', false);
      result = runtime.executeScan();

      // Rising edge 1 - CV should be 4
      runtime.setTagValue('count_pulse', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(4);

      // Falling edge then rising edge - CV should be 3
      runtime.setTagValue('count_pulse', false);
      runtime.executeScan();
      runtime.setTagValue('count_pulse', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(3);
    });

    it('should set Q when CV <= 0', () => {
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
                title: 'CTD Limit Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CD: createOperandExpression({ tag: 'count_pulse' }),
                      LD: createBoolLiteral(false),
                      PV: createNumberLiteral(3),
                    },
                    outputs: {
                      Q: { tag: 'counter_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_pulse', false);

      // Start at 0 - Q should already be TRUE
      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0);
      expect(result.tagValues['counter_done']).toBe(true);

      // Count down below 0
      runtime.setTagValue('count_pulse', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(-1);
      expect(result.tagValues['counter_done']).toBe(true); // Still TRUE
    });

    it('should load PV into CV when LD is TRUE', () => {
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
                title: 'CTD Load Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CD: createOperandExpression({ tag: 'count_pulse' }),
                      LD: createOperandExpression({ tag: 'load' }),
                      PV: createNumberLiteral(10),
                    },
                    outputs: {
                      Q: { tag: 'counter_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_pulse', false);
      runtime.setTagValue('load', false);

      // Count down a few times
      for (let i = 0; i < 3; i++) {
        runtime.setTagValue('count_pulse', true);
        runtime.executeScan();
        runtime.setTagValue('count_pulse', false);
        runtime.executeScan();
      }

      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(-3);

      // Load PV
      runtime.setTagValue('load', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(10);
      expect(result.tagValues['counter_done']).toBe(false);
    });
  });

  describe('CTUD (Count Up/Down)', () => {
    it('should count up on CU rising edge', () => {
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
                title: 'CTUD Count Up Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTUD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createOperandExpression({ tag: 'count_up' }),
                      CD: createBoolLiteral(false),
                      R: createBoolLiteral(false),
                      LD: createBoolLiteral(false),
                      PV: createNumberLiteral(5),
                    },
                    outputs: {
                      QU: { tag: 'count_up_done' },
                      QD: { tag: 'count_down_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_up', false);

      // Initial state
      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0);
      expect(result.tagValues['count_up_done']).toBe(false);
      expect(result.tagValues['count_down_done']).toBe(true); // CV=0, so QD=TRUE

      // Count up
      for (let i = 0; i < 5; i++) {
        runtime.setTagValue('count_up', true);
        result = runtime.executeScan();
        expect(result.tagValues['current_count']).toBe(i + 1);

        runtime.setTagValue('count_up', false);
        runtime.executeScan();
      }

      expect(result.tagValues['current_count']).toBe(5);
      expect(result.tagValues['count_up_done']).toBe(true); // CV >= PV
      expect(result.tagValues['count_down_done']).toBe(false);
    });

    it('should count down on CD rising edge', () => {
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
                title: 'CTUD Count Down Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTUD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createBoolLiteral(false),
                      CD: createOperandExpression({ tag: 'count_down' }),
                      R: createBoolLiteral(false),
                      LD: createOperandExpression({ tag: 'load' }),
                      PV: createNumberLiteral(5),
                    },
                    outputs: {
                      QU: { tag: 'count_up_done' },
                      QD: { tag: 'count_down_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_down', false);
      runtime.setTagValue('load', true);

      // Load PV
      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(5);

      runtime.setTagValue('load', false);
      runtime.executeScan();

      // Count down
      for (let i = 5; i > 0; i--) {
        runtime.setTagValue('count_down', true);
        result = runtime.executeScan();
        expect(result.tagValues['current_count']).toBe(i - 1);

        runtime.setTagValue('count_down', false);
        runtime.executeScan();
      }

      expect(result.tagValues['current_count']).toBe(0);
      expect(result.tagValues['count_down_done']).toBe(true); // CV <= 0
      expect(result.tagValues['count_up_done']).toBe(false);
    });

    it('should handle simultaneous CU and CD edges', () => {
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
                title: 'CTUD Simultaneous Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTUD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createOperandExpression({ tag: 'count_up' }),
                      CD: createOperandExpression({ tag: 'count_down' }),
                      R: createBoolLiteral(false),
                      LD: createBoolLiteral(false),
                      PV: createNumberLiteral(5),
                    },
                    outputs: {
                      QU: { tag: 'count_up_done' },
                      QD: { tag: 'count_down_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_up', false);
      runtime.setTagValue('count_down', false);

      // Initial state
      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0);

      // Both edges simultaneously - should cancel out
      runtime.setTagValue('count_up', true);
      runtime.setTagValue('count_down', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0); // No change

      // Release both
      runtime.setTagValue('count_up', false);
      runtime.setTagValue('count_down', false);
      result = runtime.executeScan();

      // CU edge only
      runtime.setTagValue('count_up', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(1);
    });

    it('should reset when R is TRUE', () => {
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
                title: 'CTUD Reset Test',
                comment: '',
                statements: [
                  {
                    type: 'call',
                    id: 'stmt_1',
                    function_name: 'CTUD',
                    instance: { tag: 'Counter1' },
                    inputs: {
                      CU: createOperandExpression({ tag: 'count_up' }),
                      CD: createBoolLiteral(false),
                      R: createOperandExpression({ tag: 'reset' }),
                      LD: createBoolLiteral(false),
                      PV: createNumberLiteral(10),
                    },
                    outputs: {
                      QU: { tag: 'count_up_done' },
                      QD: { tag: 'count_down_done' },
                      CV: { tag: 'current_count' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('count_up', false);
      runtime.setTagValue('reset', false);

      // Count up to 7
      for (let i = 0; i < 7; i++) {
        runtime.setTagValue('count_up', true);
        runtime.executeScan();
        runtime.setTagValue('count_up', false);
        runtime.executeScan();
      }

      let result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(7);

      // Reset
      runtime.setTagValue('reset', true);
      result = runtime.executeScan();
      expect(result.tagValues['current_count']).toBe(0);
      expect(result.tagValues['count_up_done']).toBe(false);
      expect(result.tagValues['count_down_done']).toBe(true); // CV=0
    });
  });
});
