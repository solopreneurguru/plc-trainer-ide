# Task Backlog & Implementation Checklist

## Overview

This document provides a detailed breakdown of all tasks required to build the PLC Trainer IDE MVP, organized by phase, agent responsibility, and priority.

**Status Legend:**
- ⬜ Not Started
- 🔵 In Progress
- ✅ Completed
- 🔴 Blocked

---

## Phase 0: Project Setup & Foundation

### Agent: Infrastructure / DevOps

#### Task 0.1: Initialize Project Structure
- ⬜ Create project directory structure (see ENGINEERING_ARCHITECTURE.md)
- ⬜ Initialize Git repository with `.gitignore`
- ⬜ Set up `package.json` with scripts
- ⬜ Install core dependencies:
  - ⬜ Electron 28+
  - ⬜ React 18 with TypeScript
  - ⬜ Vite (bundler)
  - ⬜ Zustand (state management)
  - ⬜ Zod (schema validation)
  - ⬜ Tailwind CSS
- ⬜ Install dev dependencies:
  - ⬜ Vitest (testing)
  - ⬜ ESLint + Prettier
  - ⬜ TypeScript 5+
  - ⬜ electron-builder
- ⬜ Configure `tsconfig.json` (strict mode)
- ⬜ Configure `vite.config.ts` (Electron + React)
- ⬜ Configure `electron-builder.yml` (Windows installer)
- ⬜ Create `.eslintrc.json` and `.prettierrc`
- ⬜ Set up npm scripts:
  - ⬜ `npm run dev` (development mode)
  - ⬜ `npm run build` (production build)
  - ⬜ `npm run test` (run tests)
  - ⬜ `npm run lint` (lint code)
  - ⬜ `npm run package` (create app package)
  - ⬜ `npm run dist` (create installer)

**Estimated Time:** 4 hours

---

#### Task 0.2: Create Basic Electron Shell
- ⬜ Create `src/main/index.ts` (main process entry)
- ⬜ Create `src/renderer/index.tsx` (renderer entry)
- ⬜ Create `src/renderer/App.tsx` (root component)
- ⬜ Set up IPC preload script with `contextBridge`
- ⬜ Configure `contextIsolation` and `nodeIntegration` for security
- ⬜ Create application menu (File, Edit, View, Tools, Help)
- ⬜ Test basic Electron window opens and renders React

**Estimated Time:** 3 hours

---

### Agent 1: IR Design & Validation

#### Task 0.3: Implement IR Type System
- ⬜ Create `src/core/ir/types.ts`:
  - ⬜ Define `Program`, `OB`, `Network`, `Statement` types
  - ⬜ Define `Expression` types (Binary, Unary, Operand, Literal, Call)
  - ⬜ Define `Operand` type with tag/address/edge
  - ⬜ Define `DataType` enum
  - ⬜ Define `LayoutHints` for visual editors
- ⬜ Create Zod schemas for runtime validation:
  - ⬜ `ProgramSchema`
  - ⬜ `NetworkSchema`
  - ⬜ `StatementSchema`
  - ⬜ `ExpressionSchema`
  - ⬜ `OperandSchema`
- ⬜ Export TypeScript types inferred from Zod schemas
- ⬜ Write unit tests for schema validation (10+ test cases)

**Estimated Time:** 6 hours

---

#### Task 0.4: Implement IR Validator
- ⬜ Create `src/core/ir/validator.ts`:
  - ⬜ `validateProgram(program: Program): ValidationResult`
  - ⬜ Type checking for expressions
  - ⬜ Operand validation (tag exists, address valid)
  - ⬜ Circular reference detection
  - ⬜ Required parameters validation (e.g., Timer PT)
  - ⬜ Edge detection only on BOOL operands
- ⬜ Return detailed error messages with location info
- ⬜ Write unit tests (20+ test cases)

**Estimated Time:** 8 hours

---

### Agent 2: Runtime Execution Engine

#### Task 0.5: Implement Execution Context
- ⬜ Create `src/runtime/engine/ExecutionContext.ts`:
  - ⬜ `ExecutionContext` class with tag memory
  - ⬜ Maps for inputs, outputs, memory, edge memory
  - ⬜ `readOperand(operand: Operand): any`
  - ⬜ `writeOperand(operand: Operand, value: any): void`
  - ⬜ `readEdge(operand: Operand): boolean` (rising/falling)
  - ⬜ Initialize from tag table
- ⬜ Write unit tests (15+ test cases)

**Estimated Time:** 5 hours

---

#### Task 0.6: Implement Expression Evaluator
- ⬜ Create `src/runtime/engine/ExpressionEvaluator.ts`:
  - ⬜ `evaluateExpression(expr: Expression, context: ExecutionContext): any`
  - ⬜ Handle `OperandExpression` (read tag/address)
  - ⬜ Handle `BinaryExpression` (AND, OR, XOR, EQ, LT, GT, ADD, SUB, MUL, DIV, MOD)
  - ⬜ Handle `UnaryExpression` (NOT, NEG)
  - ⬜ Handle `LiteralExpression` (return value)
  - ⬜ Handle `CallExpression` (future: function calls with return values)
  - ⬜ Type coercion for mixed types (INT + REAL → REAL)
- ⬜ Write unit tests (30+ test cases for each operator)

**Estimated Time:** 8 hours

---

#### Task 0.7: Implement Statement Executor
- ⬜ Create `src/runtime/engine/StatementExecutor.ts`:
  - ⬜ `executeStatement(stmt: Statement, context: ExecutionContext): void`
  - ⬜ Handle `AssignmentStatement` (evaluate expression, write target)
  - ⬜ Handle `CallStatement` (invoke function, map outputs)
  - ⬜ Handle `IfStatement` (evaluate condition, execute branch)
  - ⬜ Handle `CommentStatement` (no-op)
- ⬜ Write unit tests (20+ test cases)

**Estimated Time:** 6 hours

---

## Phase 1: Core Runtime + LAD Editor + Watch + I/O

### Agent 2: Runtime Execution Engine

#### Task 1.1: Implement Timer Instructions
- ⬜ Create `src/runtime/instructions/timers.ts`:
  - ⬜ `executeTimerTON(instance, inputs, context): outputs`
    - ⬜ IN=TRUE → start timer, count up to PT
    - ⬜ Q=TRUE when ET >= PT
    - ⬜ IN=FALSE → reset ET to 0, Q=FALSE
  - ⬜ `executeTimerTOF(instance, inputs, context): outputs`
    - ⬜ IN=FALSE → start timer, count up to PT
    - ⬜ Q=FALSE when ET >= PT
    - ⬜ IN=TRUE → reset ET to 0, Q=TRUE
  - ⬜ `executeTimerTP(instance, inputs, context): outputs`
    - ⬜ IN rising edge → Q=TRUE for PT duration
    - ⬜ One-shot pulse
