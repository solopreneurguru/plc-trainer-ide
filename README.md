# PLC Trainer IDE

A lightweight, self-contained PLC programming trainer IDE for learning Ladder Diagram (LAD), Function Block Diagram (FBD), and Structured Control Language (SCL). Built with Electron, React, and TypeScript.

## Features

- **Three Programming Languages**: Edit in Ladder, FBD, or SCL with automatic synchronization
- **Live Watch Mode**: Real-time power flow visualization showing which logic is energized
- **Simulated PLC Runtime**: Full scan cycle simulation with timers, counters, and edge detection
- **I/O Panel**: 7 digital inputs (toggles) and 7 digital outputs (indicator lamps)
- **Watch Table**: Monitor tag values in real-time with forced value support
- **Tag System**: Support for BOOL, INT, DINT, REAL, TIME, TIMER, COUNTER, and structured tags
- **Lesson Mode**: Guided learning with auto-validation test harness
- **Project Management**: Save/load projects as JSON with auto-save support

## Project Status

**Phase 0: Project Setup ✅ COMPLETE**

The project foundation has been established with:
- Complete design documentation
- Project structure and build configuration
- Core IR (Intermediate Representation) type system
- TypeScript strict mode with Zod validation
- Electron + React + Vite development environment

**Next Steps**: Phase 1 implementation (Runtime Engine + LAD Editor)

## Documentation

Comprehensive design documents are available in the `docs/` directory:

### Core Documentation

1. **[PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)** - Complete product specification including:
   - Feature requirements for all three programming languages
   - Instruction set (contacts, coils, timers, counters, math, comparison, etc.)
   - I/O panel specification (7 inputs, 7 outputs)
   - Watch mode and execution visualization
   - Tag system and data types
   - Lesson mode and test harness
   - Technology stack and architecture decisions

2. **[IR_SCHEMA_DESIGN.md](docs/IR_SCHEMA_DESIGN.md)** - Intermediate Representation design:
   - Unified IR that represents LAD, FBD, and SCL programs
   - Expression and statement types
   - Translation examples from each language to IR
   - Execution model and runtime context
   - Validation rules

3. **[ENGINEERING_ARCHITECTURE.md](docs/ENGINEERING_ARCHITECTURE.md)** - System architecture:
   - 4-layer architecture (Presentation, Business Logic, Runtime, Persistence)
   - Module breakdown by agent responsibility
   - IPC communication between Electron main and renderer
   - State management with Zustand
   - Performance targets and optimization strategies
   - Testing strategy

4. **[UI_WIREFRAMES.md](docs/UI_WIREFRAMES.md)** - UI design specifications:
   - ASCII wireframes for all major screens
   - Component hierarchy and layout
   - LAD/FBD/SCL editor designs
   - I/O panel, watch table, and tag table specifications
   - Keyboard shortcuts and accessibility
   - Color scheme and theming

5. **[TASK_BACKLOG.md](docs/TASK_BACKLOG.md)** - Detailed implementation plan:
   - Phase-by-phase task breakdown
   - Checklists for each feature
   - Estimated hours per task
   - Agent assignments for parallel development
   - Total MVP timeline: ~445 hours (11-13 weeks for 1 developer)

## Directory Structure

```
plc-trainer-ide/
├── docs/                          # Design documentation
├── src/
│   ├── main/                      # Electron main process
│   │   └── ipc/                   # IPC handlers
│   ├── renderer/                  # React UI
│   │   ├── ui/                    # UI components
│   │   │   ├── editors/           # LAD, FBD, SCL editors
│   │   │   ├── io/                # I/O panel
│   │   │   ├── watch/             # Watch table
│   │   │   ├── tags/              # Tag table
│   │   │   ├── lesson/            # Lesson mode
│   │   │   └── palette/           # Instruction palette
│   │   └── store/                 # Zustand state management
│   ├── core/                      # Core business logic
│   │   ├── ir/                    # IR types and validation ✅ CREATED
│   │   ├── project/               # Project management
│   │   └── tags/                  # Tag table
│   ├── compilers/                 # Language → IR
│   │   ├── lad-to-ir/
│   │   ├── fbd-to-ir/
│   │   └── scl-to-ir/
│   ├── decompilers/               # IR → Language
│   │   ├── ir-to-lad/
│   │   ├── ir-to-fbd/
│   │   └── ir-to-scl/
│   ├── runtime/                   # PLC simulator
│   │   ├── engine/                # Scan cycle engine
│   │   ├── instructions/          # Timers, counters, math
│   │   └── edge-detection/
│   └── lessons/                   # Lesson definitions
└── tests/                         # Automated tests
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Windows (primary target), macOS/Linux (future)

### Installation

```bash
# Install dependencies
cd ~/plc-trainer-ide
npm install
```

### Development

```bash
# Run in development mode (hot reload)
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Build

