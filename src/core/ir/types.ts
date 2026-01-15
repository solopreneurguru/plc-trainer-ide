import { z } from 'zod';

// ============================================================================
// Data Types
// ============================================================================

export const DataTypeSchema = z.union([
  z.literal('BOOL'),
  z.literal('INT'),
  z.literal('DINT'),
  z.literal('REAL'),
  z.literal('TIME'),
  z.literal('TIMER'),
  z.literal('COUNTER'),
  z.object({ struct_type: z.string() }),
]);

export type DataType = z.infer<typeof DataTypeSchema>;

// ============================================================================
// Operand
// ============================================================================

export const EdgeTypeSchema = z.enum(['rising', 'falling']);
export type EdgeType = z.infer<typeof EdgeTypeSchema>;

export const OperandSchema = z.object({
  address: z.string().optional(),
  tag: z.string().optional(),
  member_path: z.array(z.string()).optional(),
  edge: EdgeTypeSchema.optional(),
});

export type Operand = z.infer<typeof OperandSchema>;

// ============================================================================
// Expressions
// ============================================================================

export const BinaryOperatorSchema = z.enum([
  // Boolean
  'AND',
  'OR',
  'XOR',
  // Comparison
  'EQ',
  'NE',
  'LT',
  'GT',
  'LE',
  'GE',
  // Arithmetic
  'ADD',
  'SUB',
  'MUL',
  'DIV',
  'MOD',
]);

export type BinaryOperator = z.infer<typeof BinaryOperatorSchema>;

export const UnaryOperatorSchema = z.enum(['NOT', 'NEG']);
export type UnaryOperator = z.infer<typeof UnaryOperatorSchema>;

// Forward declarations for recursive types
export type Expression =
  | OperandExpression
  | BinaryExpression
  | UnaryExpression
  | LiteralExpression
  | CallExpression;

export interface OperandExpression {
  expr_type: 'operand';
  operand: Operand;
}

export interface BinaryExpression {
  expr_type: 'binary';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  expr_type: 'unary';
  operator: UnaryOperator;
  operand: Expression;
}

export interface LiteralExpression {
  expr_type: 'literal';
  value: boolean | number | string;
  data_type: DataType;
}

export interface CallExpression {
  expr_type: 'call';
  function_name: string;
  arguments: Expression[];
}

// Zod schemas for expressions (non-recursive approximation)
export const OperandExpressionSchema: z.ZodType<OperandExpression> = z.object({
  expr_type: z.literal('operand'),
  operand: OperandSchema,
});

export const LiteralExpressionSchema: z.ZodType<LiteralExpression> = z.object({
  expr_type: z.literal('literal'),
  value: z.union([z.boolean(), z.number(), z.string()]),
  data_type: DataTypeSchema,
});

// For recursive schemas, we use z.lazy()
export const ExpressionSchema: z.ZodType<Expression> = z.lazy(() =>
  z.union([
    OperandExpressionSchema,
    z.object({
      expr_type: z.literal('binary'),
      operator: BinaryOperatorSchema,
      left: ExpressionSchema,
      right: ExpressionSchema,
    }) as z.ZodType<BinaryExpression>,
    z.object({
      expr_type: z.literal('unary'),
      operator: UnaryOperatorSchema,
      operand: ExpressionSchema,
    }) as z.ZodType<UnaryExpression>,
    LiteralExpressionSchema,
    z.object({
      expr_type: z.literal('call'),
      function_name: z.string(),
      arguments: z.array(ExpressionSchema),
    }) as z.ZodType<CallExpression>,
  ])
);

// ============================================================================
// Statements
// ============================================================================

export interface LayoutHints {
  language?: 'LAD' | 'FBD' | 'SCL';
  lad?: {
    rung_number?: number;
    column?: number;
    row?: number;
    is_branch_start?: boolean;
    is_branch_end?: boolean;
  };
  fbd?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}

export const LayoutHintsSchema: z.ZodType<LayoutHints> = z.object({
  language: z.enum(['LAD', 'FBD', 'SCL']).optional(),
  lad: z
    .object({
      rung_number: z.number().optional(),
      column: z.number().optional(),
      row: z.number().optional(),
      is_branch_start: z.boolean().optional(),
      is_branch_end: z.boolean().optional(),
    })
    .optional(),
  fbd: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
});

export type Statement =
  | AssignmentStatement
  | CallStatement
  | IfStatement
  | CommentStatement;

export interface AssignmentStatement {
  type: 'assignment';
  id: string;
  target: Operand;
  expression: Expression;
  layout_hints?: LayoutHints;
}

export interface CallStatement {
  type: 'call';
  id: string;
  function_name: string;
  instance?: Operand;
  inputs: { [param: string]: Expression };
  outputs: { [param: string]: Operand };
  layout_hints?: LayoutHints;
}

export interface IfStatement {
  type: 'if';
  id: string;
  condition: Expression;
  then_statements: Statement[];
  elsif_blocks?: { condition: Expression; statements: Statement[] }[];
  else_statements?: Statement[];
  layout_hints?: LayoutHints;
}

