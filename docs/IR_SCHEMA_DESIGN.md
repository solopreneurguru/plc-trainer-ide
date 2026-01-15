# Intermediate Representation (IR) Schema Design

## Overview

The IR is the canonical representation of PLC program logic that supports bidirectional translation to/from:
- Ladder Diagram (LAD)
- Function Block Diagram (FBD)
- Structured Control Language (SCL) subset

**Design Goals:**
1. **Language-agnostic**: Not biased toward any particular language
2. **Complete**: Can represent all instructions in the instruction set
3. **Type-safe**: Strong typing for validation
4. **Serializable**: JSON-friendly for save/load
5. **Executable**: Direct execution by the runtime engine
6. **Annotated**: Preserve layout hints for visual editors

---

## Core Concepts

### 1. Program Structure

```typescript
interface Program {
  version: string;              // IR schema version, e.g., "1.0"
  organization_blocks: OB[];    // List of OBs (main is OB1)
  functions: FC[];              // User-defined functions (future)
  function_blocks: FB[];        // User-defined FBs (future)
}

interface OB {
  id: string;                   // Unique identifier, e.g., "OB1"
  name: string;                 // Display name
  type: "cyclic" | "startup" | "interrupt";
  networks: Network[];          // Executable networks
}

interface Network {
  id: string;                   // Unique identifier, e.g., "Network_1"
  title: string;                // Optional description
  comment: string;              // Optional multi-line comment
  statements: Statement[];      // Executable statements
  layout_hints?: LayoutHints;   // Visual editor metadata
}
```

### 2. Statement (Core IR Node)

A **Statement** is a single executable operation. All LAD rungs, FBD blocks, and SCL lines compile to statements.

```typescript
type Statement =
  | AssignmentStatement
  | CallStatement
  | IfStatement
  | CommentStatement;

// Assignment: target := expression
interface AssignmentStatement {
  type: "assignment";
  id: string;
  target: Operand;              // Left-hand side (must be writable)
  expression: Expression;       // Right-hand side
  layout_hints?: LayoutHints;
}

// Function call: Timer1(IN := Start, PT := T#5s)
interface CallStatement {
  type: "call";
  id: string;
  function_name: string;        // e.g., "TON", "CTU", "MyFunction"
  instance?: Operand;           // Instance tag for FBs (e.g., Timer1)
  inputs: { [param: string]: Expression };   // Input parameters
  outputs: { [param: string]: Operand };     // Output parameters
  layout_hints?: LayoutHints;
}

// Conditional: IF condition THEN ... ELSE ... END_IF
interface IfStatement {
  type: "if";
  id: string;
  condition: Expression;
  then_statements: Statement[];
  elsif_blocks?: { condition: Expression; statements: Statement[] }[];
  else_statements?: Statement[];
  layout_hints?: LayoutHints;
}

// Comment (for pure documentation)
interface CommentStatement {
  type: "comment";
  id: string;
  text: string;
}
```

### 3. Expression

An **Expression** evaluates to a value.

```typescript
type Expression =
  | OperandExpression
  | BinaryExpression
  | UnaryExpression
  | LiteralExpression
  | CallExpression;

// Direct operand reference
interface OperandExpression {
  expr_type: "operand";
  operand: Operand;
}

// Binary operation: left OP right
interface BinaryExpression {
  expr_type: "binary";
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

type BinaryOperator =
  // Boolean
  | "AND" | "OR" | "XOR"
  // Comparison
  | "EQ" | "NE" | "LT" | "GT" | "LE" | "GE"
  // Arithmetic
  | "ADD" | "SUB" | "MUL" | "DIV" | "MOD";

// Unary operation: OP operand
interface UnaryExpression {
  expr_type: "unary";
  operator: UnaryOperator;
  operand: Expression;
}

type UnaryOperator = "NOT" | "NEG";  // Boolean NOT, arithmetic negation

// Literal constant
interface LiteralExpression {
  expr_type: "literal";
  value: boolean | number | string;
  data_type: DataType;
}

// Function call that returns a value (e.g., MAX(a, b))
interface CallExpression {
  expr_type: "call";
  function_name: string;
  arguments: Expression[];
}
```

