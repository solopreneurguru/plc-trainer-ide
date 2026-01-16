/**
 * IR Expression Evaluator
 *
 * Evaluates IR expression trees (AST) by recursive traversal.
 * Reads operand values from TagStore snapshot (previous scan state).
 */

import {
  Expression,
  BinaryOperator,
  UnaryOperator,
  Operand,
} from '../../core/ir/types';
import { TagStore, TagValue } from './TagStore';

export class ExpressionEvaluator {
  constructor(private tagStore: TagStore) {}

  /**
   * Evaluate an expression tree
   * Returns the computed value
   */
  evaluate(expr: Expression): TagValue {
    switch (expr.expr_type) {
      case 'operand':
        return this.evaluateOperand(expr.operand);

      case 'binary':
        return this.evaluateBinary(
          expr.operator,
          this.evaluate(expr.left),
          this.evaluate(expr.right)
        );

      case 'unary':
        return this.evaluateUnary(expr.operator, this.evaluate(expr.operand));

      case 'literal':
        return expr.value;

      case 'call':
        // Function calls not yet implemented
        throw new Error(`Function calls not yet supported: ${expr.function_name}`);

      default:
        throw new Error(`Unknown expression type: ${(expr as any).expr_type}`);
    }
  }

  /**
   * Evaluate an operand
   * Reads from pending writes first (for within-scan feedback), then snapshot
   * This enables proper PLC semantics: later networks see writes from earlier networks
   */
  private evaluateOperand(operand: Operand): TagValue {
    let tagId: string;

    if (operand.tag) {
      // Symbolic tag reference (preferred)
      tagId = operand.tag;
    } else if (operand.address) {
      // Direct address fallback
      tagId = TagStore.addressToTagId(operand.address);
    } else {
      throw new Error('Operand must have either tag or address');
    }

    // Read from pending FIRST (within-scan writes), then snapshot (previous scan)
    // This enables: Network 1 writes X, Network 2 reads updated X in same scan
    const value = this.tagStore.readFromPendingOrSnapshot(tagId);

    // Default to false/0 if tag not found
    if (value === undefined) {
      return false;
    }

    // Handle edge detection
    if (operand.edge) {
      return this.evaluateEdge(tagId, operand.edge, value);
    }

    return value;
  }

  /**
   * Evaluate edge detection on an operand
   *
   * Rising edge (P): Returns TRUE for one scan when signal transitions FALSE -> TRUE
   * Falling edge (N): Returns TRUE for one scan when signal transitions TRUE -> FALSE
   *
   * Implementation:
   * - Get current boolean state of the operand
   * - Get previous state from edge memory
   * - Detect transition
   * - Update edge memory with current state for next scan
   */
  private evaluateEdge(tagId: string, edgeType: 'rising' | 'falling', currentValue: TagValue): boolean {
    // Convert current value to boolean
    const currentState = this.toBoolean(currentValue);

    // Get previous state from edge memory
    const previousState = this.tagStore.getEdgeMemory(tagId, edgeType);

    // Detect edge
    let edgeDetected = false;

    if (edgeType === 'rising') {
      // Rising edge: current TRUE and previous FALSE
      edgeDetected = currentState && !previousState;
    } else if (edgeType === 'falling') {
      // Falling edge: current FALSE and previous TRUE
      edgeDetected = !currentState && previousState;
    }

    // Update edge memory with current state for next scan
    this.tagStore.setEdgeMemory(tagId, edgeType, currentState);

    return edgeDetected;
  }

  /**
   * Evaluate binary operation
   */
  private evaluateBinary(op: BinaryOperator, left: TagValue, right: TagValue): TagValue {
    // Boolean operations
    if (op === 'AND') {
      return this.toBoolean(left) && this.toBoolean(right);
    }
    if (op === 'OR') {
      return this.toBoolean(left) || this.toBoolean(right);
    }
    if (op === 'XOR') {
      return this.toBoolean(left) !== this.toBoolean(right);
    }

    // Comparison operations
    if (op === 'EQ') {
      return left === right;
    }
    if (op === 'NE') {
      return left !== right;
    }
    if (op === 'LT') {
      return this.toNumber(left) < this.toNumber(right);
    }
    if (op === 'GT') {
      return this.toNumber(left) > this.toNumber(right);
    }
    if (op === 'LE') {
      return this.toNumber(left) <= this.toNumber(right);
    }
    if (op === 'GE') {
      return this.toNumber(left) >= this.toNumber(right);
    }

    // Arithmetic operations
    if (op === 'ADD') {
      return this.toNumber(left) + this.toNumber(right);
    }
    if (op === 'SUB') {
      return this.toNumber(left) - this.toNumber(right);
    }
    if (op === 'MUL') {
      return this.toNumber(left) * this.toNumber(right);
    }
    if (op === 'DIV') {
      if (this.toNumber(right) === 0) {
        throw new Error('Division by zero');
      }
      return this.toNumber(left) / this.toNumber(right);
    }
    if (op === 'MOD') {
      if (this.toNumber(right) === 0) {
        throw new Error('Modulo by zero');
      }
      return this.toNumber(left) % this.toNumber(right);
    }

    throw new Error(`Unknown binary operator: ${op}`);
  }

  /**
   * Evaluate unary operation
   */
  private evaluateUnary(op: UnaryOperator, operand: TagValue): TagValue {
    if (op === 'NOT') {
      return !this.toBoolean(operand);
    }
    if (op === 'NEG') {
      return -this.toNumber(operand);
    }

    throw new Error(`Unknown unary operator: ${op}`);
  }

  /**
   * Convert value to boolean
   */
  private toBoolean(value: TagValue): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      return value.length > 0;
    }
    return false;
  }

  /**
   * Convert value to number
   */
  private toNumber(value: TagValue): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
}