- ⬜ Use `context.scan_start_time` and `Date.now()` for timing
- ⬜ Write unit tests:
  - ⬜ TON: 10+ test cases (timing accuracy, reset, multiple cycles)
  - ⬜ TOF: 10+ test cases
  - ⬜ TP: 10+ test cases (edge detection, pulse duration)

**Estimated Time:** 10 hours

---

#### Task 1.2: Implement Counter Instructions
- ⬜ Create `src/runtime/instructions/counters.ts`:
  - ⬜ `executeCounterCTU(instance, inputs, context): outputs`
    - ⬜ CU rising edge → CV++
    - ⬜ R=TRUE → CV=0
    - ⬜ Q=TRUE when CV >= PV
  - ⬜ `executeCounterCTD(instance, inputs, context): outputs`
    - ⬜ CD rising edge → CV--
    - ⬜ LD=TRUE → CV=PV
    - ⬜ Q=TRUE when CV <= 0
  - ⬜ `executeCounterCTUD(instance, inputs, context): outputs`
    - ⬜ Combined up/down counter
    - ⬜ QU=TRUE when CV >= PV, QD=TRUE when CV <= 0
- ⬜ Write unit tests:
  - ⬜ CTU: 10+ test cases (count, overflow, reset)
  - ⬜ CTD: 10+ test cases (count down, underflow, load)
  - ⬜ CTUD: 10+ test cases (both directions, QU/QD)

**Estimated Time:** 8 hours

---

#### Task 1.3: Implement Latch Instructions
- ⬜ Create `src/runtime/instructions/latches.ts`:
  - ⬜ `executeLatchSR(inputs, context): outputs`
    - ⬜ S1=TRUE → Q1=TRUE (set dominant)
    - ⬜ R=TRUE → Q1=FALSE
    - ⬜ S1 and R both TRUE → Q1=TRUE (set wins)
  - ⬜ `executeLatchRS(inputs, context): outputs`
    - ⬜ S=TRUE → Q1=TRUE
    - ⬜ R1=TRUE → Q1=FALSE (reset dominant)
    - ⬜ S and R1 both TRUE → Q1=FALSE (reset wins)
- ⬜ Write unit tests (10+ test cases)

**Estimated Time:** 3 hours

---

#### Task 1.4: Implement Edge Detection
- ⬜ Create `src/runtime/edge-detection/EdgeDetector.ts`:
  - ⬜ `detectRisingEdge(tag, currentValue, context): boolean`
  - ⬜ `detectFallingEdge(tag, currentValue, context): boolean`
  - ⬜ Store previous values in `context.edge_memory`
  - ⬜ Handle first scan (no previous value)
- ⬜ Write unit tests (10+ test cases)

**Estimated Time:** 3 hours

---

#### Task 1.5: Implement Main PLC Runtime
- ⬜ Create `src/runtime/engine/PLCRuntime.ts`:
  - ⬜ `class PLCRuntime` with constructor(program, scanTimeMs)
  - ⬜ `start()`: Begin continuous scan cycles
  - ⬜ `stop()`: Pause execution
  - ⬜ `step()`: Execute one scan cycle
  - ⬜ `reset()`: Clear all tags to initial values
  - ⬜ `executeScanCycle()`:
    - ⬜ 1. Read inputs from I/O snapshot
    - ⬜ 2. Execute all networks in all OBs
    - ⬜ 3. Write outputs to I/O
    - ⬜ 4. Update watch data
    - ⬜ 5. Notify UI via callback/event
  - ⬜ `setInput(address, value)`: Update input
  - ⬜ `getOutput(address): value`: Read output
  - ⬜ `getWatchData(): WatchData`: Get current state for UI
- ⬜ Write integration tests (10+ test cases):
  - ⬜ Simple contact → coil
  - ⬜ Seal-in circuit
  - ⬜ Timer counting
  - ⬜ Counter incrementing
  - ⬜ Edge detection across scans

**Estimated Time:** 12 hours

---

### Agent 2: Runtime Execution Engine (IPC Integration)

#### Task 1.6: Implement Runtime IPC Handlers
- ⬜ Create `src/main/ipc/runtimeHandlers.ts`:
  - ⬜ `runtime:start` → Start runtime with scan time
  - ⬜ `runtime:stop` → Stop runtime
  - ⬜ `runtime:step` → Execute one scan
  - ⬜ `runtime:reset` → Reset runtime
  - ⬜ `runtime:set-input` → Set input value
  - ⬜ Emit `runtime:watch-update` event to renderer each scan
  - ⬜ Emit `runtime:scan-complete` event with metrics
- ⬜ Register handlers in main process
- ⬜ Test IPC communication (manual + integration tests)

**Estimated Time:** 4 hours

---

### Agent 3: LAD Editor UI

#### Task 1.7: Implement LAD Data Structures
- ⬜ Create `src/ui/editors/lad/types.ts`:
  - ⬜ `LadderRung`: Row with elements
  - ⬜ `LadderElement`: Contact, Coil, Timer, etc.
  - ⬜ `LadderGrid`: 10-column grid layout
  - ⬜ `LadderBranch`: Parallel paths (OR)
- ⬜ Position elements in grid (row, col)

**Estimated Time:** 2 hours

---

#### Task 1.8: Implement LAD-to-IR Compiler
- ⬜ Create `src/compilers/lad-to-ir/LADCompiler.ts`:
  - ⬜ `compileRung(rung: LadderRung): Statement[]`
  - ⬜ Series contacts → AND expression
  - ⬜ Parallel branches → OR expression
  - ⬜ Coil → Assignment target
  - ⬜ Set/Reset coils → Special assignment
  - ⬜ Edge contacts → Operand with edge flag
  - ⬜ Timers/Counters → CallStatement
  - ⬜ Comparison blocks → Binary expression
  - ⬜ Math blocks → Binary expression
- ⬜ Write unit tests (30+ test cases):
  - ⬜ Single contact → coil
  - ⬜ Series contacts (AND)
  - ⬜ Parallel contacts (OR)
  - ⬜ Seal-in circuit (feedback)
  - ⬜ Timers with contacts
  - ⬜ Counters
  - ⬜ Complex branches

**Estimated Time:** 12 hours

---