### 4. Operand

An **Operand** is a reference to a tag or memory location.

```typescript
interface Operand {
  address?: string;              // Absolute address (e.g., "%I0.0", "%Q0.0")
  tag?: string;                  // Symbolic tag (e.g., "StartButton")
  member_path?: string[];        // For structs: ["Motor", "Running"]
  edge?: EdgeType;               // For edge detection on boolean operands
}

type EdgeType = "rising" | "falling";

// Resolution: If tag is provided, look up in tag table.
// If address is provided, map to physical I/O or memory.
// member_path is used for structured tags.
```

### 5. Data Types

```typescript
type DataType =
  | "BOOL"
  | "INT"      // 16-bit signed
  | "DINT"     // 32-bit signed
  | "REAL"     // 32-bit float
  | "TIME"     // Duration in milliseconds
  | "TIMER"    // Timer instance (TON/TOF/TP)
  | "COUNTER"  // Counter instance (CTU/CTD/CTUD)
  | { struct_type: string };  // User-defined struct

interface TimerType {
  type: "TON" | "TOF" | "TP";
  IN: boolean;
  PT: number;    // Preset time (ms)
  Q: boolean;    // Output
  ET: number;    // Elapsed time (ms)
  // Internal state
  _start_time?: number;
  _triggered?: boolean;
}

interface CounterType {
  type: "CTU" | "CTD" | "CTUD";
  CU?: boolean;  // Count up edge
  CD?: boolean;  // Count down edge
  R?: boolean;   // Reset
  LD?: boolean;  // Load
  PV: number;    // Preset value
  Q?: boolean;   // Output (CV >= PV for CTU)
  QU?: boolean;  // Count up output (CTUD)
  QD?: boolean;  // Count down output (CTUD)
  CV: number;    // Current value
  // Internal state
  _prev_CU?: boolean;
  _prev_CD?: boolean;
}
```

---

## Ladder-to-IR Translation

### Example 1: Simple Contact and Coil

**Ladder:**
```
    StartButton         MotorRunning
--|    |  |--------------( )--
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_1",
  target: { tag: "MotorRunning" },
  expression: {
    expr_type: "operand",
    operand: { tag: "StartButton" }
  }
}
```

### Example 2: Series Contacts (AND)

**Ladder:**
```
    Start      NotStop      Motor
--|  |  |-----|  /  |-------( )--
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_2",
  target: { tag: "Motor" },
  expression: {
    expr_type: "binary",
    operator: "AND",
    left: {
      expr_type: "operand",
      operand: { tag: "Start" }
    },
    right: {
      expr_type: "unary",
      operator: "NOT",
      operand: {
        expr_type: "operand",
        operand: { tag: "Stop" }
      }
    }
  }
}
```

### Example 3: Parallel Contacts (OR)

**Ladder:**
```
       Start
    --|  |  |---+
                |--( Motor )--
       Manual   |
    --|  |  |---+
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_3",
  target: { tag: "Motor" },
  expression: {
    expr_type: "binary",
    operator: "OR",
    left: {
      expr_type: "operand",
      operand: { tag: "Start" }
    },
    right: {
      expr_type: "operand",
      operand: { tag: "Manual" }
    }
  }
}
```

### Example 4: Seal-in Circuit

**Ladder:**
```
    Start
 --|  |  |---+
             |---+
    Motor    |   |
 --|  |  |---+   |----( Motor )--
                 |
    Stop         |
 --|  /  |-------+
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_4",
  target: { tag: "Motor" },
  expression: {
    expr_type: "binary",
    operator: "AND",
    left: {
      expr_type: "binary",
      operator: "OR",
      left: {
        expr_type: "operand",
        operand: { tag: "Start" }
      },
      right: {
        expr_type: "operand",
        operand: { tag: "Motor" }
      }
    },
    right: {
      expr_type: "unary",
      operator: "NOT",
      operand: {
        expr_type: "operand",
        operand: { tag: "Stop" }
      }
    }
  }
}
```