export interface CommentStatement {
  type: 'comment';
  id: string;
  text: string;
}

// Zod schemas for statements
export const StatementSchema: z.ZodType<Statement> = z.lazy(() =>
  z.union([
    z.object({
      type: z.literal('assignment'),
      id: z.string(),
      target: OperandSchema,
      expression: ExpressionSchema,
      layout_hints: LayoutHintsSchema.optional(),
    }) as z.ZodType<AssignmentStatement>,
    z.object({
      type: z.literal('call'),
      id: z.string(),
      function_name: z.string(),
      instance: OperandSchema.optional(),
      inputs: z.record(ExpressionSchema),
      outputs: z.record(OperandSchema),
      layout_hints: LayoutHintsSchema.optional(),
    }) as z.ZodType<CallStatement>,
    z.object({
      type: z.literal('if'),
      id: z.string(),
      condition: ExpressionSchema,
      then_statements: z.array(StatementSchema),
      elsif_blocks: z
        .array(
          z.object({
            condition: ExpressionSchema,
            statements: z.array(StatementSchema),
          })
        )
        .optional(),
      else_statements: z.array(StatementSchema).optional(),
      layout_hints: LayoutHintsSchema.optional(),
    }) as z.ZodType<IfStatement>,
    z.object({
      type: z.literal('comment'),
      id: z.string(),
      text: z.string(),
    }) as z.ZodType<CommentStatement>,
  ])
);

// ============================================================================
// Program Structure
// ============================================================================

export interface Network {
  id: string;
  title: string;
  comment: string;
  statements: Statement[];
}

export const NetworkSchema: z.ZodType<Network> = z.object({
  id: z.string(),
  title: z.string(),
  comment: z.string(),
  statements: z.array(StatementSchema),
});

export interface OB {
  id: string;
  name: string;
  type: 'cyclic' | 'startup' | 'interrupt';
  networks: Network[];
}

export const OBSchema: z.ZodType<OB> = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['cyclic', 'startup', 'interrupt']),
  networks: z.array(NetworkSchema),
});

export interface FC {
  id: string;
  name: string;
  // Future: Function definition
}

export interface FB {
  id: string;
  name: string;
  // Future: Function block definition
}

export interface Program {
  version: string;
  organization_blocks: OB[];
  functions: FC[];
  function_blocks: FB[];
}

export const ProgramSchema: z.ZodType<Program> = z.object({
  version: z.string(),
  organization_blocks: z.array(OBSchema),
  functions: z.array(z.any()), // Placeholder for future
  function_blocks: z.array(z.any()), // Placeholder for future
});

// ============================================================================
// Timer and Counter Data Types
// ============================================================================

export interface TimerInstance {
  type: 'TON' | 'TOF' | 'TP';
  IN: boolean;
  PT: number; // Preset time in milliseconds
  Q: boolean; // Output
  ET: number; // Elapsed time in milliseconds
  // Internal state
  _start_time?: number;
  _triggered?: boolean;
}

export interface CounterInstance {
  type: 'CTU' | 'CTD' | 'CTUD';
  CU?: boolean; // Count up edge
  CD?: boolean; // Count down edge
  R?: boolean; // Reset
  LD?: boolean; // Load
  PV: number; // Preset value
  Q?: boolean; // Output (CV >= PV for CTU)
  QU?: boolean; // Count up output (CTUD)
  QD?: boolean; // Count down output (CTUD)
  CV: number; // Current value
  // Internal state
  _prev_CU?: boolean;
  _prev_CD?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function createEmptyProgram(): Program {
  return {
    version: '1.0',
    organization_blocks: [
      {
        id: 'OB1',
        name: 'Main',
        type: 'cyclic',
        networks: [
          {
            id: 'Network_1',
            title: 'Network 1',
            comment: '',
            statements: [],
          },
        ],
      },
    ],
    functions: [],
    function_blocks: [],
  };
}

export function createBoolLiteral(value: boolean): LiteralExpression {
  return {
    expr_type: 'literal',
    value,
    data_type: 'BOOL',
  };
}

export function createNumberLiteral(value: number, dataType: 'INT' | 'DINT' | 'REAL' = 'INT'): LiteralExpression {
  return {
    expr_type: 'literal',
    value,
    data_type: dataType,
  };
}

export function createOperandExpression(operand: Operand): OperandExpression {
  return {
    expr_type: 'operand',
    operand,
  };
}

export function createBinaryExpression(
  operator: BinaryOperator,
  left: Expression,
  right: Expression
): BinaryExpression {
  return {
    expr_type: 'binary',
    operator,
    left,
    right,
  };
}

export function createUnaryExpression(
  operator: UnaryOperator,
  operand: Expression
): UnaryExpression {
  return {
    expr_type: 'unary',
    operator,
    operand,
  };
}

export function createAssignment(
  id: string,
  target: Operand,
  expression: Expression
): AssignmentStatement {
  return {
    type: 'assignment',
    id,
    target,
    expression,
  };
}

export function generateId(): string {
  return `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