#### Task 1.9: Implement IR-to-LAD Decompiler
- ⬜ Create `src/decompilers/ir-to-lad/LADGenerator.ts`:
  - ⬜ `generateRung(statement: Statement): LadderRung`
  - ⬜ Assignment → Contact(s) + Coil
  - ⬜ AND expression → Series contacts
  - ⬜ OR expression → Parallel branches
  - ⬜ NOT expression → NC contact
  - ⬜ CallStatement → Timer/Counter block
  - ⬜ Comparison → Comparison block
  - ⬜ Math → Math block
  - ⬜ Layout optimization (minimize branches)
- ⬜ Write unit tests (match compiler test cases for round-trip)

**Estimated Time:** 10 hours

---

#### Task 1.10: Implement LAD Rung Renderer
- ⬜ Create `src/ui/editors/lad/Rung.tsx`:
  - ⬜ Render 10-column grid
  - ⬜ Place elements at grid positions
  - ⬜ Draw power rails (left and right)
  - ⬜ Draw horizontal lines between elements
  - ⬜ Draw vertical lines for branches
  - ⬜ Use SVG or CSS for clean lines
- ⬜ Create `src/ui/editors/lad/LadderElement.tsx`:
  - ⬜ Render contacts (NO: `──┤  ├──`, NC: `──┤ / ├──`)
  - ⬜ Render coils (`──( )──`, `──(S)──`, `──(R)──`)
  - ⬜ Render edge contacts (`──┤P├──`, `──┤N├──`)
  - ⬜ Render comparison blocks (box with inputs/outputs)
  - ⬜ Render math blocks
  - ⬜ Render timer/counter blocks (large box with pins)
  - ⬜ Show tag names below elements
  - ⬜ Apply styles (border, padding, font)
- ⬜ Test rendering with sample rungs

**Estimated Time:** 10 hours

---

#### Task 1.11: Implement LAD Editor Component
- ⬜ Create `src/ui/editors/lad/LADEditor.tsx`:
  - ⬜ Render list of networks
  - ⬜ Each network has title/comment and rungs
  - ⬜ Render each rung using `Rung` component
  - ⬜ Add "Add Network" button
  - ⬜ Add "Add Rung" button per network
  - ⬜ Handle click to select element
  - ⬜ Show properties panel on selection
  - ⬜ Support zoom (CSS transform)
- ⬜ Integrate with Zustand store (load IR, compile to LAD)
- ⬜ Test editor loads and displays sample project

**Estimated Time:** 8 hours

---

#### Task 1.12: Implement LAD Drag-and-Drop
- ⬜ Create `src/ui/editors/lad/drag-drop/DragDropHandler.ts`:
  - ⬜ Drag from palette → Drop on rung grid
  - ⬜ Highlight valid drop zones (grid cells)
  - ⬜ Insert element at drop position
  - ⬜ Update ladder data structure
  - ⬜ Recompile to IR
  - ⬜ Update store
- ⬜ Use react-dnd or custom implementation
- ⬜ Test dragging all instruction types

**Estimated Time:** 8 hours

---

#### Task 1.13: Implement LAD Properties Panel
- ⬜ Create `src/ui/editors/lad/PropertiesPanel.tsx`:
  - ⬜ Show when element selected
  - ⬜ Contact: Type (NO/NC), Tag, Address, Comment
  - ⬜ Coil: Type (Output/Set/Reset), Tag, Address, Comment
  - ⬜ Timer: Instance tag, PT value, Comment
  - ⬜ Counter: Instance tag, PV value, Comment
  - ⬜ Comparison: Operator, Tag1, Tag2
  - ⬜ Math: Operator, Tag1, Tag2, Result tag
  - ⬜ Auto-complete for tags
  - ⬜ Validate inputs (tag exists, valid address)
  - ⬜ Update ladder element on "OK"
  - ⬜ Recompile to IR
- ⬜ Test properties editing

**Estimated Time:** 10 hours

---

### Agent 4: Watch/Highlighting System

#### Task 1.14: Implement Watch Data Collector
- ⬜ Create `src/runtime/engine/WatchDataCollector.ts`:
  - ⬜ During execution, track which elements evaluated TRUE
  - ⬜ For each statement, record:
    - ⬜ Statement ID
    - ⬜ Evaluated to TRUE or FALSE
    - ⬜ Current tag values used
  - ⬜ Return `WatchData` object:
    - ⬜ `highlights: { statementId: boolean }`
    - ⬜ `tagValues: { tagName: value }`
    - ⬜ `scanNumber: number`
    - ⬜ `scanDuration: number`

**Estimated Time:** 4 hours

---

#### Task 1.15: Implement LAD Watch Highlighting
- ⬜ Modify `src/ui/editors/lad/LadderElement.tsx`:
  - ⬜ Accept `isHighlighted` prop
  - ⬜ Apply green glow/color when TRUE
  - ⬜ Apply gray color when FALSE
  - ⬜ Animate transitions (CSS transitions)
  - ⬜ Show current values for timers/counters (e.g., "ET: 3.45s")
- ⬜ Modify `src/ui/editors/lad/Rung.tsx`:
  - ⬜ Pass highlight state to each element
  - ⬜ Draw "power flow" effect (animated line from left rail to coil)
- ⬜ Create `src/ui/watch/WatchDataProvider.tsx`:
  - ⬜ Listen to `runtime:watch-update` IPC event
  - ⬜ Update Zustand store with watch data
  - ⬜ Trigger re-render of LAD editor
- ⬜ Test highlighting with running program

**Estimated Time:** 8 hours

---

### Agent: UI Components

#### Task 1.16: Implement I/O Panel
- ⬜ Create `src/ui/io/IOPanel.tsx`:
  - ⬜ Show runtime status (STOPPED, RUNNING, PAUSED)
  - ⬜ Show scan number and cycle time
  - ⬜ Render 7 digital inputs:
    - ⬜ Address label (%I0.0 - %I0.6)
    - ⬜ Name/comment
    - ⬜ Toggle switch UI (ON/OFF states)
    - ⬜ Click to toggle
    - ⬜ Keyboard shortcut (1-7)
    - ⬜ Momentary mode (Shift+Click)
  - ⬜ Render 7 digital outputs:
    - ⬜ Address label (%Q0.0 - %Q0.6)
    - ⬜ Name/comment
    - ⬜ Indicator lamp (red/green)
    - ⬜ Update state each scan
    - ⬜ Support blinking (CSS animation)
  - ⬜ Send `runtime:set-input` IPC on toggle
- ⬜ Style with professional industrial look
- ⬜ Test I/O panel interactions

**Estimated Time:** 8 hours

---