### Example 5: Timer (TON)

**Ladder:**
```
    Start
 --|  |  |------[TON]------
                Timer1
                IN   PT     Q
                     5s  --|  |--( Output )--
                        ET
                        (current)
```

**IR:**
```typescript
// Statement 1: Call the timer
{
  type: "call",
  id: "stmt_5a",
  function_name: "TON",
  instance: { tag: "Timer1" },
  inputs: {
    IN: { expr_type: "operand", operand: { tag: "Start" } },
    PT: { expr_type: "literal", value: 5000, data_type: "TIME" }
  },
  outputs: {
    Q: { tag: "Timer1", member_path: ["Q"] },
    ET: { tag: "Timer1", member_path: ["ET"] }
  }
}

// Statement 2: Assign output based on timer Q
{
  type: "assignment",
  id: "stmt_5b",
  target: { tag: "Output" },
  expression: {
    expr_type: "operand",
    operand: { tag: "Timer1", member_path: ["Q"] }
  }
}
```

### Example 6: Comparison Block

**Ladder:**
```
    Value1      [GE]        Output
 --|  |  |------   >=  ------( )--
    Value2      [   ]
 --|  |  |------
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_6",
  target: { tag: "Output" },
  expression: {
    expr_type: "binary",
    operator: "GE",
    left: {
      expr_type: "operand",
      operand: { tag: "Value1" }
    },
    right: {
      expr_type: "operand",
      operand: { tag: "Value2" }
    }
  }
}
```

### Example 7: Set/Reset Coils

**Ladder:**
```
    Start
 --|  |  |-------(S)-- Motor

    Stop
 --|  |  |-------(R)-- Motor
```

**IR (using special assignment semantics):**
```typescript
// Set
{
  type: "assignment",
  id: "stmt_7a",
  target: { tag: "Motor" },
  expression: {
    expr_type: "binary",
    operator: "OR",
    left: {
      expr_type: "operand",
      operand: { tag: "Motor" }
    },
    right: {
      expr_type: "operand",
      operand: { tag: "Start" }
    }
  }
}

// Reset
{
  type: "assignment",
  id: "stmt_7b",
  target: { tag: "Motor" },
  expression: {
    expr_type: "binary",
    operator: "AND",
    left: {
      expr_type: "operand",
      operand: { tag: "Motor" }
    },
    right: {
      expr_type: "unary",
      operator: "NOT",
      operand: {
        expr_type: "operand",
        operand: { tag: "Stop" }
      }
    }
  }
}
```

### Example 8: Rising Edge Contact

**Ladder:**
```
    Start
 --|  P  |------( Output )--
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_8",
  target: { tag: "Output" },
  expression: {
    expr_type: "operand",
    operand: {
      tag: "Start",
      edge: "rising"
    }
  }
}
```

---

## FBD-to-IR Translation

FBD blocks map naturally to CallStatements and Expressions:

### Example: AND Block with Output

**FBD:**
```
┌────────┐
│  AND   │
Input1 ──┤IN1  OUT├── Output
Input2 ──┤IN2     │
└────────┘
```

**IR:**
```typescript
{
  type: "assignment",
  id: "stmt_fbd_1",
  target: { tag: "Output" },
  expression: {
    expr_type: "binary",
    operator: "AND",
    left: {
      expr_type: "operand",
      operand: { tag: "Input1" }
    },
    right: {
      expr_type: "operand",
      operand: { tag: "Input2" }
    }
  }
}
```

### Example: TON Timer Block

