/**
 * IR to Ladder Decompiler
 *
 * Converts intermediate representation (IR) programs into
 * ladder diagram format for visual editing.
 *
 * Handles:
 * - Assignment statements → Contacts + Coils
 * - Call statements → Function blocks
 * - Binary expressions → Comparison/Math/Logical operations
 * - Complex logic → Branches and series/parallel circuits
 */

import {
  Statement,
  Expression,
  AssignmentStatement,
  CallStatement,
  BinaryExpression,
  UnaryExpression,
  OperandExpression,
  LiteralExpression,
  Network as IRNetwork,
  Program as IRProgram,
} from '../ir/types';

import {
  LadderProgramFull,
  LadderNetwork,
  LadderRung,
  LadderElement,
  LadderOperand,
  ContactType,
  GridPosition,
  createTagOperand,
  createLiteralOperand,
  createContact,
  createCoil,
  createFunctionBlock,
  createComparison,
  createEmptyRung,
  generateElementId,
  ComparisonType,
} from './LadderModelFull';

// ============================================================================
// Main Decompiler Class
// ============================================================================

export class IRToLadderDecompiler {
  private currentCol = 0; // Current column in grid
  private currentRow = 0; // Current row in grid

  /**
   * Decompile entire IR program to ladder format
   */
  decompileProgram(irProgram: IRProgram): LadderProgramFull {
    const networks: LadderNetwork[] = [];

    for (const ob of irProgram.organization_blocks) {
      for (const irNetwork of ob.networks) {
        const ladderNetwork = this.decompileNetwork(irNetwork);
        networks.push(ladderNetwork);
      }
    }

    return {
      version: irProgram.version,
      networks,
    };
  }

  /**
   * Decompile a single network
   */
  private decompileNetwork(irNetwork: IRNetwork): LadderNetwork {
    const rungs: LadderRung[] = [];

    for (const statement of irNetwork.statements) {
      const rung = this.decompileStatement(statement);
      if (rung) {
        rungs.push(rung);
      }
    }

    return {
      id: irNetwork.id,
      title: irNetwork.title,
      comment: irNetwork.comment,
      rungs,
    };
  }

  /**
   * Decompile a statement into a ladder rung
   */
  private decompileStatement(statement: Statement): LadderRung | null {
    this.currentCol = 0;
    this.currentRow = 0;

    const rung = createEmptyRung(statement.id);

    switch (statement.type) {
      case 'assignment':
        this.decompileAssignment(statement as AssignmentStatement, rung);
        break;

      case 'call':
        this.decompileCall(statement as CallStatement, rung);
        break;

      case 'if':
        // TODO: Handle IF statements (conditional rungs)
        // For now, skip IF statements
        return null;

      case 'comment':
        // Comments don't generate rungs
        return null;
    }

    return rung;
  }

  /**
   * Decompile assignment statement: target := expression
   *
   * Patterns:
   * - tag := TRUE/FALSE → Simple coil
   * - tag := other_tag → Contact → Coil
   * - tag := NOT(other_tag) → NC Contact → Coil
   * - tag := A AND B → Contacts in series → Coil
   * - tag := A OR B → Contacts in parallel → Coil (TODO: branches)
   * - tag := comparison → Comparison block → Coil
   */
  private decompileAssignment(stmt: AssignmentStatement, rung: LadderRung): void {
    const targetOperand = this.convertOperandToLadder(stmt.target);

    // Analyze expression to determine ladder structure
    const elements = this.decompileExpression(stmt.expression);

    // Add all elements to rung
    rung.elements.push(...elements);

    // Add coil at the end (right side of rung)
    const coilPosition: GridPosition = { row: 0, col: this.currentCol };
    const coil = createCoil(generateElementId('coil'), 'OTE', targetOperand, coilPosition);
    rung.elements.push(coil);

    this.currentCol++;

    // Update rung grid size
    rung.gridSize = { rows: this.currentRow + 1, cols: this.currentCol };
  }

  /**
   * Decompile call statement (function block)
   */
  private decompileCall(stmt: CallStatement, rung: LadderRung): void {
    const { function_name, instance, inputs, outputs } = stmt;

    if (!instance) {
      console.warn(`Call statement ${function_name} missing instance`);
      return;
    }

    // Convert instance operand
    const instanceOperand = this.convertOperandToLadder(instance);

    // Convert input operands
    const inputOperands: { [pin: string]: LadderOperand } = {};
    for (const [pin, expr] of Object.entries(inputs)) {
      inputOperands[pin] = this.expressionToOperand(expr);
    }

    // Convert output operands
    const outputOperands: { [pin: string]: LadderOperand } = {};
    for (const [pin, operand] of Object.entries(outputs)) {
      outputOperands[pin] = this.convertOperandToLadder(operand);
    }

    // Create function block element
    const position: GridPosition = { row: 0, col: this.currentCol };
    const block = createFunctionBlock(
      stmt.id,
      function_name as any,
      instanceOperand,
      inputOperands,
      outputOperands,
      position
    );

    rung.elements.push(block);
    this.currentCol += block.size.cols;

    // Update rung grid size
    rung.gridSize = { rows: Math.max(this.currentRow + 1, block.size.rows), cols: this.currentCol };
  }

