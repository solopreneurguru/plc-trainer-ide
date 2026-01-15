/**
 * IR Statement Executor
 *
 * Executes IR statements (assignments, calls, if statements).
 * Writes results to pending buffer (commits at end of scan).
 */

import { Statement, Operand } from '../../core/ir/types';
import { TagStore, TagValue } from './TagStore';
import { ExpressionEvaluator } from './ExpressionEvaluator';

export class StatementExecutor {
  private expressionEvaluator: ExpressionEvaluator;

  constructor(private tagStore: TagStore) {
    this.expressionEvaluator = new ExpressionEvaluator(tagStore);
  }

  /**
   * Execute a single statement
   * Writes to pending buffer (not committed until end of scan)
   */
  execute(statement: Statement): void {
    switch (statement.type) {
      case 'assignment':
        this.executeAssignment(statement);
        break;

      case 'call':
        this.executeCall(statement);
        break;

      case 'if':
        this.executeIf(statement);
        break;

      case 'comment':
        // Comments have no runtime effect
        break;

      default:
        throw new Error(`Unknown statement type: ${(statement as any).type}`);
    }
  }

  /**
   * Execute assignment statement: target := expression
   * Evaluates expression and writes to pending buffer
   */
  private executeAssignment(statement: any): void {
    // Evaluate the expression (right-hand side)
    const value = this.expressionEvaluator.evaluate(statement.expression);

    // Resolve target operand to tag ID
    const targetTagId = this.resolveOperandToTagId(statement.target);

    // Write to PENDING buffer (not committed yet)
    // Last write wins - later statements overwrite earlier ones
    this.tagStore.writeToPending(targetTagId, value);
  }

  /**
   * Execute call statement (function block calls)
   * Not yet implemented - placeholder for future
   */
  private executeCall(statement: any): void {
    throw new Error(`Function calls not yet implemented: ${statement.function_name}`);
  }

  /**
   * Execute if statement (conditional logic)
   */
  private executeIf(statement: any): void {
    // Evaluate condition
    const condition = this.expressionEvaluator.evaluate(statement.condition);
    const conditionTrue = this.toBoolean(condition);

    if (conditionTrue) {
      // Execute THEN block
      for (const stmt of statement.then_statements) {
        this.execute(stmt);
      }
    } else if (statement.elsif_blocks) {
      // Check ELSIF blocks
      for (const elsif of statement.elsif_blocks) {
        const elsifCondition = this.expressionEvaluator.evaluate(elsif.condition);
        if (this.toBoolean(elsifCondition)) {
          for (const stmt of elsif.statements) {
            this.execute(stmt);
          }
          return; // Exit after first matching elsif
        }
      }

      // Execute ELSE block if no elsif matched
      if (statement.else_statements) {
        for (const stmt of statement.else_statements) {
          this.execute(stmt);
        }
      }
    } else if (statement.else_statements) {
      // Execute ELSE block
      for (const stmt of statement.else_statements) {
        this.execute(stmt);
      }
    }
  }

  /**
   * Resolve operand to tag ID
   * Handles both symbolic tags and direct addresses
   */
  private resolveOperandToTagId(operand: Operand): string {
    if (operand.tag) {
      return operand.tag;
    } else if (operand.address) {
      return TagStore.addressToTagId(operand.address);
    } else {
      throw new Error('Operand must have either tag or address');
    }
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
    return false;
  }
}
