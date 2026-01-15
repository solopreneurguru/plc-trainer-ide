# PLC Trainer IDE - Product Specification v1.0

## Executive Summary

**Product Name:** PLC Trainer IDE
**Version:** 1.0 (MVP)
**Target Audience:** PLC programming students, technicians, and engineers learning industrial automation
**Platform:** Windows desktop (Electron-based, portable to macOS/Linux)
**License:** Open-source (MIT)

The PLC Trainer IDE is a self-contained educational tool that simulates a programmable logic controller environment inspired by IEC 61131-3 standards and workflows similar to Siemens TIA Portal, without using proprietary formats or branding.

---

## Product Vision

Create a free, accessible learning platform where students can:
- Write PLC programs in multiple languages (Ladder, FBD, Structured Text)
- See real-time execution with animated power flow
- Experiment with I/O without physical hardware
- Learn through guided lessons with automatic validation
- Build muscle memory for professional PLC development tools

---

## Core Features

### 1. Multi-Language Programming Environment

#### 1.1 Ladder Diagram (LAD) Editor
- **Drag-and-drop instruction palette** with:
  - Contacts: NO (normally open), NC (normally closed)
  - Coils: Output, Set (S), Reset (R)
  - Edge detection: Rising edge (P), Falling edge (N)
  - Comparison blocks: EQ, NE, LT, GT, LE, GE
  - Math blocks: ADD, SUB, MUL, DIV, MOD
  - Move: MOVE (assignment)
  - Timers: TON (on-delay), TOF (off-delay), TP (pulse)
  - Counters: CTU (count up), CTD (count down), CTUD (up/down)
  - Logic: AND, OR, XOR, NOT boxes
  - Function calls: Custom function invocation
  - Latches: SR (set-dominant), RS (reset-dominant)

- **Grid-based layout**: 10 columns wide per rung
- **Multi-rung support**: Unlimited rungs in a network
- **Branch support**: Parallel paths within a rung
- **Visual style**: Professional look matching industrial standards

#### 1.2 Function Block Diagram (FBD) Editor
- **Block-based wiring**: Connect function blocks with signal lines
- **Same instruction set as LAD** presented as blocks
- **Visual data flow**: Left-to-right, top-to-bottom execution order
- **Wire routing**: Automatic or manual wire layout

#### 1.3 Structured Control Language (SCL) Subset Editor
- **Supported syntax (v1.0 subset)**:
  - Variable assignments: `Output1 := Input1 AND Input2;`
  - Boolean expressions: `AND`, `OR`, `NOT`, `XOR`
  - Comparisons: `=`, `<>`, `<`, `>`, `<=`, `>=`
  - Arithmetic: `+`, `-`, `*`, `/`, `MOD`
  - If-Else statements:
    ```
    IF condition THEN
        statements;
    ELSIF condition THEN
        statements;
    ELSE
        statements;
    END_IF;
    ```
  - Function calls: `Timer1(IN := Start, PT := T#5s);`
  - Timer/Counter operations
  - Comments: `// single line` and `(* multi-line *)`

- **NOT supported in v1.0**: Loops (FOR, WHILE), CASE statements, arrays, pointers, function definitions
- **Syntax highlighting and auto-complete**

#### 1.4 Interchangeable Views
- **Single underlying IR**: One canonical representation
- **Bidirectional sync**: Changes in LAD/FBD/SCL update the IR and refresh other views
- **Feature parity**: All three languages support the same instruction set
- **Graceful degradation**: Complex SCL constructs may not round-trip perfectly

---

### 2. Simulated PLC Runtime

#### 2.1 Scan Cycle
```
┌─────────────────────────────────────┐
│  1. Read all inputs from I/O panel  │
│     (snapshot physical inputs)      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Execute program logic           │
│     - Process each rung/network     │
│     - Update internal tags          │
│     - Evaluate timers/counters      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Write outputs to I/O panel      │
│     (update indicator lamps)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Update watch table & animations │
└──────────────┬──────────────────────┘
               │
               └──> Repeat (configurable scan time, default 100ms)
```

#### 2.2 Execution Model
- **Scan-based**: Not real-time, but realistic timing simulation
- **Configurable scan rate**: 10ms - 1000ms per cycle
- **Deterministic**: Same inputs always produce same outputs
- **Edge detection**: Track rising/falling edges across scans
- **Timer resolution**: Millisecond-accurate timing
- **Counter persistence**: Maintain counts across scans