```bash
# Build for production
npm run build

# Package as Electron app
npm run package

# Create installer (Windows NSIS)
npm run dist
```

## Technology Stack

- **Framework**: Electron 28+ with React 18
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite
- **State Management**: Zustand
- **Validation**: Zod (runtime schema validation)
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (for SCL)
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Implementation Phases

### Phase 1: Core Runtime + LAD Editor (5-6 weeks)
- ⬜ PLC runtime engine with scan cycle
- ⬜ Timers (TON, TOF, TP) and Counters (CTU, CTD, CTUD)
- ⬜ Edge detection (rising/falling)
- ⬜ Ladder Diagram editor with drag-and-drop
- ⬜ Watch mode with power flow highlighting
- ⬜ I/O panel (7 inputs, 7 outputs)
- ⬜ Watch table and Tag table
- ⬜ Project save/load (JSON)
- ⬜ 3 example lessons with validation

### Phase 2: FBD Editor (2-3 weeks)
- ⬜ Function Block Diagram editor
- ⬜ FBD-to-IR compiler
- ⬜ IR-to-FBD decompiler
- ⬜ LAD ↔ FBD synchronization
- ⬜ Watch mode for FBD

### Phase 3: SCL Editor (1.5-2 weeks)
- ⬜ SCL parser (lexer + parser)
- ⬜ SCL-to-IR compiler
- ⬜ IR-to-SCL decompiler
- ⬜ LAD/FBD ↔ SCL synchronization
- ⬜ Monaco editor integration with syntax highlighting

### Phase 4: Packaging (1 week)
- ⬜ Electron builder configuration
- ⬜ Windows installer (NSIS)
- ⬜ Final testing and QA
- ⬜ Documentation and user guide

## Contributing

This is an educational project. Contributions are welcome! Please:
1. Follow the existing code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation
4. Create descriptive commit messages

## License

MIT License - See LICENSE file for details

## Architecture Highlights

### Intermediate Representation (IR)

The IR is the heart of the system, enabling seamless translation between LAD, FBD, and SCL:

- **Single source of truth**: All three languages compile to the same IR
- **Type-safe**: Zod schemas validate IR structure at runtime
- **Executable**: Runtime engine directly executes IR
- **Preserves metadata**: Layout hints allow visual editors to maintain user preferences

### Scan Cycle

The PLC runtime simulates a realistic scan cycle:

1. **Read Inputs**: Snapshot all I/O panel inputs
2. **Execute Program**: Process IR statements in sequence
3. **Write Outputs**: Update I/O panel outputs
4. **Update Watch**: Send real-time data to UI for highlighting

Configurable scan time (10ms - 1000ms), default 100ms for responsive simulation.

### Watch Mode

Real-time visualization shows program execution:

- **LAD**: Green glow on energized contacts/coils, gray when de-energized
- **FBD**: Green borders on active blocks, colored wires (green=TRUE, gray=FALSE)
- **Timer/Counter values**: Display current ET/CV inline
- **60 FPS animations**: Smooth transitions powered by CSS

## Performance Targets

- **Runtime**: Execute 200 rungs in < 10ms per scan cycle
- **UI**: 60 FPS animations even with 200+ elements
- **Memory**: < 200 MB RAM for typical projects
- **Load time**: < 2 seconds for project files

## Future Roadmap (v2.0+)

- Analog I/O (4 AI, 2 AO)
- Advanced SCL (FOR/WHILE loops, CASE, arrays)
- User-defined functions and function blocks
- Recipe system (parameter sets)
- HMI designer (basic buttons/indicators)
- Import/export from other PLC formats
- Collaborative editing
- Mobile companion app

## Acknowledgments

Inspired by professional PLC development tools like Siemens TIA Portal, Rockwell Studio 5000, and Schneider EcoStruxture, but designed as an open, accessible learning platform.

---

**Status**: Phase 0 Complete ✅ | Ready for Phase 1 Implementation

**Last Updated**: 2025-01-15
