/**
 * IR Schema Tests
 * Tests for IR type validation, serialization, and fixtures
 */

import { describe, it, expect } from 'vitest';
import {
  ProgramSchema,
  createEmptyProgram,
  createOperandExpression,
  createBinaryExpression,
  createAssignment,
  generateId,
} from '../types';
import { serializeProgram, deserializeProgram, validateProgram } from '../serialization';
import * as fs from 'fs';
import * as path from 'path';

describe('IR Schema Validation', () => {
  it('should validate an empty program', () => {
    const program = createEmptyProgram();
    const result = ProgramSchema.safeParse(program);
    expect(result.success).toBe(true);
  });

  it('should create and validate a simple assignment', () => {
    const program = createEmptyProgram();
    const assignment = createAssignment(
      'stmt_1',
      { tag: 'output' },
      createOperandExpression({ tag: 'input' })
    );
    program.organization_blocks[0].networks[0].statements.push(assignment);

    const result = ProgramSchema.safeParse(program);
    expect(result.success).toBe(true);
  });

  it('should create and validate OR expression', () => {
    const orExpr = createBinaryExpression(
      'OR',
      createOperandExpression({ tag: 'input_a' }),
      createOperandExpression({ tag: 'input_b' })
    );

    const program = createEmptyProgram();
    const assignment = createAssignment('stmt_1', { tag: 'output' }, orExpr);
    program.organization_blocks[0].networks[0].statements.push(assignment);

    const result = ProgramSchema.safeParse(program);
    expect(result.success).toBe(true);
  });

  it('should create and validate AND expression', () => {
    const andExpr = createBinaryExpression(
      'AND',
      createOperandExpression({ tag: 'input_a' }),
      createOperandExpression({ tag: 'input_b' })
    );

    const program = createEmptyProgram();
    const assignment = createAssignment('stmt_1', { tag: 'output' }, andExpr);
    program.organization_blocks[0].networks[0].statements.push(assignment);

    const result = ProgramSchema.safeParse(program);
    expect(result.success).toBe(true);
  });

  it('should create and validate NOT expression', () => {
    const program = createEmptyProgram();
    const notExpr = {
      expr_type: 'unary' as const,
      operator: 'NOT' as const,
      operand: createOperandExpression({ tag: 'input' }),
    };
    const assignment = createAssignment('stmt_1', { tag: 'output' }, notExpr);
    program.organization_blocks[0].networks[0].statements.push(assignment);

    const result = ProgramSchema.safeParse(program);
    expect(result.success).toBe(true);
  });

  it('should reject invalid program structure', () => {
    const invalid = {
      version: '1.0',
      // Missing required fields
    };

    const result = ProgramSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('IR Serialization', () => {
  it('should serialize and deserialize a program', () => {
    const program = createEmptyProgram();
    const json = serializeProgram(program);
    const deserialized = deserializeProgram(json);

    expect(deserialized).toEqual(program);
  });

  it('should serialize program with expressions', () => {
    const program = createEmptyProgram();
    const expr = createBinaryExpression(
      'OR',
      createOperandExpression({ tag: 'start' }),
      createOperandExpression({ tag: 'seal' })
    );
    const assignment = createAssignment('stmt_1', { tag: 'output' }, expr);
    program.organization_blocks[0].networks[0].statements.push(assignment);

    const json = serializeProgram(program);
    const deserialized = deserializeProgram(json);

    expect(deserialized).toEqual(program);
  });

  it('should throw on invalid JSON', () => {
    expect(() => deserializeProgram('invalid json')).toThrow();
  });

  it('should validate program and return errors', () => {
    const invalid = { version: '1.0' };
    const result = validateProgram(invalid);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('IR Fixtures', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');

  it('should validate fixture: 01-simple-contact.json', () => {
    const fixturePath = path.join(fixturesDir, '01-simple-contact.json');
    const json = fs.readFileSync(fixturePath, 'utf-8');
    const program = deserializeProgram(json);

    expect(program.version).toBe('1.0');
    expect(program.organization_blocks).toHaveLength(1);
    expect(program.organization_blocks[0].networks).toHaveLength(1);
    expect(program.organization_blocks[0].networks[0].statements).toHaveLength(1);

    const stmt = program.organization_blocks[0].networks[0].statements[0];
    expect(stmt.type).toBe('assignment');
  });

  it('should validate fixture: 02-or-branch.json', () => {
    const fixturePath = path.join(fixturesDir, '02-or-branch.json');
    const json = fs.readFileSync(fixturePath, 'utf-8');
    const program = deserializeProgram(json);

    const stmt = program.organization_blocks[0].networks[0].statements[0];
    expect(stmt.type).toBe('assignment');
    if (stmt.type === 'assignment') {
      expect(stmt.expression.expr_type).toBe('binary');
      if (stmt.expression.expr_type === 'binary') {
        expect(stmt.expression.operator).toBe('OR');
      }
    }
  });

  it('should validate fixture: 03-and-series.json', () => {
    const fixturePath = path.join(fixturesDir, '03-and-series.json');
    const json = fs.readFileSync(fixturePath, 'utf-8');
    const program = deserializeProgram(json);

    const stmt = program.organization_blocks[0].networks[0].statements[0];
    expect(stmt.type).toBe('assignment');
    if (stmt.type === 'assignment') {
      expect(stmt.expression.expr_type).toBe('binary');
      if (stmt.expression.expr_type === 'binary') {
        expect(stmt.expression.operator).toBe('AND');
      }
    }
  });

  it('should validate fixture: 04-seal-in-start-stop.json', () => {
    const fixturePath = path.join(fixturesDir, '04-seal-in-start-stop.json');
    const json = fs.readFileSync(fixturePath, 'utf-8');
    const program = deserializeProgram(json);

    // Should have 2 networks (start/seal rung and stop rung)
    expect(program.organization_blocks[0].networks).toHaveLength(2);

    // Network 1: Start/Seal with OR expression
    const network1 = program.organization_blocks[0].networks[0];
    expect(network1.statements).toHaveLength(1);
    const stmt1 = network1.statements[0];
    expect(stmt1.type).toBe('assignment');
    if (stmt1.type === 'assignment') {
      expect(stmt1.expression.expr_type).toBe('binary');
      if (stmt1.expression.expr_type === 'binary') {
        expect(stmt1.expression.operator).toBe('OR');
      }
    }

    // Network 2: Stop with AND and NOT expression (motor_output AND NOT stop_button)
    const network2 = program.organization_blocks[0].networks[1];
    expect(network2.statements).toHaveLength(1);
    const stmt2 = network2.statements[0];
    expect(stmt2.type).toBe('assignment');
    if (stmt2.type === 'assignment') {
      expect(stmt2.expression.expr_type).toBe('binary');
      if (stmt2.expression.expr_type === 'binary') {
        expect(stmt2.expression.operator).toBe('AND');
        // Right side should have the NOT operator
        expect(stmt2.expression.right.expr_type).toBe('unary');
        if (stmt2.expression.right.expr_type === 'unary') {
          expect(stmt2.expression.right.operator).toBe('NOT');
        }
      }
    }
  });

  it('should validate all fixtures have correct structure', () => {
    const fixtures = [
      '01-simple-contact.json',
      '02-or-branch.json',
      '03-and-series.json',
      '04-seal-in-start-stop.json',
    ];

    fixtures.forEach((filename) => {
      const fixturePath = path.join(fixturesDir, filename);
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const result = validateProgram(JSON.parse(json));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.version).toBe('1.0');
        expect(result.data?.organization_blocks).toBeDefined();
      }
    });
  });
});

describe('IR Expression Trees', () => {
  it('should build complex nested expression', () => {
    // (A OR B) AND (C OR D)
    const expr = createBinaryExpression(
      'AND',
      createBinaryExpression(
        'OR',
        createOperandExpression({ tag: 'A' }),
        createOperandExpression({ tag: 'B' })
      ),
      createBinaryExpression(
        'OR',
        createOperandExpression({ tag: 'C' }),
        createOperandExpression({ tag: 'D' })
      )
    );

    const program = createEmptyProgram();
    const assignment = createAssignment('stmt_1', { tag: 'output' }, expr);
    program.organization_blocks[0].networks[0].statements.push(assignment);

    const result = ProgramSchema.safeParse(program);
    expect(result.success).toBe(true);

    // Verify JSON round-trip
    const json = serializeProgram(program);
    const deserialized = deserializeProgram(json);
    expect(deserialized).toEqual(program);
  });

  it('should support operands with symbolic tag references', () => {
    const operand = { tag: 'my_symbolic_tag' };
    const expr = createOperandExpression(operand);

    expect(expr.expr_type).toBe('operand');
    expect(expr.operand.tag).toBe('my_symbolic_tag');
  });

  it('should support operands with direct addresses (fallback)', () => {
    const operand = { address: '%I0.0' };
    const expr = createOperandExpression(operand);

    expect(expr.expr_type).toBe('operand');
    expect(expr.operand.address).toBe('%I0.0');
  });
});
