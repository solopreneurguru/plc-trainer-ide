/**
 * LAD Compiler Tests
 *
 * Tests the LAD → IR compiler against fixture files
 * Verifies correct translation of contacts, coils, branches, and series logic
 */

import { describe, it, expect } from 'vitest';
import { LADCompiler } from '../LADCompiler';
import { validateLADProgram } from '../../../core/lad/types';
import { IRRuntime } from '../../../runtime/ir/IRRuntime';
import * as fs from 'fs';
import * as path from 'path';

describe('LAD Compiler - Fixture Compilation', () => {
  const compiler = new LADCompiler();

  describe('Fixture 01: Simple Contact', () => {
    it('should compile simple contact → coil to IR', () => {
      // Load LAD fixture
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/01-simple-contact.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));

      // Compile to IR
      const irProgram = compiler.compile(ladProgram);

      // Verify IR structure
      expect(irProgram.version).toBe('1.0');
      expect(irProgram.organization_blocks).toHaveLength(1);

      const ob1 = irProgram.organization_blocks[0];
      expect(ob1.id).toBe('OB1');
      expect(ob1.type).toBe('cyclic');
      expect(ob1.networks).toHaveLength(1);

      const network = ob1.networks[0];
      expect(network.id).toBe('network_1');
      expect(network.statements).toHaveLength(1);

      const statement = network.statements[0];
      expect(statement.type).toBe('assignment');
      if (statement.type === 'assignment') {
        expect(statement.target.tag).toBe('motor_output');
        expect(statement.expression.expr_type).toBe('operand');
        if (statement.expression.expr_type === 'operand') {
          expect(statement.expression.operand.tag).toBe('start_button');
        }
      }
    });
  });

  describe('Fixture 02: OR Branch', () => {
    it('should compile parallel contacts to OR expression', () => {
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/02-or-branch.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));

      const irProgram = compiler.compile(ladProgram);
      const statement = irProgram.organization_blocks[0].networks[0].statements[0];

      expect(statement.type).toBe('assignment');
      if (statement.type === 'assignment') {
        // Expression should be: start_button OR seal_contact
        expect(statement.expression.expr_type).toBe('binary');
        if (statement.expression.expr_type === 'binary') {
          expect(statement.expression.operator).toBe('OR');

          // Left operand: start_button
          expect(statement.expression.left.expr_type).toBe('operand');
          if (statement.expression.left.expr_type === 'operand') {
            expect(statement.expression.left.operand.tag).toBe('start_button');
          }

          // Right operand: seal_contact
          expect(statement.expression.right.expr_type).toBe('operand');
          if (statement.expression.right.expr_type === 'operand') {
            expect(statement.expression.right.operand.tag).toBe('seal_contact');
          }
        }
      }
    });
  });

  describe('Fixture 03: AND Series', () => {
    it('should compile series contacts to AND expression', () => {
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/03-and-series.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));

      const irProgram = compiler.compile(ladProgram);
      const statement = irProgram.organization_blocks[0].networks[0].statements[0];

      expect(statement.type).toBe('assignment');
      if (statement.type === 'assignment') {
        // Expression should be: contact_a AND contact_b
        expect(statement.expression.expr_type).toBe('binary');
        if (statement.expression.expr_type === 'binary') {
          expect(statement.expression.operator).toBe('AND');

          // Left operand: contact_a
          expect(statement.expression.left.expr_type).toBe('operand');
          if (statement.expression.left.expr_type === 'operand') {
            expect(statement.expression.left.operand.tag).toBe('contact_a');
          }

          // Right operand: contact_b
          expect(statement.expression.right.expr_type).toBe('operand');
          if (statement.expression.right.expr_type === 'operand') {
            expect(statement.expression.right.operand.tag).toBe('contact_b');
          }
        }
      }
    });
  });

  describe('Fixture 04: Seal-In Start/Stop', () => {
    it('should compile two-rung seal-in circuit', () => {
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/04-seal-in-start-stop.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));

      const irProgram = compiler.compile(ladProgram);
      const network = irProgram.organization_blocks[0].networks[0];

      // Should have 2 rungs → 2 statements
      expect(network.statements).toHaveLength(2);

      // Rung 1: motor_output := start_button OR motor_output
      const stmt1 = network.statements[0];
      expect(stmt1.type).toBe('assignment');
      if (stmt1.type === 'assignment') {
        expect(stmt1.target.tag).toBe('motor_output');
        expect(stmt1.expression.expr_type).toBe('binary');
        if (stmt1.expression.expr_type === 'binary') {
          expect(stmt1.expression.operator).toBe('OR');
        }
      }

      // Rung 2: motor_output := motor_output AND NOT(stop_button)
      const stmt2 = network.statements[1];
      expect(stmt2.type).toBe('assignment');
      if (stmt2.type === 'assignment') {
        expect(stmt2.target.tag).toBe('motor_output');
        expect(stmt2.expression.expr_type).toBe('binary');
        if (stmt2.expression.expr_type === 'binary') {
          expect(stmt2.expression.operator).toBe('AND');

          // Left: motor_output
          expect(stmt2.expression.left.expr_type).toBe('operand');
          if (stmt2.expression.left.expr_type === 'operand') {
            expect(stmt2.expression.left.operand.tag).toBe('motor_output');
          }

          // Right: NOT(stop_button)
          expect(stmt2.expression.right.expr_type).toBe('unary');
          if (stmt2.expression.right.expr_type === 'unary') {
            expect(stmt2.expression.right.operator).toBe('NOT');
            expect(stmt2.expression.right.operand.expr_type).toBe('operand');
            if (stmt2.expression.right.operand.expr_type === 'operand') {
              expect(stmt2.expression.right.operand.operand.tag).toBe('stop_button');
            }
          }
        }
      }
    });
  });
});

