/**
 * Full Ladder Diagram Model
 *
 * Enhanced model supporting all IEC 61131-3 ladder instructions:
 * - Contacts (NO, NC, P, N)
 * - Coils (OTE, OTL, OTU)
 * - Function blocks (Timers, Counters, Latches)
 * - Comparisons (EQ, NE, LT, GT, LE, GE)
 * - Math operations (ADD, SUB, MUL, DIV, MOD)
 * - Logical operations (AND, OR, XOR, NOT)
 * - Branches (parallel paths)
 *
 * Grid-based positioning for visual editor.
 */

// ============================================================================
// Basic Types
// ============================================================================

export type ContactType = 'NO' | 'NC' | 'P' | 'N';
// NO: Normally Open (XIC - Examine If Closed)
// NC: Normally Closed (XIO - Examine If Open)
// P: Positive Edge (rising edge detection)
// N: Negative Edge (falling edge detection)

export type CoilType = 'OTE' | 'OTL' | 'OTU';
// OTE: Output Energize (standard coil)
// OTL: Output Latch (set and hold)
// OTU: Output Unlatch (reset latched output)

export type ComparisonType = 'EQ' | 'NE' | 'LT' | 'GT' | 'LE' | 'GE';
// EQ: Equal (=)
// NE: Not Equal (≠)
// LT: Less Than (<)
// GT: Greater Than (>)
// LE: Less or Equal (≤)
// GE: Greater or Equal (≥)

export type MathType = 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MOD';
// ADD: Addition (+)
// SUB: Subtraction (-)
// MUL: Multiplication (×)
// DIV: Division (÷)
// MOD: Modulo (%)

export type LogicalType = 'AND' | 'OR' | 'XOR' | 'NOT';

export type FunctionBlockType = 'TON' | 'TOF' | 'TP' | 'CTU' | 'CTD' | 'CTUD' | 'SR' | 'RS';

// ============================================================================
// Grid Position
// ============================================================================

/**
 * Position in the ladder grid
 * - row: Vertical position (0 = top of rung)
 * - col: Horizontal position (0 = left power rail)
 */
export interface GridPosition {
  row: number;
  col: number;
}

// ============================================================================
// Operand (tag reference or literal value)
// ============================================================================

export interface LadderOperand {
  type: 'tag' | 'literal';
  value: string | number | boolean; // Tag name or literal value
  dataType?: 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'TIME';
}

// ============================================================================
// Ladder Elements
// ============================================================================

/**
 * Contact element (NO, NC, P, N)
 */
export interface LadderContact {
  elementType: 'contact';
  id: string;
  contactType: ContactType;
  operand: LadderOperand;
  position: GridPosition;
}

/**
 * Coil element (OTE, OTL, OTU)
 */
export interface LadderCoil {
  elementType: 'coil';
  id: string;
  coilType: CoilType;
  operand: LadderOperand;
  position: GridPosition;
}

/**
 * Comparison instruction (EQ, NE, LT, GT, LE, GE)
 */
export interface LadderComparison {
  elementType: 'comparison';
  id: string;
  comparisonType: ComparisonType;
  operandA: LadderOperand;
  operandB: LadderOperand;
  position: GridPosition;
}

/**
 * Math operation (ADD, SUB, MUL, DIV, MOD)
 */
export interface LadderMath {
  elementType: 'math';
  id: string;
  mathType: MathType;
  operandA: LadderOperand;
  operandB: LadderOperand;
  result: LadderOperand;
  position: GridPosition;
  enableInput?: boolean; // Execute only when rung is true
}

/**
 * Logical operation (AND, OR, XOR, NOT)
 */
export interface LadderLogical {
  elementType: 'logical';
  id: string;
  logicalType: LogicalType;
  operands: LadderOperand[]; // 1 operand for NOT, 2+ for AND/OR/XOR
  result: LadderOperand;
  position: GridPosition;
  enableInput?: boolean;
}

/**
 * Function Block (Timer, Counter, Latch)
 */
export interface LadderFunctionBlock {
  elementType: 'functionBlock';
  id: string;
  blockType: FunctionBlockType;
  instance: LadderOperand; // Instance tag (stores state)
  inputs: { [pin: string]: LadderOperand }; // Pin-to-operand mapping
  outputs: { [pin: string]: LadderOperand }; // Pin-to-operand mapping
  position: GridPosition;
  size: { rows: number; cols: number }; // Visual size in grid
}

/**
 * Branch element (marks start/end of parallel paths)
 */
export interface LadderBranch {
  elementType: 'branch';
  id: string;
  branchType: 'start' | 'end';
  position: GridPosition;
  branchCount?: number; // Number of parallel branches (for start)
}

/**
 * Short circuit connection (connects branches)
 */