#### 2.3 Runtime Controls
- **Run**: Start continuous scan cycles
- **Stop**: Pause execution
- **Step**: Execute one scan cycle (debug mode)
- **Reset**: Clear all tags to defaults and restart

---

### 3. Watch Mode & Execution Visualization

#### 3.1 Ladder Diagram Animation
- **Power flow highlighting**:
  - Green glow on contacts/coils that are TRUE/energized
  - Gray on FALSE/de-energized
  - Animated flow from left power rail through logic to right rail
- **Coil state**: Clearly show which outputs are active
- **Timer/Counter status**: Display current values inline (e.g., TON: ET=3.2s)

#### 3.2 FBD Animation
- **Block highlighting**:
  - Green border on blocks with TRUE output
  - Wire color: Green for TRUE signals, gray for FALSE
- **Data values**: Show integer/real values on wires (e.g., "42")

#### 3.3 Update Rate
- **Live updates every scan cycle**
- **Smooth animations**: CSS transitions for visual appeal
- **Performance target**: 60 FPS even with 200 rungs

---

### 4. I/O Panel

#### 4.1 Digital Inputs (7 total)
| Address | Description | UI Element |
|---------|-------------|------------|
| %I0.0   | Input 1     | Toggle switch |
| %I0.1   | Input 2     | Toggle switch |
| %I0.2   | Input 3     | Toggle switch |
| %I0.3   | Input 4     | Toggle switch |
| %I0.4   | Input 5     | Toggle switch |
| %I0.5   | Input 6     | Toggle switch |
| %I0.6   | Input 7     | Toggle switch |

- **Momentary mode**: Hold a key (e.g., Shift+Click) for momentary contact
- **Keyboard shortcuts**: Number keys 1-7 toggle inputs

#### 4.2 Digital Outputs (7 total)
| Address | Description | UI Element |
|---------|-------------|------------|
| %Q0.0   | Output 1    | Indicator lamp (red/green) |
| %Q0.1   | Output 2    | Indicator lamp (red/green) |
| %Q0.2   | Output 3    | Indicator lamp (red/green) |
| %Q0.3   | Output 4    | Indicator lamp (red/green) |
| %Q0.4   | Output 5    | Indicator lamp (red/green) |
| %Q0.5   | Output 6    | Indicator lamp (red/green) |
| %Q0.6   | Output 7    | Indicator lamp (red/green) |

- **Real-time updates**: Outputs change immediately after scan cycle
- **Blinking support**: Timers can create blinking patterns (visible in UI)

#### 4.3 Visual Design
- **Panel layout**: Horizontal or vertical strip
- **Professional styling**: Industrial gray, clear labels
- **Status indicators**: Show PLC run/stop state

---

### 5. Tag System

#### 5.1 Data Types
| Type | Description | Size | Example Value |
|------|-------------|------|---------------|
| BOOL | Boolean | 1 bit | TRUE, FALSE |
| INT | Integer | 16-bit signed | -32768 to 32767 |
| DINT | Double Integer | 32-bit signed | -2147483648 to 2147483647 |
| REAL | Floating point | 32-bit | 3.14159, -0.001 |
| TIME | Time duration | 32-bit ms | T#5s, T#100ms |
| TIMER | Timer instance | Struct | (TON/TOF/TP) |
| COUNTER | Counter instance | Struct | (CTU/CTD/CTUD) |

#### 5.2 Structured Tags (Simple)
- **User-defined types**: Group related tags
- **Example**:
  ```
  Motor : STRUCT
      Start : BOOL;
      Stop : BOOL;
      Running : BOOL;
      Hours : INT;
  END_STRUCT
  ```
- **Dot notation**: Access with `Motor.Start`

#### 5.3 Tag Table
- **Spreadsheet-like interface**:
  - Columns: Name, Type, Address (optional), Initial Value, Comment
- **Auto-complete**: Suggest existing tags
- **Validation**: Prevent duplicate names, invalid types
- **Import/Export**: CSV support

#### 5.4 Addressing
- **Absolute**: `%I0.0`, `%Q0.0`, `%M0.0` (memory bits)
- **Symbolic**: `StartButton`, `MotorRunning`, etc.
- **Mixed**: Allow both, prefer symbolic for readability

---

### 6. Watch Table