**FBD:**
```
┌─────────┐
│   TON   │
Start ───┤IN    Q├─── Output
T#5s ────┤PT   ET├─── (display)
         │Timer1 │
         └───────┘
```

**IR:** (Same as Ladder Example 5)

---

## SCL-to-IR Translation

### Example 1: Simple Assignment

**SCL:**
```
Motor := Start AND NOT Stop;
```

**IR:** (Same as Ladder Example 2)

### Example 2: IF Statement

**SCL:**
```
IF Temperature > 100 THEN
    CoolingFan := TRUE;
ELSE
    CoolingFan := FALSE;
END_IF;
```

**IR:**
```typescript
{
  type: "if",
  id: "stmt_scl_1",
  condition: {
    expr_type: "binary",
    operator: "GT",
    left: {
      expr_type: "operand",
      operand: { tag: "Temperature" }
    },
    right: {
      expr_type: "literal",
      value: 100,
      data_type: "INT"
    }
  },
  then_statements: [
    {
      type: "assignment",
      id: "stmt_scl_1a",
      target: { tag: "CoolingFan" },
      expression: {
        expr_type: "literal",
        value: true,
        data_type: "BOOL"
      }
    }
  ],
  else_statements: [
    {
      type: "assignment",
      id: "stmt_scl_1b",
      target: { tag: "CoolingFan" },
      expression: {
        expr_type: "literal",
        value: false,
        data_type: "BOOL"
      }
    }
  ]
}
```

### Example 3: Timer Call

**SCL:**
```
Timer1(IN := Start, PT := T#5s);
Output := Timer1.Q;
```

**IR:** (Same as Ladder Example 5)

---

## Layout Hints (for Visual Editors)

To preserve visual layout when round-tripping:

```typescript
interface LayoutHints {
  language?: "LAD" | "FBD" | "SCL";  // Original language
  lad?: LadderLayoutHints;
  fbd?: FBDLayoutHints;
}

interface LadderLayoutHints {
  rung_number?: number;
  column?: number;           // Horizontal position (0-9)
  row?: number;              // Vertical position within rung
  is_branch_start?: boolean;
  is_branch_end?: boolean;
}

interface FBDLayoutHints {
  x: number;                 // Canvas X coordinate
  y: number;                 // Canvas Y coordinate
  width?: number;
  height?: number;
}
```

---

## Runtime Execution Model

### Execution Algorithm

```python
def execute_network(network: Network, context: ExecutionContext):
    """Execute all statements in a network sequentially."""
    for statement in network.statements:
        execute_statement(statement, context)

def execute_statement(stmt: Statement, context: ExecutionContext):
    if stmt.type == "assignment":
        value = evaluate_expression(stmt.expression, context)
        write_operand(stmt.target, value, context)

    elif stmt.type == "call":
        call_function(stmt.function_name, stmt.instance,
                      stmt.inputs, stmt.outputs, context)

    elif stmt.type == "if":
        condition_value = evaluate_expression(stmt.condition, context)
        if condition_value:
            for s in stmt.then_statements:
                execute_statement(s, context)
        else:
            for elsif_block in stmt.elsif_blocks or []:
                if evaluate_expression(elsif_block.condition, context):
                    for s in elsif_block.statements:
                        execute_statement(s, context)
                    return
            if stmt.else_statements:
                for s in stmt.else_statements:
                    execute_statement(s, context)

def evaluate_expression(expr: Expression, context: ExecutionContext) -> any:
    if expr.expr_type == "operand":
        return read_operand(expr.operand, context)

    elif expr.expr_type == "binary":
        left = evaluate_expression(expr.left, context)
        right = evaluate_expression(expr.right, context)
        return apply_binary_operator(expr.operator, left, right)

    elif expr.expr_type == "unary":
        operand = evaluate_expression(expr.operand, context)
        return apply_unary_operator(expr.operator, operand)

    elif expr.expr_type == "literal":
        return expr.value

    elif expr.expr_type == "call":
        return call_function_return_value(expr.function_name,
                                          expr.arguments, context)
```

