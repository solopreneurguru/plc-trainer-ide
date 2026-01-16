/**
 * Edge Detection Tests
 *
 * Tests rising edge (P) and falling edge (N) detection for contacts.
 */

import { describe, it, expect } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { Program } from '../../../core/ir/types';

describe('Edge Detection', () => {
  describe('Rising Edge (P)', () => {
    it('should detect rising edge when signal transitions from FALSE to TRUE', () => {
      const runtime = new IRRuntime();

      // Program: output := input.P (rising edge detection)
      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Rising Edge Detection',
                comment: 'Detect rising edge on input signal',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output' },
                    expression: {
                      expr_type: 'operand',
                      operand: {
                        tag: 'input',
                        edge: 'rising',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input', false);
      runtime.setTagValue('output', false);

      // Scan 1: Input is FALSE - no edge detected
      let result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 2: Input transitions to TRUE - rising edge detected!
      runtime.setTagValue('input', true);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true); // Edge detected

      // Scan 3: Input stays TRUE - no edge (already high)
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false); // Edge NOT detected

      // Scan 4: Input stays TRUE - still no edge
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);
    });

    it('should detect rising edge again after signal goes low and high again', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Rising Edge Detection',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input', edge: 'rising' },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input', false);
      runtime.setTagValue('output', false);

      // Scan 1: Input FALSE -> TRUE - rising edge
      runtime.setTagValue('input', true);
      let result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true);

      // Scan 2: Input stays TRUE - no edge
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 3: Input goes FALSE
      runtime.setTagValue('input', false);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 4: Input TRUE again - rising edge detected again!
      runtime.setTagValue('input', true);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true);

      // Scan 5: Input stays TRUE - no edge
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);
    });

    it('should handle multiple rising edge detections on different tags', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Two Rising Edge Detections',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output1' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input1', edge: 'rising' },
                    },
                  },
                  {
                    type: 'assignment',
                    id: 'stmt_2',
                    target: { tag: 'output2' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input2', edge: 'rising' },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input1', false);
      runtime.setTagValue('input2', false);

      // Scan 1: Both FALSE
      let result = runtime.executeScan();
      expect(result.tagValues['output1']).toBe(false);
      expect(result.tagValues['output2']).toBe(false);

      // Scan 2: Input1 rises
      runtime.setTagValue('input1', true);
      result = runtime.executeScan();
      expect(result.tagValues['output1']).toBe(true);
      expect(result.tagValues['output2']).toBe(false);

      // Scan 3: Input2 rises
      runtime.setTagValue('input2', true);
      result = runtime.executeScan();
      expect(result.tagValues['output1']).toBe(false); // No edge on input1
      expect(result.tagValues['output2']).toBe(true); // Edge on input2
    });
  });

  describe('Falling Edge (N)', () => {
    it('should detect falling edge when signal transitions from TRUE to FALSE', () => {
      const runtime = new IRRuntime();

      // Program: output := input.N (falling edge detection)
      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Falling Edge Detection',
                comment: 'Detect falling edge on input signal',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output' },
                    expression: {
                      expr_type: 'operand',
                      operand: {
                        tag: 'input',
                        edge: 'falling',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input', true); // Start high
      runtime.setTagValue('output', false);

      // Scan 1: Input is TRUE - no edge detected
      let result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 2: Input transitions to FALSE - falling edge detected!
      runtime.setTagValue('input', false);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true); // Edge detected

      // Scan 3: Input stays FALSE - no edge (already low)
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false); // Edge NOT detected

      // Scan 4: Input stays FALSE - still no edge
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);
    });

    it('should detect falling edge again after signal goes high and low again', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Falling Edge Detection',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input', edge: 'falling' },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input', true);
      runtime.setTagValue('output', false);

      // Scan 0: Initialize edge memory with input=TRUE
      let result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false); // No edge yet

      // Scan 1: Input TRUE -> FALSE - falling edge
      runtime.setTagValue('input', false);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true);

      // Scan 2: Input stays FALSE - no edge
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 3: Input goes TRUE
      runtime.setTagValue('input', true);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 4: Input FALSE again - falling edge detected again!
      runtime.setTagValue('input', false);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true);

      // Scan 5: Input stays FALSE - no edge
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);
    });
  });

  describe('Combined Rising and Falling Edges', () => {
    it('should independently track rising and falling edges on the same tag', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Both Edge Types',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'rising_out' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input', edge: 'rising' },
                    },
                  },
                  {
                    type: 'assignment',
                    id: 'stmt_2',
                    target: { tag: 'falling_out' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input', edge: 'falling' },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input', false);

      // Scan 1: Input FALSE - no edges
      let result = runtime.executeScan();
      expect(result.tagValues['rising_out']).toBe(false);
      expect(result.tagValues['falling_out']).toBe(false);

      // Scan 2: Input FALSE -> TRUE - rising edge only
      runtime.setTagValue('input', true);
      result = runtime.executeScan();
      expect(result.tagValues['rising_out']).toBe(true);
      expect(result.tagValues['falling_out']).toBe(false);

      // Scan 3: Input TRUE (stable) - no edges
      result = runtime.executeScan();
      expect(result.tagValues['rising_out']).toBe(false);
      expect(result.tagValues['falling_out']).toBe(false);

      // Scan 4: Input TRUE -> FALSE - falling edge only
      runtime.setTagValue('input', false);
      result = runtime.executeScan();
      expect(result.tagValues['rising_out']).toBe(false);
      expect(result.tagValues['falling_out']).toBe(true);

      // Scan 5: Input FALSE (stable) - no edges
      result = runtime.executeScan();
      expect(result.tagValues['rising_out']).toBe(false);
      expect(result.tagValues['falling_out']).toBe(false);
    });
  });

  describe('Edge Detection with Complex Expressions', () => {
    it('should work with edge detection in AND expressions', () => {
      const runtime = new IRRuntime();

      // Program: output := enable AND button.P
      // (Output is TRUE only when enable is TRUE AND button has rising edge)
      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Edge with AND',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output' },
                    expression: {
                      expr_type: 'binary',
                      operator: 'AND',
                      left: {
                        expr_type: 'operand',
                        operand: { tag: 'enable' },
                      },
                      right: {
                        expr_type: 'operand',
                        operand: { tag: 'button', edge: 'rising' },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('enable', true);
      runtime.setTagValue('button', false);

      // Scan 1: Button FALSE - no edge
      let result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 2: Button rises, enable TRUE - output TRUE
      runtime.setTagValue('button', true);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(true);

      // Scan 3: Button stable - output FALSE
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 4: Disable, button falls
      runtime.setTagValue('enable', false);
      runtime.setTagValue('button', false);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false);

      // Scan 5: Button rises but enable FALSE - output FALSE
      runtime.setTagValue('button', true);
      result = runtime.executeScan();
      expect(result.tagValues['output']).toBe(false); // Edge detected but enable is FALSE
    });
  });

  describe('Edge Detection Persistence Across Scans', () => {
    it('should maintain edge memory state correctly across multiple scans', () => {
      const runtime = new IRRuntime();

      const program: Program = {
        version: '1.0',
        organization_blocks: [
          {
            id: 'OB1',
            name: 'Main',
            type: 'cyclic',
            networks: [
              {
                id: 'Network_1',
                title: 'Edge Memory Test',
                statements: [
                  {
                    type: 'assignment',
                    id: 'stmt_1',
                    target: { tag: 'output' },
                    expression: {
                      expr_type: 'operand',
                      operand: { tag: 'input', edge: 'rising' },
                    },
                  },
                ],
              },
            ],
          },
        ],
        functions: [],
        function_blocks: [],
      };

      runtime.loadProgram(program);
      runtime.setTagValue('input', false);

      // Generate multiple rising edges and verify each is detected exactly once
      for (let i = 0; i < 5; i++) {
        // Input goes FALSE
        runtime.setTagValue('input', false);
        let result = runtime.executeScan();
        expect(result.tagValues['output']).toBe(false);

        // Input goes TRUE - edge detected
        runtime.setTagValue('input', true);
        result = runtime.executeScan();
        expect(result.tagValues['output']).toBe(true);

        // Input stays TRUE - no edge
        result = runtime.executeScan();
        expect(result.tagValues['output']).toBe(false);
      }
    });
  });
});