  /**
   * Decompile expression into ladder elements
   * Returns array of elements (contacts, comparisons, etc.)
   */
  private decompileExpression(expr: Expression): LadderElement[] {
    const elements: LadderElement[] = [];

    switch (expr.expr_type) {
      case 'operand': {
        // Single operand → Contact
        const operandExpr = expr as OperandExpression;
        const operand = this.convertOperandToLadder(operandExpr.operand);
        const position: GridPosition = { row: 0, col: this.currentCol };

        // Determine contact type based on edge detection
        let contactType: ContactType = 'NO';
        if (operandExpr.operand.edge === 'rising') {
          contactType = 'P';
        } else if (operandExpr.operand.edge === 'falling') {
          contactType = 'N';
        }

        const contact = createContact(generateElementId('contact'), contactType, operand, position);
        elements.push(contact);
        this.currentCol++;
        break;
      }

      case 'literal': {
        // Literal value (TRUE/FALSE, number)
        // Usually doesn't generate a contact
        // Skip for now
        break;
      }

      case 'unary': {
        const unaryExpr = expr as UnaryExpression;
        if (unaryExpr.operator === 'NOT') {
          // NOT(operand) → NC Contact
          if (unaryExpr.operand.expr_type === 'operand') {
            const operandExpr = unaryExpr.operand as OperandExpression;
            const operand = this.convertOperandToLadder(operandExpr.operand);
            const position: GridPosition = { row: 0, col: this.currentCol };
            const contact = createContact(generateElementId('contact'), 'NC', operand, position);
            elements.push(contact);
            this.currentCol++;
          }
        }
        break;
      }

      case 'binary': {
        const binaryExpr = expr as BinaryExpression;

        // Check if it's a comparison
        if (this.isComparisonOperator(binaryExpr.operator)) {
          const comparison = this.decompileComparison(binaryExpr);
          elements.push(comparison);
        }
        // Check if it's a logical operation
        else if (this.isLogicalOperator(binaryExpr.operator)) {
          const logicElements = this.decompileLogical(binaryExpr);
          elements.push(...logicElements);
        }
        break;
      }

      case 'call': {
        // Function call in expression (rare in ladder logic)
        // Skip for now
        break;
      }
    }

    return elements;
  }

  /**
   * Decompile comparison expression
   */
  private decompileComparison(expr: BinaryExpression): LadderElement {
    const operandA = this.expressionToOperand(expr.left);
    const operandB = this.expressionToOperand(expr.right);
    const position: GridPosition = { row: 0, col: this.currentCol };

    const comparisonType = this.mapOperatorToComparison(expr.operator);
    const comparison = createComparison(
      generateElementId('comparison'),
      comparisonType,
      operandA,
      operandB,
      position
    );

    this.currentCol += 2; // Comparisons take 2 columns
    return comparison;
  }

  /**
   * Decompile logical expression (AND/OR)
   */
  private decompileLogical(expr: BinaryExpression): LadderElement[] {
    const elements: LadderElement[] = [];

    if (expr.operator === 'AND') {
      // AND → Series contacts
      const leftElements = this.decompileExpression(expr.left);
      const rightElements = this.decompileExpression(expr.right);
      elements.push(...leftElements, ...rightElements);
    } else if (expr.operator === 'OR') {
      // OR → Parallel contacts (branches)
      // TODO: Implement branch logic
      // For now, just decompile left side
      const leftElements = this.decompileExpression(expr.left);
      elements.push(...leftElements);
    }

    return elements;
  }

  /**
   * Convert IR operand to ladder operand
   */
  private convertOperandToLadder(operand: any): LadderOperand {
    if (operand.tag) {
      return createTagOperand(operand.tag);
    } else if (operand.address) {
      return createTagOperand(operand.address);
    }
    return createTagOperand('unknown');
  }

  /**
   * Convert expression to operand (for function block pins, etc.)
   */
  private expressionToOperand(expr: Expression): LadderOperand {
    switch (expr.expr_type) {
      case 'operand': {
        const operandExpr = expr as OperandExpression;
        return this.convertOperandToLadder(operandExpr.operand);
      }

      case 'literal': {
        const literalExpr = expr as LiteralExpression;
        return createLiteralOperand(literalExpr.value as any, literalExpr.data_type as any);
      }

      default:
        return createLiteralOperand(0, 'INT');
    }
  }

  /**
   * Check if operator is a comparison
   */
  private isComparisonOperator(op: string): boolean {
    return ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE'].includes(op);
  }

  /**
   * Check if operator is logical
   */
  private isLogicalOperator(op: string): boolean {
    return ['AND', 'OR', 'XOR'].includes(op);
  }

  /**
   * Map IR operator to comparison type
   */
  private mapOperatorToComparison(op: string): ComparisonType {
    switch (op) {
      case 'EQ':
        return 'EQ';
      case 'NE':
        return 'NE';
      case 'LT':
        return 'LT';
      case 'GT':
        return 'GT';
      case 'LE':
        return 'LE';
      case 'GE':
        return 'GE';
      default:
        return 'EQ';
    }
  }
}

/**
 * Convenience function to decompile IR program
 */
export function decompileIRToLadder(irProgram: IRProgram): LadderProgramFull {
  const decompiler = new IRToLadderDecompiler();
  return decompiler.decompileProgram(irProgram);
}