#### Task 1.17: Implement Watch Table
- ⬜ Create `src/ui/watch/WatchTable.tsx`:
  - ⬜ Table with columns: Name, Value, Type, Format
  - ⬜ "Add Tag" button → dropdown/autocomplete
  - ⬜ Pin icon to add tag to watch list
  - ⬜ Display current value from watch data
  - ⬜ Update every scan
  - ⬜ Support expandable structs (Timer: .IN, .PT, .Q, .ET)
  - ⬜ Context menu: Remove, Force Value, Unforce
  - ⬜ Format options: Decimal, Hex, Binary
  - ⬜ Force value dialog (override program logic)
  - ⬜ Visual indicator for forced tags (yellow background)
- ⬜ Integrate with Zustand store
- ⬜ Test watch table updates

**Estimated Time:** 10 hours

---

### Agent: UI Components

#### Task 1.18: Implement Tag Table
- ⬜ Create `src/ui/tags/TagTable.tsx`:
  - ⬜ Spreadsheet-like table with columns:
    - ⬜ Name (editable)
    - ⬜ Type (dropdown: BOOL, INT, DINT, REAL, TIME, TIMER, COUNTER)
    - ⬜ Address (optional, dropdown: %I0.0 - %I0.6, %Q0.0 - %Q0.6, %M0.0+)
    - ⬜ Initial Value (editable)
    - ⬜ Comment (editable)
  - ⬜ Inline editing (click cell)
  - ⬜ Validation (red border on invalid)
  - ⬜ "Add Tag" button → new row
  - ⬜ Delete tag (right-click menu)
  - ⬜ Import CSV
  - ⬜ Export CSV
  - ⬜ Filter/search tags
- ⬜ Create `src/core/tags/TagTable.ts`:
  - ⬜ `class TagTable` with CRUD methods
  - ⬜ `addTag(tag: TagDefinition): void`
  - ⬜ `updateTag(name: string, updates: Partial<TagDefinition>): void`
  - ⬜ `deleteTag(name: string): void`
  - ⬜ `getTag(name: string): TagDefinition | undefined`
  - ⬜ `validateTag(tag: TagDefinition): ValidationResult`
  - ⬜ Check for duplicate names
  - ⬜ Check for conflicting addresses
- ⬜ Integrate with Zustand store
- ⬜ Test tag table CRUD operations

**Estimated Time:** 10 hours

---

#### Task 1.19: Implement Instruction Palette
- ⬜ Create `src/ui/palette/InstructionPalette.tsx`:
  - ⬜ Collapsible tree structure (categories)
  - ⬜ Categories: Bit Logic, Comparison, Math, Timers, Counters, Move, Latches, Logic
  - ⬜ Render instruction icons/labels
  - ⬜ Search/filter box
  - ⬜ Draggable items (react-dnd)
  - ⬜ Double-click to insert at cursor (future)
  - ⬜ Tooltip with description on hover
- ⬜ Style with clean, readable layout
- ⬜ Test palette interactions

**Estimated Time:** 6 hours

---

### Agent: UI Layout

#### Task 1.20: Implement Main App Shell
- ⬜ Create `src/renderer/ui/layout/AppShell.tsx`:
  - ⬜ Title bar (with project name)
  - ⬜ Toolbar (runtime controls, zoom, undo/redo)
  - ⬜ Left sidebar (palette)
  - ⬜ Main content (editor tabs)
  - ⬜ Right panel (I/O panel + watch table)
  - ⬜ Bottom panel (tag table + lesson mode)
  - ⬜ Resizable splitters (drag to resize)
  - ⬜ Collapsible panels (toggle buttons)
  - ⬜ Save panel sizes to localStorage
- ⬜ Create `src/renderer/ui/layout/Toolbar.tsx`:
  - ⬜ New/Open/Save buttons
  - ⬜ Undo/Redo buttons
  - ⬜ Runtime controls (Run/Stop/Step/Reset)
  - ⬜ Scan time dropdown
  - ⬜ Zoom dropdown
  - ⬜ Connect to store actions
- ⬜ Create `src/renderer/ui/layout/EditorTabs.tsx`:
  - ⬜ Tabs for LAD, FBD, SCL
  - ⬜ Switch active editor
  - ⬜ Show "modified" indicator
- ⬜ Test responsive layout (resize window, collapse panels)

**Estimated Time:** 12 hours

---

### Agent: Project Management

#### Task 1.21: Implement Project Manager
- ⬜ Create `src/core/project/Project.ts`:
  - ⬜ `interface Project` with metadata, tags, program, config
  - ⬜ `createEmptyProject(): Project`
  - ⬜ Zod schema for project validation
- ⬜ Create `src/core/project/ProjectManager.ts`:
  - ⬜ `saveProject(project: Project, filePath: string): Promise<void>`
    - ⬜ Serialize to JSON
    - ⬜ Write to file (main process via IPC)
    - ⬜ Update recent projects list
  - ⬜ `loadProject(filePath: string): Promise<Project>`
    - ⬜ Read file (main process via IPC)
    - ⬜ Validate with Zod schema
    - ⬜ Return parsed project
  - ⬜ `autoSave(project: Project): Promise<void>`
    - ⬜ Save to temp file
    - ⬜ Throttle (max once per 60s)
  - ⬜ `getRecentProjects(): string[]`
  - ⬜ `addRecentProject(filePath: string): void`
- ⬜ Create IPC handlers in `src/main/ipc/projectHandlers.ts`:
  - ⬜ `project:save` → Write file
  - ⬜ `project:load` → Read file
  - ⬜ `project:save-as` → Save with new file name
- ⬜ Write unit tests (10+ test cases)
- ⬜ Test save/load round-trip

**Estimated Time:** 8 hours

---

### Agent: State Management

#### Task 1.22: Implement Zustand Store
- ⬜ Create `src/renderer/store/appStore.ts`:
  - ⬜ Define `AppState` interface
  - ⬜ State properties:
    - ⬜ `project: Project | null`
    - ⬜ `projectFilePath: string | null`
    - ⬜ `isDirty: boolean`
    - ⬜ `activeLanguage: 'LAD' | 'FBD' | 'SCL'`
    - ⬜ `selectedNetwork: string | null`
    - ⬜ `runtimeStatus: 'stopped' | 'running' | 'paused'`
    - ⬜ `watchData: WatchData`
    - ⬜ `scanNumber: number`
    - ⬜ `isPaletteOpen: boolean`
    - ⬜ `isWatchTableOpen: boolean`
  - ⬜ Actions:
    - ⬜ `newProject()`
    - ⬜ `loadProject(filePath: string)`
    - ⬜ `saveProject()`
    - ⬜ `saveProjectAs(filePath: string)`
    - ⬜ `setActiveLanguage(lang)`
    - ⬜ `startRuntime()`
    - ⬜ `stopRuntime()`
    - ⬜ `stepRuntime()`
    - ⬜ `resetRuntime()`
    - ⬜ `toggleInput(address: string)`
    - ⬜ `updateWatchData(data: WatchData)`
    - ⬜ `updateIR(ir: Program)`
    - ⬜ `addTag(tag: TagDefinition)`
    - ⬜ `updateTag(name, updates)`
    - ⬜ `deleteTag(name)`
    - ⬜ `pinTag(name)`
    - ⬜ `unpinTag(name)`
  - ⬜ Use Zustand's `create()` and `persist` middleware
