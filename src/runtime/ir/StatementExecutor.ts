/**
 * IR Statement Executor
 *
 * Executes IR statements (assignments, calls, if statements).
 * Writes results to pending buffer (commits at end of scan).
 */

import { Statement, Operand, TimerInstance, CounterInstance, LatchInstance, CallStatement } from '../../core/ir/types';
import { TagStore, TagValue } from './TagStore';
import { ExpressionEvaluator } from './ExpressionEvaluator';
import { executeTON, executeTOF, executeTP } from './instructions/timers';
import { executeCTU, executeCTD, executeCTUD } from './instructions/counters';
import { executeSR, executeRS } from './instructions/latches';

export class StatementExecutor {
  private expressionEvaluator: ExpressionEvaluator;
  private currentTime: number = Date.now();

  constructor(private tagStore: TagStore) {
    this.expressionEvaluator = new ExpressionEvaluator(tagStore);
  }

  /**
   * Set the current timestamp for timer execution
   * Should be called at the start of each scan cycle
   */
  setCurrentTime(time: number): void {
    this.currentTime = time;
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
   * Supports: TON, TOF, TP timers
   */
  private executeCall(statement: CallStatement): void {
    const { function_name, instance, inputs, outputs } = statement;

    // Get instance tag ID (where timer state is stored)
    if (!instance) {
      throw new Error(`Call statement ${function_name} requires an instance operand`);
    }
    const instanceTagId = this.resolveOperandToTagId(instance);

    // Get current instance (timer, counter, or latch)
    const currentInstance = this.tagStore.readFromPendingOrSnapshot(instanceTagId) as
      | TimerInstance
      | CounterInstance
      | LatchInstance
      | undefined;

    // Execute function based on function name
    let updatedInstance: TimerInstance | CounterInstance | LatchInstance | undefined;

    switch (function_name) {
      case 'TON': {
        // Evaluate inputs
        const IN = this.toBoolean(this.expressionEvaluator.evaluate(inputs['IN']));
        const PT = this.toNumber(this.expressionEvaluator.evaluate(inputs['PT']));

        // Execute timer
        updatedInstance = executeTON(currentInstance, IN, PT, this.currentTime);
        break;
      }

      case 'TOF': {
        // Evaluate inputs
        const IN = this.toBoolean(this.expressionEvaluator.evaluate(inputs['IN']));
        const PT = this.toNumber(this.expressionEvaluator.evaluate(inputs['PT']));

        // Execute timer
        updatedInstance = executeTOF(currentInstance, IN, PT, this.currentTime);
        break;
      }

      case 'TP': {
        // Evaluate inputs
        const IN = this.toBoolean(this.expressionEvaluator.evaluate(inputs['IN']));
        const PT = this.toNumber(this.expressionEvaluator.evaluate(inputs['PT']));

        // Execute timer
        updatedInstance = executeTP(currentInstance as TimerInstance, IN, PT, this.currentTime);
        break;
      }

      case 'CTU': {
        // Evaluate inputs
        const CU = this.toBoolean(this.expressionEvaluator.evaluate(inputs['CU']));
        const R = this.toBoolean(this.expressionEvaluator.evaluate(inputs['R']));
        const PV = this.toNumber(this.expressionEvaluator.evaluate(inputs['PV']));

        // Execute counter
        updatedInstance = executeCTU(currentInstance as CounterInstance, CU, R, PV);
        break;
      }

      case 'CTD': {
        // Evaluate inputs
        const CD = this.toBoolean(this.expressionEvaluator.evaluate(inputs['CD']));
        const LD = this.toBoolean(this.expressionEvaluator.evaluate(inputs['LD']));
        const PV = this.toNumber(this.expressionEvaluator.evaluate(inputs['PV']));

        // Execute counter
        updatedInstance = executeCTD(currentInstance as CounterInstance, CD, LD, PV);
        break;
      }

      case 'CTUD': {
        // Evaluate inputs
        const CU = this.toBoolean(this.expressionEvaluator.evaluate(inputs['CU']));
        const CD = this.toBoolean(this.expressionEvaluator.evaluate(inputs['CD']));
        const R = this.toBoolean(this.expressionEvaluator.evaluate(inputs['R']));
        const LD = this.toBoolean(this.expressionEvaluator.evaluate(inputs['LD']));
        const PV = this.toNumber(this.expressionEvaluator.evaluate(inputs['PV']));

        // Execute counter
        updatedInstance = executeCTUD(currentInstance as CounterInstance, CU, CD, R, LD, PV);
        break;
      }

      case 'SR': {
        // Evaluate inputs
        const S = this.toBoolean(this.expressionEvaluator.evaluate(inputs['S']));
        const R = this.toBoolean(this.expressionEvaluator.evaluate(inputs['R']));

        // Execute latch
        updatedInstance = executeSR(currentInstance as LatchInstance, S, R);
        break;
      }

      case 'RS': {
        // Evaluate inputs
        const S = this.toBoolean(this.expressionEvaluator.evaluate(inputs['S']));
        const R = this.toBoolean(this.expressionEvaluator.evaluate(inputs['R']));

        // Execute latch
        updatedInstance = executeRS(currentInstance as LatchInstance, S, R);
        break;
      }

      default:
        throw new Error(`Unknown function: ${function_name}`);
    }

    // Write updated instance back to pending
    if (updatedInstance) {
      this.tagStore.writeToPending(instanceTagId, updatedInstance);
    }

    // Write outputs to their respective tags
    // Timer outputs
    if (outputs['Q']) {
      const outputTagId = this.resolveOperandToTagId(outputs['Q']);
      this.tagStore.writeToPending(outputTagId, (updatedInstance as any)?.Q || false);
    }
    if (outputs['ET']) {
      const outputTagId = this.resolveOperandToTagId(outputs['ET']);
      this.tagStore.writeToPending(outputTagId, (updatedInstance as any)?.ET || 0);
    }

    // Counter outputs (CTU/CTD use Q, CTUD uses QU/QD)
    if (outputs['QU']) {
      const outputTagId = this.resolveOperandToTagId(outputs['QU']);
      this.tagStore.writeToPending(outputTagId, (updatedInstance as any)?.QU || false);
    }
    if (outputs['QD']) {
      const outputTagId = this.resolveOperandToTagId(outputs['QD']);
      this.tagStore.writeToPending(outputTagId, (updatedInstance as any)?.QD || false);
    }
    if (outputs['CV']) {
      const outputTagId = this.resolveOperandToTagId(outputs['CV']);
      this.tagStore.writeToPending(outputTagId, (updatedInstance as any)?.CV || 0);
    }
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