### Execution Context

```typescript
interface ExecutionContext {
  tags: Map<string, any>;              // Tag values (symbol table)
  inputs: Map<string, boolean>;        // Physical inputs (%I0.0, etc.)
  outputs: Map<string, boolean>;       // Physical outputs (%Q0.0, etc.)
  memory: Map<string, any>;            // Internal memory (%M0.0, etc.)
  edge_memory: Map<string, boolean>;   // Previous scan values for edge detection
  scan_number: number;                 // Current scan cycle number
  scan_start_time: number;             // Timestamp of scan start (ms)
}
```

---

## Validation Rules

### Semantic Validation

1. **Type checking**: Expressions must match expected types
   - AND/OR/XOR: Both operands must be BOOL
   - Comparison: Both operands must be same numeric type
   - Arithmetic: Both operands must be numeric
   - Assignment: Expression type must match target type

2. **Operand validation**:
   - Tags must exist in tag table
   - Addresses must be valid (%I0.0 - %I0.6, %Q0.0 - %Q0.6)
   - Edge detection only on BOOL operands

3. **Function call validation**:
   - Function must exist (TON, TOF, TP, CTU, etc.)
   - All required inputs provided
   - Instance tag (for FBs) must be correct type

4. **Circular reference detection**:
   - Prevent: `A := B; B := A;` in same network

---

## JSON Schema Example

```json
{
  "version": "1.0",
  "organization_blocks": [
    {
      "id": "OB1",
      "name": "Main",
      "type": "cyclic",
      "networks": [
        {
          "id": "Network_1",
          "title": "Start-Stop Motor",
          "comment": "Basic seal-in circuit",
          "statements": [
            {
              "type": "assignment",
              "id": "stmt_1",
              "target": {
                "tag": "Motor"
              },
              "expression": {
                "expr_type": "binary",
                "operator": "AND",
                "left": {
                  "expr_type": "binary",
                  "operator": "OR",
                  "left": {
                    "expr_type": "operand",
                    "operand": { "tag": "Start" }
                  },
                  "right": {
                    "expr_type": "operand",
                    "operand": { "tag": "Motor" }
                  }
                },
                "right": {
                  "expr_type": "unary",
                  "operator": "NOT",
                  "operand": {
                    "expr_type": "operand",
                    "operand": { "tag": "Stop" }
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ],
  "functions": [],
  "function_blocks": []
}
```

---

## Implementation Notes

### TypeScript Type Definitions

Create a `src/core/ir/types.ts` file with Zod schemas for runtime validation:

```typescript
import { z } from 'zod';

export const DataTypeSchema = z.union([
  z.literal("BOOL"),
  z.literal("INT"),
  z.literal("DINT"),
  z.literal("REAL"),
  z.literal("TIME"),
  z.literal("TIMER"),
  z.literal("COUNTER"),
  z.object({ struct_type: z.string() })
]);

export const OperandSchema = z.object({
  address: z.string().optional(),
  tag: z.string().optional(),
  member_path: z.array(z.string()).optional(),
  edge: z.enum(["rising", "falling"]).optional()
});

// ... (continue for all IR types)

export type DataType = z.infer<typeof DataTypeSchema>;
export type Operand = z.infer<typeof OperandSchema>;
// ... etc.
```

### Parser Architecture

```
LAD Editor  ──┐
              ├──> LAD-to-IR Compiler ──┐
FBD Editor  ──┤                          ├──> IR ──> Runtime Engine
              ├──> FBD-to-IR Compiler ──┘
SCL Editor  ──┘──> SCL Parser + Compiler
                   (PEG.js or custom)
```

### Decompiler Architecture

```
IR ──┬──> IR-to-LAD Generator ──> LAD Editor
     ├──> IR-to-FBD Generator ──> FBD Editor
     └──> IR-to-SCL Generator ──> SCL Editor
```

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