- ⬜ Test store actions (integration tests)

**Estimated Time:** 10 hours

---

### Agent 7: Lesson Mode / Test Harness

#### Task 1.23: Define Lesson JSON Schema
- ⬜ Create `src/lessons/types.ts`:
  - ⬜ `interface Lesson` with title, description, objective, starter_project, test_cases
  - ⬜ `interface TestCase` with name, steps, expected_outputs
  - ⬜ `interface TestStep` with action (set_input, wait, check_output)
  - ⬜ Zod schema for validation
- ⬜ Document lesson format in `docs/LESSON_FORMAT.md`

**Estimated Time:** 3 hours

---

#### Task 1.24: Create 3 Example Lessons
- ⬜ Create `src/lessons/lessons/01-start-stop.json`:
  - ⬜ Title: "Lesson 1: Start-Stop Motor"
  - ⬜ Description: Basic seal-in circuit
  - ⬜ Starter project with tags defined
  - ⬜ Test cases (5 test steps)
- ⬜ Create `src/lessons/lessons/02-interlock.json`:
  - ⬜ Title: "Lesson 2: Motor Interlock"
  - ⬜ Description: Two motors, can't run simultaneously
  - ⬜ Starter project
  - ⬜ Test cases
- ⬜ Create `src/lessons/lessons/03-fault-latch.json`:
  - ⬜ Title: "Lesson 3: Fault Latch & Reset"
  - ⬜ Description: Fault condition latches, requires manual reset
  - ⬜ Starter project
  - ⬜ Test cases
- ⬜ Validate JSON against schema

**Estimated Time:** 6 hours

---

#### Task 1.25: Implement Test Harness
- ⬜ Create `src/lessons/TestHarness.ts`:
  - ⬜ `runLesson(lesson: Lesson, runtime: PLCRuntime): TestResult`
  - ⬜ For each test case:
    - ⬜ Execute test steps in sequence
    - ⬜ `set_input`: Set input value
    - ⬜ `wait`: Wait N scan cycles
    - ⬜ `check_output`: Verify output value matches expected
  - ⬜ Record pass/fail for each test case
  - ⬜ Return detailed results (which tests passed/failed, why)
- ⬜ Create `src/lessons/LessonManager.ts`:
  - ⬜ `loadLessons(): Lesson[]` (from JSON files)
  - ⬜ `getLesson(id: string): Lesson`
  - ⬜ `validateLesson(lesson: Lesson): ValidationResult`
- ⬜ Write unit tests (10+ test cases)

**Estimated Time:** 10 hours

---

#### Task 1.26: Implement Lesson Panel UI
- ⬜ Create `src/ui/lesson/LessonPanel.tsx`:
  - ⬜ Left: Lesson list (numbered, clickable)
  - ⬜ Right: Selected lesson details
    - ⬜ Title, description, objective
    - ⬜ "Load Starter Project" button
    - ⬜ "Validate Solution" button
    - ⬜ Test results (pass/fail for each test case)
    - ⬜ Celebration on all tests passed
    - ⬜ "Next Lesson" button
- ⬜ Create `src/ui/lesson/ValidationResults.tsx`:
  - ⬜ Display test case results with checkmarks/X's
  - ⬜ Show error details for failures
  - ⬜ Animate checkmarks (CSS transitions)
- ⬜ Integrate with Zustand store
- ⬜ Test lesson loading and validation

**Estimated Time:** 8 hours

---

### Phase 1 Summary Checklist

#### Before considering Phase 1 complete, verify:
- ⬜ Runtime engine executes simple ladder logic correctly
- ⬜ Timers (TON, TOF, TP) work accurately (within 10ms)
- ⬜ Counters (CTU, CTD, CTUD) increment/decrement correctly
- ⬜ Edge detection (rising/falling) works across scans
- ⬜ LAD editor displays and allows editing
- ⬜ Drag-and-drop instructions from palette works
- ⬜ Properties panel edits element properties
- ⬜ Watch mode highlights energized elements in real-time
- ⬜ I/O panel toggles inputs and shows outputs
- ⬜ Watch table shows live tag values
- ⬜ Tag table allows CRUD operations
- ⬜ Projects save and load correctly (JSON round-trip)
- ⬜ Auto-save works (every 60s)
- ⬜ All 3 example lessons load and validate
- ⬜ Test harness correctly identifies pass/fail
- ⬜ Unit tests pass (> 80% coverage for runtime and IR)
- ⬜ Integration tests pass (end-to-end scenarios)
- ⬜ Manual testing checklist completed
- ⬜ Performance: 200 rungs execute in < 10ms per scan
- ⬜ Performance: UI renders at 60 FPS

**Estimated Total Time for Phase 1:** ~220 hours (5-6 weeks for 1 developer)

---

## Phase 2: FBD Editor + IR Synchronization

### Agent 5: FBD Editor UI

#### Task 2.1: Implement FBD Data Structures
- ⬜ Create `src/ui/editors/fbd/types.ts`:
  - ⬜ `FBDBlock`: Function block with inputs/outputs/position
  - ⬜ `FBDWire`: Connection between two pins
  - ⬜ `FBDPin`: Input or output connection point
  - ⬜ `FBDNetwork`: Collection of blocks and wires

**Estimated Time:** 2 hours

---

#### Task 2.2: Implement FBD-to-IR Compiler
- ⬜ Create `src/compilers/fbd-to-ir/FBDCompiler.ts`:
  - ⬜ `compileNetwork(network: FBDNetwork): Statement[]`
  - ⬜ Topological sort of blocks (data flow order)
  - ⬜ Each block → Statement (Assignment or Call)
  - ⬜ Wires → Expression connections
  - ⬜ Handle feedback loops (detect and error or allow with warning)
- ⬜ Write unit tests (20+ test cases):
  - ⬜ Simple AND block
  - ⬜ Chained blocks (AND → OR → OUTPUT)
  - ⬜ Timer blocks
  - ⬜ Counter blocks
  - ⬜ Complex network with multiple outputs