#### 6.1 Features
- **Pin tags**: Add any tag to watch list
- **Live values**: Update every scan cycle
- **Column layout**: Name, Type, Current Value, Comment
- **Force values**: Manually override for testing (with visual indicator)
- **Data format**: Decimal, Hex, Binary display options

#### 6.2 Value Display
- **BOOL**: TRUE/FALSE with color coding (green/gray)
- **INT/DINT**: Numeric display
- **REAL**: Fixed decimal places (e.g., 2 decimals)
- **TIMER**: `ET=3.45s / PT=5.0s` format
- **COUNTER**: `CV=42 / PV=100` format

---

### 7. Project System

#### 7.1 Project Structure
```
MyProject.plcproj (JSON file)
├─ metadata
│  ├─ name: "Start-Stop Motor"
│  ├─ version: "1.0"
│  ├─ author: "Student Name"
│  └─ created: "2025-01-15T10:30:00Z"
├─ tags (tag table)
├─ program
│  └─ ir (intermediate representation)
└─ configuration
   └─ scan_time_ms: 100
```

#### 7.2 File Operations
- **New Project**: Template with basic tags
- **Open**: JSON file browser
- **Save**: Overwrite current file
- **Save As**: Choose new filename
- **Recent Projects**: Quick access list (max 10)

#### 7.3 Auto-save
- **Interval**: Every 60 seconds if unsaved changes
- **Recovery**: Restore from auto-save on crash

---

### 8. Lesson Mode

#### 8.1 Lesson Structure
Each lesson includes:
- **Title**: "Lesson 3: Motor Interlock"
- **Description**: 2-3 paragraph explanation of the goal
- **Objective**: Bullet list of requirements
- **Starter project**: Pre-configured tags and partial logic (optional)
- **Test harness**: Scripted input sequences with expected output validation

#### 8.2 Example Lesson: "Start-Stop Motor Control"
**Objective**: Create a motor control with start/stop buttons and a seal-in circuit.

**Requirements**:
- Input `%I0.0` (StartButton) starts the motor
- Input `%I0.1` (StopButton) stops the motor
- Output `%Q0.0` (MotorRunning) indicates motor state
- Motor stays running after StartButton is released (seal-in)
- StopButton always overrides

**Test Cases**:
1. Initially, all OFF → MotorRunning should be FALSE
2. Press Start → MotorRunning TRUE
3. Release Start → MotorRunning stays TRUE
4. Press Stop → MotorRunning FALSE
5. Press Start & Stop together → MotorRunning FALSE (Stop priority)

**Validation**: Test harness runs automatically and shows pass/fail.

#### 8.3 Lesson Library (v1.0)
1. **Basic Start-Stop**: Simple seal-in circuit
2. **Interlock/Permissive**: Two motors that can't run simultaneously
3. **Fault Latch & Reset**: Fault condition latches until manual reset
4. **Timer Blinking**: Use TON/TOF to create 1s on/off blinking
5. **Counter Batching**: Count items and stop at batch size
6. **Simple State Machine**: 3-state sequence (Idle → Running → Complete)

#### 8.4 Lesson UI
- **Lesson panel**: Left sidebar with lesson list
- **Instructions**: Collapsible panel with objective
- **Validate button**: Run test harness
- **Results**: Pass/fail for each test case with details
- **Hint system**: Progressive hints (optional)

---

### 9. Instruction Palette

#### 9.1 Organization
Categories in collapsible tree:
- **Bit Logic**
  - Contacts: `--|  |--` (NO), `--| / |--` (NC)
  - Coils: `--( )--` (Output), `--(S)--` (Set), `--(R)--` (Reset)
  - Edge: `--|P|--` (Rising), `--|N|--` (Falling)
- **Comparison**
  - EQ, NE, LT, GT, LE, GE (all with two inputs, one bool output)
- **Math**
  - ADD, SUB, MUL, DIV, MOD (two numeric inputs, one output)
- **Move**
  - MOVE (one input, one output)
- **Timers**
  - TON (IN, PT → Q, ET)
  - TOF (IN, PT → Q, ET)
  - TP (IN, PT → Q, ET)
- **Counters**
  - CTU (CU, R, PV → Q, CV)
  - CTD (CD, LD, PV → Q, CV)
  - CTUD (CU, CD, R, LD, PV → QU, QD, CV)
- **Latches**
  - SR (Set-dominant latch: S1, R → Q1)
  - RS (Reset-dominant latch: S, R1 → Q1)