export interface LadderWire {
  elementType: 'wire';
  id: string;
  wireType: 'horizontal' | 'vertical';
  position: GridPosition;
  length: number; // Span in grid cells
}

// ============================================================================
// Union Type for All Elements
// ============================================================================

export type LadderElement =
  | LadderContact
  | LadderCoil
  | LadderComparison
  | LadderMath
  | LadderLogical
  | LadderFunctionBlock
  | LadderBranch
  | LadderWire;

// ============================================================================
// Rung Structure
// ============================================================================

/**
 * A single rung in the ladder diagram
 * Contains a 2D grid of elements
 */
export interface LadderRung {
  id: string;
  comment?: string;
  elements: LadderElement[];
  gridSize: { rows: number; cols: number }; // Bounding size
}

// ============================================================================
// Network and Program
// ============================================================================

export interface LadderNetwork {
  id: string;
  title: string;
  comment?: string;
  rungs: LadderRung[];
}

export interface LadderProgramFull {
  version: string;
  networks: LadderNetwork[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a tag operand
 */
export function createTagOperand(tagName: string, dataType?: string): LadderOperand {
  return {
    type: 'tag',
    value: tagName,
    dataType: dataType as any,
  };
}

/**
 * Create a literal operand
 */
export function createLiteralOperand(value: number | boolean, dataType?: string): LadderOperand {
  return {
    type: 'literal',
    value,
    dataType: dataType as any,
  };
}

/**
 * Create a contact element
 */
export function createContact(
  id: string,
  contactType: ContactType,
  operand: LadderOperand,
  position: GridPosition
): LadderContact {
  return {
    elementType: 'contact',
    id,
    contactType,
    operand,
    position,
  };
}

/**
 * Create a coil element
 */
export function createCoil(
  id: string,
  coilType: CoilType,
  operand: LadderOperand,
  position: GridPosition
): LadderCoil {
  return {
    elementType: 'coil',
    id,
    coilType,
    operand,
    position,
  };
}

/**
 * Create a function block
 */
export function createFunctionBlock(
  id: string,
  blockType: FunctionBlockType,
  instance: LadderOperand,
  inputs: { [pin: string]: LadderOperand },
  outputs: { [pin: string]: LadderOperand },
  position: GridPosition
): LadderFunctionBlock {
  // Determine size based on block type
  let size = { rows: 3, cols: 3 }; // Default size

  if (blockType === 'TON' || blockType === 'TOF' || blockType === 'TP') {
    size = { rows: 3, cols: 3 }; // Timer blocks
  } else if (blockType === 'CTU' || blockType === 'CTD') {
    size = { rows: 3, cols: 3 }; // Counter blocks
  } else if (blockType === 'CTUD') {
    size = { rows: 4, cols: 3 }; // Larger counter
  } else if (blockType === 'SR' || blockType === 'RS') {
    size = { rows: 2, cols: 3 }; // Latch blocks
  }

  return {
    elementType: 'functionBlock',
    id,
    blockType,
    instance,
    inputs,
    outputs,
    position,
    size,
  };
}

/**
 * Create a comparison element
 */
export function createComparison(
  id: string,
  comparisonType: ComparisonType,
  operandA: LadderOperand,
  operandB: LadderOperand,
  position: GridPosition
): LadderComparison {
  return {
    elementType: 'comparison',
    id,
    comparisonType,
    operandA,
    operandB,
    position,
  };
}

/**
 * Create a branch element
 */
export function createBranch(
  id: string,
  branchType: 'start' | 'end',
  position: GridPosition,
  branchCount?: number
): LadderBranch {
  return {
    elementType: 'branch',
    id,
    branchType,
    position,
    branchCount,
  };
}

/**
 * Create a wire element
 */
export function createWire(
  id: string,
  wireType: 'horizontal' | 'vertical',
  position: GridPosition,
  length: number
): LadderWire {
  return {
    elementType: 'wire',
    id,
    wireType,
    position,
    length,
  };
}

/**
 * Create an empty rung
 */
export function createEmptyRung(id: string): LadderRung {
  return {
    id,
    elements: [],
    gridSize: { rows: 1, cols: 10 }, // Default grid size
  };
}

/**
 * Create an empty network
 */
export function createEmptyNetwork(id: string, title: string): LadderNetwork {
  return {
    id,
    title,
    rungs: [createEmptyRung(`${id}_Rung_1`)],
  };
}

/**
 * Create an empty ladder program
 */
export function createEmptyLadderProgram(): LadderProgramFull {
  return {
    version: '1.0',
    networks: [createEmptyNetwork('Network_1', 'Network 1')],
  };
}

/**
 * Generate unique element ID
 */
export function generateElementId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