**Estimated Time:** 10 hours

---

#### Task 2.3: Implement IR-to-FBD Decompiler
- ⬜ Create `src/decompilers/ir-to-fbd/FBDGenerator.ts`:
  - ⬜ `generateNetwork(statements: Statement[]): FBDNetwork`
  - ⬜ Assignment → AND/OR/NOT blocks
  - ⬜ CallStatement → Timer/Counter block
  - ⬜ Comparison → Comparison block
  - ⬜ Math → Math block
  - ⬜ Generate wires between blocks
  - ⬜ Auto-layout algorithm (left-to-right, top-to-bottom)
  - ⬜ Minimize wire crossings (heuristic)
- ⬜ Write unit tests (match compiler test cases for round-trip)

**Estimated Time:** 12 hours

---

#### Task 2.4: Implement FBD Block Renderer
- ⬜ Create `src/ui/editors/fbd/Block.tsx`:
  - ⬜ Render block as SVG rectangle
  - ⬜ Show function name (AND, TON, ADD, etc.)
  - ⬜ Show instance name (if applicable)
  - ⬜ Render input pins (left side)
  - ⬜ Render output pins (right side)
  - ⬜ Show pin names (IN, OUT, Q, PT, etc.)
  - ⬜ Highlight block when output is TRUE (green border)
  - ⬜ Draggable (move block on canvas)
- ⬜ Create `src/ui/editors/fbd/Wire.tsx`:
  - ⬜ Render wire as SVG path (Bezier curve)
  - ⬜ Connect two pins (from_pin, to_pin)
  - ⬜ Green wire for TRUE signal
  - ⬜ Gray wire for FALSE signal
  - ⬜ Show value on wire for numeric data (label)
- ⬜ Test rendering with sample FBD network

**Estimated Time:** 10 hours

---

#### Task 2.5: Implement FBD Editor Component
- ⬜ Create `src/ui/editors/fbd/FBDEditor.tsx`:
  - ⬜ Canvas-based editor (SVG or HTML5 Canvas)
  - ⬜ Render all blocks and wires
  - ⬜ Pan (drag canvas)
  - ⬜ Zoom (mouse wheel)
  - ⬜ Select blocks (click)
  - ⬜ Multi-select (Ctrl+Click or drag rectangle)
  - ⬜ Delete block (Delete key)
  - ⬜ Context menu (right-click)
- ⬜ Integrate with Zustand store (load IR, decompile to FBD)
- ⬜ Test editor loads and displays sample project

**Estimated Time:** 10 hours

---

#### Task 2.6: Implement FBD Drag-and-Drop
- ⬜ Create `src/ui/editors/fbd/drag-drop/DragDropHandler.ts`:
  - ⬜ Drag from palette → Drop on canvas
  - ⬜ Create new block at drop position
  - ⬜ Drag block → Move block
  - ⬜ Drag pin → Create wire (start wire)
  - ⬜ Drop on another pin → Complete wire connection
  - ⬜ Validate connection (type compatibility)
  - ⬜ Update FBD data structure
  - ⬜ Recompile to IR
- ⬜ Test dragging blocks and wiring

**Estimated Time:** 10 hours

---

#### Task 2.7: Implement FBD Auto-Layout
- ⬜ Create `src/ui/editors/fbd/layout/AutoLayoutEngine.ts`:
  - ⬜ `autoLayout(network: FBDNetwork): void`
  - ⬜ Topological sort (data flow order)
  - ⬜ Assign horizontal layers (level 0, 1, 2, ...)
  - ⬜ Assign vertical positions (minimize crossings)
  - ⬜ Update block positions
  - ⬜ Reroute wires
- ⬜ Add "Auto Layout" button to toolbar
- ⬜ Test auto-layout with complex networks

**Estimated Time:** 8 hours

---

#### Task 2.8: Implement FBD Properties Panel
- ⬜ Create `src/ui/editors/fbd/PropertiesPanel.tsx`:
  - ⬜ Show when block selected
  - ⬜ Edit block properties (similar to LAD properties)
  - ⬜ AND/OR block: Input tags
  - ⬜ Timer block: Instance, PT, Comment
  - ⬜ Comparison block: Operator, inputs
  - ⬜ Math block: Operator, inputs, output
  - ⬜ Auto-complete for tags
  - ⬜ Update FBD block on "OK"
  - ⬜ Recompile to IR
- ⬜ Test properties editing

**Estimated Time:** 6 hours

---

#### Task 2.9: Implement FBD Watch Highlighting
- ⬜ Modify `src/ui/editors/fbd/Block.tsx`:
  - ⬜ Accept `isHighlighted` prop
  - ⬜ Apply green border when output is TRUE
  - ⬜ Gray border when FALSE
- ⬜ Modify `src/ui/editors/fbd/Wire.tsx`:
  - ⬜ Accept `value` prop
  - ⬜ Green wire for TRUE, gray for FALSE
  - ⬜ Show numeric values on wire (label)
- ⬜ Connect to watch data from runtime
- ⬜ Test highlighting with running program

**Estimated Time:** 4 hours

---

### Agent: Integration

#### Task 2.10: Implement LAD ↔ FBD Synchronization
- ⬜ When user edits LAD:
  - ⬜ Compile LAD to IR
  - ⬜ Update store IR
  - ⬜ Decompile IR to FBD
  - ⬜ Refresh FBD editor (if active)
- ⬜ When user edits FBD:
  - ⬜ Compile FBD to IR
  - ⬜ Update store IR
  - ⬜ Decompile IR to LAD
  - ⬜ Refresh LAD editor (if active)
- ⬜ Test round-trip:
  - ⬜ Create simple program in LAD → Switch to FBD → Edit → Switch back to LAD → Verify match
  - ⬜ Create program in FBD → Switch to LAD → Edit → Switch back to FBD → Verify match
- ⬜ Handle edge cases:
  - ⬜ Complex expressions that don't map cleanly
  - ⬜ Preserve layout hints where possible
  - ⬜ Warn user if information loss occurs

**Estimated Time:** 8 hours

---

### Phase 2 Summary Checklist

#### Before considering Phase 2 complete, verify:
- ⬜ FBD editor displays and allows editing
- ⬜ Drag-and-drop blocks from palette works
- ⬜ Wiring blocks works (click pin → drag → click target pin)
- ⬜ Properties panel edits block properties
- ⬜ Auto-layout arranges blocks neatly
- ⬜ Watch mode highlights blocks and wires in real-time
- ⬜ LAD ↔ FBD synchronization works (round-trip)
- ⬜ All Phase 1 features still work
- ⬜ Unit tests pass for FBD compiler/decompiler
- ⬜ Integration tests pass (LAD/FBD sync)
- ⬜ Performance: FBD rendering at 60 FPS

