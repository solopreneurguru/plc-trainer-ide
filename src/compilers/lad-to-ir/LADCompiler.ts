/**
 * LAD → IR Compiler
 *
 * Translates Ladder Logic (LAD) diagrams into Intermediate Representation (IR).
 *
 * Compilation Rules:
 * 1. Each rung compiles to one IR assignment statement
 * 2. Contacts in series → AND expressions
 * 3. Contacts in parallel (branches) → OR expressions
 * 4. NC contacts → NOT(operand)
 * 5. Coil determines the assignment target
 */

import {
  LADProgram,
  LADNetwork,
  LADRung,
  LADElement,
  LADContact,
  LADCoil,
  LADBranch,
} from '../../core/lad/types';
import {
  Program,
  Network,
  Statement,
  AssignmentStatement,
  Expression,
  Operand,
} from '../../core/ir/types';

export class LADCompiler {
  /**
   * Compile LAD program to IR program
   */
  compile(ladProgram: LADProgram): Program {
    // Create IR program structure
    const irProgram: Program = {
      version: ladProgram.version,
      organization_blocks: [
        {
          id: 'OB1',
          name: 'Main',
          type: 'cyclic',
          networks: ladProgram.networks.map((network, index) =>
            this.compileNetwork(network, index + 1)
          ),
        },
      ],
      functions: [],
      function_blocks: [],
    };

    return irProgram;
  }

  /**
   * Compile LAD network to IR network
   */
  private compileNetwork(ladNetwork: LADNetwork, networkNumber: number): Network {
    const irStatements: Statement[] = [];

    // Compile each rung to an IR statement
    for (let rungIndex = 0; rungIndex < ladNetwork.rungs.length; rungIndex++) {
      const rung = ladNetwork.rungs[rungIndex];
      const statement = this.compileRung(rung, rungIndex + 1);
      if (statement) {
        irStatements.push(statement);
      }
    }

    return {
      id: ladNetwork.id,
      title: ladNetwork.title || `Network ${networkNumber}`,
      comment: ladNetwork.comment || '',
      statements: irStatements,
    };
  }

  /**
   * Compile LAD rung to IR assignment statement
   *
   * A rung is: [contacts...] → [coil]
   * This compiles to: coil := (contacts AND-ed/OR-ed together)
   */
  private compileRung(rung: LADRung, rungNumber: number): AssignmentStatement | null {
    if (rung.elements.length === 0) {
      return null; // Empty rung, skip
    }

    // Find the coil (last element should be a coil)
    const coilIndex = this.findCoilIndex(rung.elements);
    if (coilIndex === -1) {
      throw new Error(`Rung ${rung.id} has no coil`);
    }

    const coilElement = rung.elements[coilIndex] as LADCoil;
    const contactElements = rung.elements.slice(0, coilIndex);

    // Build expression from contacts (everything before the coil)
    const expression = this.compileElementsToExpression(contactElements);

    // Create assignment statement
    const target: Operand = {
      tag: coilElement.operand,
    };

    const statement: AssignmentStatement = {
      type: 'assignment',
      id: `${rung.id}_stmt`,
      target,
      expression,
      layout_hints: {
        language: 'LAD',
        lad: {
          rung_number: rungNumber,
        },
      },
    };

    return statement;
  }

  /**
   * Find the index of the coil in the rung elements
   */
  private findCoilIndex(elements: LADElement[]): number {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type === 'coil') {
        return i;
      }
    }
    return -1;
  }

  /**
   * Compile a list of elements to an expression
   * Elements in series are AND-ed together
   */
  private compileElementsToExpression(elements: LADElement[]): Expression {
    if (elements.length === 0) {
      // No contacts → always TRUE (literal)
      return {
        expr_type: 'literal',
        value: true,
        data_type: 'BOOL',
      };
    }

    if (elements.length === 1) {
      return this.compileElement(elements[0]);
    }

    // Multiple elements in series → AND them together
    let expression = this.compileElement(elements[0]);
    for (let i = 1; i < elements.length; i++) {
      const rightExpr = this.compileElement(elements[i]);
      expression = {
        expr_type: 'binary',
        operator: 'AND',
        left: expression,
        right: rightExpr,
      };
    }

    return expression;
  }

  /**
   * Compile a single LAD element to an expression
   */
  private compileElement(element: LADElement): Expression {
    switch (element.type) {
      case 'contact':
        return this.compileContact(element);

      case 'branch':
        return this.compileBranch(element);

      case 'coil':
        throw new Error('Coil cannot be part of expression logic');

      default:
        throw new Error(`Unknown element type: ${(element as any).type}`);
    }
  }

  /**
   * Compile a contact to an operand expression
   * NO contact → operand
   * NC contact → NOT(operand)
   */
  private compileContact(contact: LADContact): Expression {
    const operand: Operand = {
      tag: contact.operand,
    };

    const operandExpr: Expression = {
      expr_type: 'operand',
      operand,
    };

    // NC (normally closed) → invert with NOT
    if (contact.contact_type === 'NC') {
      return {
        expr_type: 'unary',
        operator: 'NOT',
        operand: operandExpr,
      };
    }

    // NO (normally open) → direct operand
    return operandExpr;
  }

  /**
   * Compile a branch to an OR expression
   * Each branch path is AND-ed, then paths are OR-ed together
   *
   * Example:
   *   --+--[A]--
   *     |
   *     +--[B]--[C]--
   *
   * Compiles to: A OR (B AND C)
   */
  private compileBranch(branch: LADBranch): Expression {
    if (branch.branches.length === 0) {
      throw new Error('Branch must have at least one path');
    }

    if (branch.branches.length === 1) {
      // Single path → just compile elements
      return this.compileElementsToExpression(branch.branches[0]);
    }

    // Multiple paths → OR them together
    let expression = this.compileElementsToExpression(branch.branches[0]);
    for (let i = 1; i < branch.branches.length; i++) {
      const pathExpr = this.compileElementsToExpression(branch.branches[i]);
      expression = {
        expr_type: 'binary',
        operator: 'OR',
        left: expression,
        right: pathExpr,
      };
    }

    return expression;
  }
}

/**
 * Convenience function to compile LAD to IR
 */
export function compileLADToIR(ladProgram: LADProgram): Program {
  const compiler = new LADCompiler();
  return compiler.compile(ladProgram);
}