#### 9.2 Drag-and-Drop
- **Source**: Palette item
- **Target**: Ladder rung or FBD canvas
- **Feedback**: Visual highlight of valid drop zones
- **Properties panel**: Configure tag bindings after placing

---

### 10. Non-Functional Requirements

#### 10.1 Performance
- **Scan cycle**: < 10ms for 200 rungs
- **UI rendering**: 60 FPS animations
- **Project load**: < 2s for typical projects
- **Memory usage**: < 200 MB RAM

#### 10.2 Usability
- **Learning curve**: New user productive in < 15 minutes
- **Keyboard shortcuts**: All major actions
- **Undo/Redo**: Full history (100 actions)
- **Responsive layout**: Minimum 1280x720 resolution

#### 10.3 Reliability
- **Crash recovery**: Auto-save and restore
- **Input validation**: Prevent invalid programs
- **Error messages**: Clear, actionable feedback

#### 10.4 Maintainability
- **Type-safe**: TypeScript throughout
- **Test coverage**: > 80% for runtime and IR
- **Documentation**: Inline JSDoc, architecture docs
- **Modular architecture**: Clear separation of concerns

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand (lightweight, simple)
- **Styling**: Tailwind CSS + CSS Modules for components
- **Drag-and-Drop**: react-dnd or custom implementation
- **Code Editor**: Monaco Editor (for SCL)
- **Canvas Rendering**: HTML5 Canvas or SVG for LAD/FBD

### Backend (Electron Main Process)
- **Runtime**: Node.js 18+
- **File I/O**: Native fs module
- **Project Format**: JSON with schema validation (Zod)

### Desktop Packaging
- **Platform**: Electron 28+
- **Builder**: electron-builder
- **Installer**: NSIS (Windows), DMG (macOS)

### Testing
- **Unit Tests**: Vitest
- **Integration Tests**: Playwright
- **Runtime Tests**: Custom test harness for scan cycle validation

### Build Tools
- **Bundler**: Vite
- **Linter**: ESLint
- **Formatter**: Prettier
- **Type Checking**: TypeScript strict mode

---

## Success Metrics

### Education Goals
- **Completion rate**: > 70% of users complete at least 3 lessons
- **Skill transfer**: Users report confidence using real PLCs

### Technical Goals
- **Zero crashes**: During normal operation
- **Fast iteration**: Save/load/run cycle < 3 seconds
- **Accurate simulation**: Timer accuracy within 10ms

### Community Goals
- **Open-source adoption**: GitHub stars, forks, contributions
- **Feedback incorporation**: Iterative improvements based on user input

---

## Out of Scope (v1.0)

- Analog I/O (only digital in v1.0)
- Communication protocols (Modbus, Profinet, etc.)
- HMI designer
- Recipe management
- Data logging / trending
- Multi-CPU configurations
- Advanced SCL (loops, arrays, pointers)
- Online editing (edit while running)
- Export to real PLC formats (Step 7, Studio 5000, etc.)
- User authentication / cloud sync

---

## Future Roadmap (v2.0+)

1. **Analog I/O**: 4 analog inputs, 2 analog outputs
2. **Advanced SCL**: FOR/WHILE loops, CASE statements, arrays
3. **User-defined functions**: Create reusable function blocks
4. **Recipe system**: Store and recall parameter sets
5. **HMI panel**: Basic button/indicator screen designer
6. **Import/Export**: Convert to/from other PLC formats
7. **Collaborative editing**: Multi-user projects
8. **Mobile app**: iOS/Android simulator companion

---

## Appendix A: Glossary

- **PLC**: Programmable Logic Controller
- **LAD**: Ladder Diagram
- **FBD**: Function Block Diagram
- **SCL**: Structured Control Language (Siemens' ST dialect)
- **ST**: Structured Text (IEC 61131-3 standard)
- **IR**: Intermediate Representation
- **Rung**: One horizontal row of ladder logic
- **Network**: A group of rungs or FBD elements
- **Scan Cycle**: One iteration of input read → logic execution → output write
- **Watch Mode**: Real-time monitoring of program execution
- **Seal-in**: Self-holding circuit (output feedback to maintain state)

---

## Appendix B: Reference Standards

- **IEC 61131-3**: Programmable controllers - Part 3: Programming languages
- **IEC 61499**: Function blocks for industrial process measurement and control systems

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: PLC Trainer IDE Team