**Estimated Total Time for Phase 2:** ~80 hours (2-3 weeks for 1 developer)

---

## Phase 3: SCL Subset Editor + Bidirectional Sync

### Agent 6: SCL Subset Parser/Translator

#### Task 3.1: Define SCL Subset Grammar
- ⬜ Create `docs/SCL_SUBSET_GRAMMAR.md`:
  - ⬜ Document supported syntax (from PRODUCT_SPEC.md)
  - ⬜ EBNF grammar for:
    - ⬜ Assignments
    - ⬜ Boolean expressions
    - ⬜ Arithmetic expressions
    - ⬜ Comparisons
    - ⬜ IF-ELSIF-ELSE-END_IF
    - ⬜ Function calls (Timer/Counter)
    - ⬜ Comments
  - ⬜ List unsupported features (FOR, WHILE, CASE, arrays, etc.)

**Estimated Time:** 3 hours

---

#### Task 3.2: Implement SCL Lexer
- ⬜ Create `src/compilers/scl-to-ir/Lexer.ts`:
  - ⬜ Tokenize SCL source code
  - ⬜ Token types: IDENTIFIER, NUMBER, STRING, OPERATOR, KEYWORD, COMMENT, SEMICOLON, LPAREN, RPAREN, etc.
  - ⬜ Handle keywords: IF, THEN, ELSIF, ELSE, END_IF, AND, OR, NOT, TRUE, FALSE, etc.
  - ⬜ Handle operators: :=, +, -, *, /, MOD, =, <>, <, >, <=, >=
  - ⬜ Handle comments: // and (* ... *)
  - ⬜ Report line/column positions for errors
- ⬜ Write unit tests (20+ test cases)

**Estimated Time:** 8 hours

---

#### Task 3.3: Implement SCL Parser
- ⬜ Create `src/compilers/scl-to-ir/Parser.ts`:
  - ⬜ Parse token stream into AST (Abstract Syntax Tree)
  - ⬜ AST node types:
    - ⬜ `AssignmentNode`: target := expression
    - ⬜ `IfNode`: IF condition THEN ... ELSE ... END_IF
    - ⬜ `BinaryOpNode`: left OP right
    - ⬜ `UnaryOpNode`: OP operand
    - ⬜ `IdentifierNode`: tag name
    - ⬜ `LiteralNode`: constant value
    - ⬜ `CallNode`: Function(arg1 := val1, ...)
  - ⬜ Recursive descent parser
  - ⬜ Error recovery (continue parsing after error)
  - ⬜ Report syntax errors with line/column
- ⬜ Write unit tests (30+ test cases):
  - ⬜ Valid programs
  - ⬜ Syntax errors (missing semicolon, mismatched END_IF, etc.)
  - ⬜ Operator precedence

**Estimated Time:** 12 hours

---

#### Task 3.4: Implement SCL AST-to-IR Translator
- ⬜ Create `src/compilers/scl-to-ir/ASTToIR.ts`:
  - ⬜ `translateAST(ast: ASTNode[]): Program`
  - ⬜ Convert AST to IR statements
  - ⬜ `AssignmentNode` → `AssignmentStatement`
  - ⬜ `IfNode` → `IfStatement`
  - ⬜ `BinaryOpNode` → `BinaryExpression`
  - ⬜ `UnaryOpNode` → `UnaryExpression`
  - ⬜ `IdentifierNode` → `OperandExpression`
  - ⬜ `LiteralNode` → `LiteralExpression`
  - ⬜ `CallNode` → `CallStatement`
  - ⬜ Validate semantic rules (tag exists, types match)
- ⬜ Write unit tests (20+ test cases)

**Estimated Time:** 10 hours

---

#### Task 3.5: Implement IR-to-SCL Generator
- ⬜ Create `src/decompilers/ir-to-scl/SCLGenerator.ts`:
  - ⬜ `generateSCL(program: Program): string`
  - ⬜ Pretty-print IR as SCL code
  - ⬜ `AssignmentStatement` → `target := expression;`
  - ⬜ `IfStatement` → `IF ... THEN ... END_IF;`
  - ⬜ `CallStatement` → `Instance(IN := ..., PT := ...);`
  - ⬜ Proper indentation (2 or 4 spaces)
  - ⬜ Comments for network titles
  - ⬜ Optimize expressions (avoid unnecessary parentheses)
- ⬜ Write unit tests (match compiler test cases for round-trip)

**Estimated Time:** 8 hours

---

### Agent 6: SCL Editor UI

#### Task 3.6: Implement SCL Editor Component
- ⬜ Create `src/ui/editors/scl/SCLEditor.tsx`:
  - ⬜ Integrate Monaco Editor (VS Code editor component)
  - ⬜ Configure language: Custom SCL syntax
  - ⬜ Syntax highlighting:
    - ⬜ Keywords (blue)
    - ⬜ Operators (dark)
    - ⬜ Comments (green)
    - ⬜ Strings (red)
    - ⬜ Numbers (orange)
  - ⬜ Auto-complete for:
    - ⬜ Keywords (IF, THEN, ELSE, AND, OR, NOT, etc.)
    - ⬜ Tags (from tag table)
    - ⬜ Functions (TON, TOF, TP, CTU, CTD, etc.)
  - ⬜ Error markers (red squiggly underlines)
  - ⬜ Hover tooltips (show tag type, value)
  - ⬜ Bracket matching
  - ⬜ Line numbers
  - ⬜ Minimap (for large programs)
- ⬜ Load IR and decompile to SCL on mount
- ⬜ Compile SCL to IR on change (debounced, e.g., 500ms)
- ⬜ Show compilation errors in editor
- ⬜ Test editor displays and allows editing

**Estimated Time:** 10 hours

---

### Agent: Integration

#### Task 3.7: Implement LAD/FBD ↔ SCL Synchronization
- ⬜ When user edits LAD or FBD:
  - ⬜ Compile to IR
  - ⬜ Update store IR
  - ⬜ Decompile IR to SCL
  - ⬜ Refresh SCL editor (if active)
- ⬜ When user edits SCL:
  - ⬜ Parse and compile SCL to IR
  - ⬜ Update store IR
  - ⬜ Decompile IR to LAD and FBD
  - ⬜ Refresh LAD/FBD editors (if active)
- ⬜ Test round-trip:
  - ⬜ LAD → SCL → LAD
  - ⬜ FBD → SCL → FBD
  - ⬜ SCL → LAD → SCL
  - ⬜ SCL → FBD → SCL