describe('LAD Compiler - Runtime Integration', () => {
  const compiler = new LADCompiler();
  let runtime: IRRuntime;

  beforeEach(() => {
    runtime = new IRRuntime();
  });

  describe('Fixture 01: Simple Contact Runtime', () => {
    it('should execute compiled LAD: motor follows start_button', () => {
      // Load and compile LAD
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/01-simple-contact.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));
      const irProgram = compiler.compile(ladProgram);

      // Load into runtime
      runtime.loadProgram(irProgram);
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('motor_output', false);

      // Test: start_button OFF → motor OFF
      let result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Test: start_button ON → motor ON
      runtime.setTagValue('start_button', true);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Test: start_button OFF → motor OFF
      runtime.setTagValue('start_button', false);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });
  });

  describe('Fixture 02: OR Branch Runtime', () => {
    it('should execute compiled LAD: motor ON when either input ON', () => {
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/02-or-branch.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));
      const irProgram = compiler.compile(ladProgram);

      runtime.loadProgram(irProgram);
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('seal_contact', false);
      runtime.setTagValue('motor_output', false);

      // Both OFF → motor OFF
      let result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // start_button ON → motor ON
      runtime.setTagValue('start_button', true);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // start_button OFF, seal_contact ON → motor ON
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('seal_contact', true);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Both OFF → motor OFF
      runtime.setTagValue('seal_contact', false);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });
  });

  describe('Fixture 03: AND Series Runtime', () => {
    it('should execute compiled LAD: motor ON only when both inputs ON', () => {
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/03-and-series.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));
      const irProgram = compiler.compile(ladProgram);

      runtime.loadProgram(irProgram);
      runtime.setTagValue('contact_a', false);
      runtime.setTagValue('contact_b', false);
      runtime.setTagValue('output', false);

      // Both OFF → output OFF
      let result = runtime.executeScan();
      expect(result.tagValues.output).toBe(false);

      // Only A ON → output OFF
      runtime.setTagValue('contact_a', true);
      result = runtime.executeScan();
      expect(result.tagValues.output).toBe(false);

      // Both ON → output ON
      runtime.setTagValue('contact_b', true);
      result = runtime.executeScan();
      expect(result.tagValues.output).toBe(true);

      // Only B ON → output OFF
      runtime.setTagValue('contact_a', false);
      result = runtime.executeScan();
      expect(result.tagValues.output).toBe(false);
    });
  });

  describe('Fixture 04: Seal-In Start/Stop Runtime', () => {
    it('should execute compiled LAD: seal-in with stop dominance', () => {
      const fixturePath = path.join(__dirname, '../../../core/lad/fixtures/04-seal-in-start-stop.lad.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const ladProgram = validateLADProgram(JSON.parse(json));
      const irProgram = compiler.compile(ladProgram);

      runtime.loadProgram(irProgram);
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('stop_button', false);
      runtime.setTagValue('motor_output', false);

      // Initial: all OFF → motor OFF
      let result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Press start → motor ON
      runtime.setTagValue('start_button', true);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Release start → motor STAYS ON (sealed)
      runtime.setTagValue('start_button', false);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Still sealed
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Press stop → motor OFF
      runtime.setTagValue('stop_button', true);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Release stop → motor STAYS OFF
      runtime.setTagValue('stop_button', false);
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });
  });
});