- ⬜ Handle edge cases:
  - ⬜ IF statements may not have direct LAD/FBD equivalent (warn user)
  - ⬜ Complex LAD branches may decompile to verbose SCL
  - ⬜ Preserve comments where possible

**Estimated Time:** 8 hours

---

### Phase 3 Summary Checklist

#### Before considering Phase 3 complete, verify:
- ⬜ SCL editor displays and allows editing
- ⬜ Syntax highlighting works
- ⬜ Auto-complete suggests keywords and tags
- ⬜ Compilation errors show in editor (red underlines)
- ⬜ SCL ↔ LAD ↔ FBD synchronization works (round-trip)
- ⬜ All Phase 1 and Phase 2 features still work
- ⬜ Unit tests pass for SCL lexer, parser, translator
- ⬜ Integration tests pass (3-way sync)
- ⬜ Performance: SCL parsing and compilation < 100ms for typical program

**Estimated Total Time for Phase 3:** ~60 hours (1.5-2 weeks for 1 developer)

---

## Phase 4: Packaging & Distribution

### Agent 8: Packaging / Build / Installer

#### Task 4.1: Configure Electron Builder
- ⬜ Review and finalize `electron-builder.yml`:
  - ⬜ App ID: `com.plctrainer.ide`
  - ⬜ Product name: `PLC Trainer IDE`
  - ⬜ Build resources: `build/` (icons, etc.)
  - ⬜ Files: Include `dist/`, `public/`, `src/lessons/`
  - ⬜ Windows target: NSIS installer
  - ⬜ Installer options:
    - ⬜ Allow user to choose install directory
    - ⬜ Create desktop shortcut
    - ⬜ Create start menu entry
    - ⬜ Associate `.plcproj` file extension
- ⬜ Create app icon (256x256 PNG, convert to .ico for Windows)
- ⬜ Test build process: `npm run dist`

**Estimated Time:** 4 hours

---

#### Task 4.2: Create Build Scripts
- ⬜ Create `scripts/build.sh` (or `.bat` for Windows):
  - ⬜ Run linter: `npm run lint`
  - ⬜ Run tests: `npm run test`
  - ⬜ Build TypeScript: `tsc`
  - ⬜ Build React: `vite build`
  - ⬜ Exit if any step fails
- ⬜ Create `scripts/package.sh`:
  - ⬜ Run build script
  - ⬜ Run `electron-builder`
  - ⬜ Output: `dist/PLC Trainer IDE Setup.exe`
- ⬜ Test scripts on clean machine (VM)

**Estimated Time:** 3 hours

---

#### Task 4.3: Create README and Documentation
- ⬜ Create `README.md`:
  - ⬜ Project description
  - ⬜ Features list
  - ⬜ Installation instructions
  - ⬜ Quick start guide
  - ⬜ Development setup
  - ⬜ Building from source
  - ⬜ Contributing guidelines
  - ⬜ License (MIT)
- ⬜ Create `docs/USER_GUIDE.md`:
  - ⬜ How to use the IDE
  - ⬜ Editor instructions (LAD, FBD, SCL)
  - ⬜ Lesson mode guide
  - ⬜ Keyboard shortcuts
  - ⬜ Troubleshooting
- ⬜ Create `docs/DEVELOPMENT.md`:
  - ⬜ Architecture overview
  - ⬜ How to add new instructions
  - ⬜ How to create lessons
  - ⬜ Testing guidelines

**Estimated Time:** 6 hours

---

#### Task 4.4: Final Testing & QA
- ⬜ Install on fresh Windows machine
- ⬜ Verify installer works (no errors)
- ⬜ Verify app launches without errors
- ⬜ Run through all manual testing checklist items
- ⬜ Test all 3 example lessons (pass validation)
- ⬜ Test save/load projects
- ⬜ Test all keyboard shortcuts
- ⬜ Test performance (200 rungs, 60 FPS)
- ⬜ Check for memory leaks (run for 1 hour)
- ⬜ Fix any critical bugs found
- ⬜ Prepare release notes

**Estimated Time:** 10 hours

---

### Phase 4 Summary Checklist

#### Before releasing MVP, verify:
- ⬜ Installer builds successfully
- ⬜ Installer runs on clean Windows machine
- ⬜ App launches and all features work
- ⬜ All tests pass
- ⬜ No critical bugs
- ⬜ Documentation complete
- ⬜ README with installation instructions
- ⬜ License file included
- ⬜ Release notes prepared

**Estimated Total Time for Phase 4:** ~25 hours (1 week for 1 developer)

---

## Total MVP Development Timeline

| Phase | Tasks | Estimated Hours | Estimated Duration (1 Dev) |
|-------|-------|-----------------|----------------------------|
| Phase 0: Setup | 0.1 - 0.7 | 60 | 1.5 weeks |
| Phase 1: LAD + Runtime | 1.1 - 1.26 | 220 | 5-6 weeks |
| Phase 2: FBD | 2.1 - 2.10 | 80 | 2-3 weeks |
| Phase 3: SCL | 3.1 - 3.7 | 60 | 1.5-2 weeks |
| Phase 4: Packaging | 4.1 - 4.4 | 25 | 1 week |
| **TOTAL** | | **~445 hours** | **~11-13 weeks** |

**Note:** These are estimates for a single experienced developer. Actual time may vary based on:
- Developer experience with Electron, React, PLC concepts
- Unexpected technical challenges
- Scope changes
- Quality requirements (more testing = more time)

---

## Priority Levels

### P0 (Critical - Must have for MVP)
- All Phase 1 tasks
- All Phase 2 tasks
- All Phase 3 tasks (SCL subset)
- Phase 4 packaging

### P1 (High - Should have soon after MVP)
- User-defined functions
- Advanced SCL (FOR loops, CASE)
- Analog I/O simulation
- Recipe system
- Dark theme

### P2 (Medium - Nice to have)
- HMI designer
- Data logging
- Import/export from other PLC formats
- Collaborative editing

### P3 (Low - Future)
- Cloud sync
- Mobile companion app
- Community lesson marketplace

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IR design too rigid | Medium | High | Iterative design, validate with examples |
| Performance issues | Medium | Medium | Profile early, optimize hot paths |
| LAD/FBD layout algorithm | High | Medium | Allow manual adjustment, heuristics |
| SCL parser complexity | High | Medium | Use PEG.js, limit scope to subset |
| Electron security | Low | High | Follow best practices, regular updates |
| Scope creep | High | High | Strict adherence to MVP definition |

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
