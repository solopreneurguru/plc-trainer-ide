# Engineering Architecture Plan

## System Overview

The PLC Trainer IDE is a desktop application built with Electron, featuring a React-based UI and a Node.js backend for the PLC runtime simulation engine. The architecture follows clean separation of concerns with distinct layers for presentation, business logic, and data persistence.

```
┌─────────────────────────────────────────────────────────┐
│                  Electron Shell                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │            React UI (Renderer Process)             │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │ │
│  │  │ LAD      │  │ FBD      │  │ SCL      │        │ │
│  │  │ Editor   │  │ Editor   │  │ Editor   │        │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │ │
│  │       └──────────────┼──────────────┘              │ │
│  │                      │                             │ │
│  │  ┌─────────────────┬┴┬────────────────┐          │ │
│  │  │   IR Manager    │ │  UI Components │          │ │
│  │  │  (Zustand Store)│ │  - I/O Panel   │          │ │
│  │  └────────┬────────┘ │  - Watch Table │          │ │
│  │           │          │  - Tag Table   │          │ │
│  │           │          └────────────────┘          │ │
│  └───────────┼─────────────────────────────────────┘ │
│              │ IPC (Electron)                        │
│  ┌───────────┼─────────────────────────────────────┐ │
│  │           │    Main Process (Node.js)           │ │
│  │  ┌────────▼────────┐  ┌────────────────┐       │ │
│  │  │ PLC Runtime     │  │ File System    │       │ │
│  │  │ Engine          │  │ Manager        │       │ │
│  │  │ - Scan Cycle    │  │ - Save/Load    │       │ │
│  │  │ - Tag Memory    │  │ - Project JSON │       │ │
│  │  │ - Instruction   │  └────────────────┘       │ │
│  │  │   Executor      │                           │ │
│  │  └─────────────────┘                           │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### Layer 1: Presentation (React UI)

**Responsibilities:**
- Render visual editors (LAD, FBD, SCL)
- Handle user interactions (drag-and-drop, clicks, keyboard)
- Display real-time watch mode animations
- Manage I/O panel toggles and indicators
- Show watch table and tag table

**Key Technologies:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- React DnD for drag-and-drop

**Component Hierarchy:**
```
<App>
  <AppShell>
    <Sidebar>
      <ProjectExplorer />
      <InstructionPalette />
    </Sidebar>
    <MainContent>
      <EditorTabs>
        <LADEditor />
        <FBDEditor />
        <SCLEditor />
      </EditorTabs>
    </MainContent>
    <RightPanel>
      <IOPanel />
      <WatchTable />
    </RightPanel>
  </AppShell>
  <BottomPanel>
    <TagTable />
    <LessonPanel />
  </BottomPanel>
</App>
```

---

### Layer 2: Business Logic (Core Modules)

**Responsibilities:**
- Intermediate Representation (IR) management
- Language compilers (LAD/FBD/SCL → IR)
- Language decompilers (IR → LAD/FBD/SCL)
- IR validation and semantic checking
- Lesson mode test harness

**Key Modules:**

#### 2.1 IR Manager
- **Location:** `src/core/ir/`
- **Exports:**
  - `IRManager` class: CRUD operations on IR
  - `validateIR()`: Semantic validation
  - `optimizeIR()`: Optional IR optimization

#### 2.2 Compilers
- **LAD Compiler:** `src/compilers/lad-to-ir/`
  - Parse ladder rung structure
  - Convert contacts/coils to expressions
  - Handle branches (parallel paths)
- **FBD Compiler:** `src/compilers/fbd-to-ir/`
  - Parse FBD network topology
  - Resolve block connections
  - Generate statement order based on data flow
- **SCL Compiler:** `src/compilers/scl-to-ir/`
  - Lexer/Parser (PEG.js or custom)
  - AST generation
  - AST → IR translation

#### 2.3 Decompilers
- **IR-to-LAD Generator:** `src/decompilers/ir-to-lad/`
  - Convert expressions to ladder rungs
  - Generate branches for OR operations
  - Optimize layout for readability
- **IR-to-FBD Generator:** `src/decompilers/ir-to-fbd/`
  - Map statements to blocks
  - Generate wire connections
  - Auto-layout algorithm
- **IR-to-SCL Generator:** `src/decompilers/ir-to-scl/`
  - Pretty-print SCL code
  - Handle indentation and formatting

---

### Layer 3: Runtime Execution (PLC Simulator)

**Responsibilities:**
- Execute IR programs in scan cycles
- Maintain tag memory (symbol table)
- Implement built-in functions (timers, counters, math)
- Handle edge detection
- Provide watch mode data (highlighted elements)

**Key Modules:**

#### 3.1 Execution Engine
- **Location:** `src/runtime/engine/`
- **Core Class:** `PLCRuntime`

```typescript
class PLCRuntime {
  private context: ExecutionContext;
  private scanInterval: NodeJS.Timer | null;
  private scanTimeMs: number;

  constructor(program: Program, scanTimeMs: number = 100) {
    this.context = initializeContext(program);
    this.scanTimeMs = scanTimeMs;
  }

  start(): void {
    this.scanInterval = setInterval(() => {
      this.executeScanCycle();
    }, this.scanTimeMs);
  }

  stop(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  step(): void {
    this.executeScanCycle();
  }

  reset(): void {
    this.context = initializeContext(this.program);
  }

  private executeScanCycle(): void {
    // 1. Read inputs
    this.readInputs();

    // 2. Execute program
    for (const ob of this.program.organization_blocks) {
      for (const network of ob.networks) {
        this.executeNetwork(network);
      }
    }

    // 3. Write outputs
    this.writeOutputs();

    // 4. Notify UI (via IPC)
    this.notifyWatchUpdate();
  }

  private executeNetwork(network: Network): void {
    for (const statement of network.statements) {
      this.executeStatement(statement);
    }
  }

  // ... (rest of execution logic from IR_SCHEMA_DESIGN.md)
}
```

#### 3.2 Instruction Library
- **Location:** `src/runtime/instructions/`
- **Functions:**
  - `executeTimerTON(instance, inputs, context): outputs`
  - `executeTimerTOF(instance, inputs, context): outputs`
  - `executeTimerTP(instance, inputs, context): outputs`
  - `executeCounterCTU(instance, inputs, context): outputs`
  - `executeCounterCTD(instance, inputs, context): outputs`
  - `executeCounterCTUD(instance, inputs, context): outputs`
  - `executeLatchSR(inputs, context): outputs`
  - `executeLatchRS(inputs, context): outputs`

#### 3.3 Edge Detection
- **Location:** `src/runtime/edge-detection/`
- **Algorithm:**
  ```typescript
  function detectRisingEdge(tag: string, currentValue: boolean, context: ExecutionContext): boolean {
    const prevValue = context.edge_memory.get(tag) || false;
    context.edge_memory.set(tag, currentValue);
    return currentValue && !prevValue;  // 0 → 1 transition
  }

  function detectFallingEdge(tag: string, currentValue: boolean, context: ExecutionContext): boolean {
    const prevValue = context.edge_memory.get(tag) || false;
    context.edge_memory.set(tag, currentValue);
    return !currentValue && prevValue;  // 1 → 0 transition
  }
  ```

---

### Layer 4: Data Persistence

**Responsibilities:**
- Save/load projects as JSON
- Manage recent projects list
- Auto-save functionality
- Import/export tag tables (CSV)

**Key Modules:**

#### 4.1 Project Manager
- **Location:** `src/core/project/`
- **Class:** `ProjectManager`

```typescript
class ProjectManager {
  saveProject(project: Project, filePath: string): Promise<void>;
  loadProject(filePath: string): Promise<Project>;
  autoSave(project: Project): Promise<void>;  // Every 60s
  getRecentProjects(): string[];
  addRecentProject(filePath: string): void;
}
```

#### 4.2 Project Schema
```typescript
interface Project {
  metadata: {
    name: string;
    version: string;
    author: string;
    created: string;  // ISO 8601
    modified: string;
  };
  tags: TagDefinition[];
  program: Program;  // IR
  configuration: {
    scan_time_ms: number;
  };
}

interface TagDefinition {
  name: string;
  data_type: DataType;
  address?: string;
  initial_value?: any;
  comment?: string;
}
```

---

## Communication Architecture (IPC)

### Electron IPC Channels

**Main → Renderer (Push Updates):**
- `runtime:watch-update` → `{ tags: {...}, highlights: [...] }`
- `runtime:scan-complete` → `{ scanNumber: 123, duration: 8 }`
- `project:saved` → `{ filePath: "..." }`

**Renderer → Main (Commands):**
- `runtime:start` ← `{ scanTimeMs: 100 }`
- `runtime:stop` ← `{}`
- `runtime:step` ← `{}`
- `runtime:reset` ← `{}`
- `runtime:set-input` ← `{ address: "%I0.0", value: true }`
- `project:save` ← `{ project: {...}, filePath: "..." }`
- `project:load` ← `{ filePath: "..." }`

**Example IPC Flow:**
```typescript
// Renderer: User clicks Start button
ipcRenderer.send('runtime:start', { scanTimeMs: 100 });

// Main: Runtime engine starts and sends updates
setInterval(() => {
  const watchData = runtime.getWatchData();
  mainWindow.webContents.send('runtime:watch-update', watchData);
}, 100);

// Renderer: React component receives update
useEffect(() => {
  const handler = (event, data) => {
    setWatchData(data);
  };
  ipcRenderer.on('runtime:watch-update', handler);
  return () => ipcRenderer.removeListener('runtime:watch-update', handler);
}, []);
```

---

## State Management (Zustand)

### Store Structure

```typescript
interface AppState {
  // Project
  project: Project | null;
  projectFilePath: string | null;
  isDirty: boolean;

  // Editor
  activeLanguage: 'LAD' | 'FBD' | 'SCL';
  selectedNetwork: string | null;

  // Runtime
  runtimeStatus: 'stopped' | 'running' | 'paused';
  watchData: WatchData;
  scanNumber: number;

  // UI
  isPaletteOpen: boolean;
  isWatchTableOpen: boolean;
  isLessonPanelOpen: boolean;

  // Actions
  loadProject: (filePath: string) => Promise<void>;
  saveProject: () => Promise<void>;
  setActiveLanguage: (lang: 'LAD' | 'FBD' | 'SCL') => void;
  startRuntime: () => void;
  stopRuntime: () => void;
  stepRuntime: () => void;
  toggleInput: (address: string) => void;
  // ... etc.
}

const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  project: null,
  projectFilePath: null,
  isDirty: false,
  activeLanguage: 'LAD',
  // ...

  // Actions
  loadProject: async (filePath) => {
    const project = await ipcRenderer.invoke('project:load', filePath);
    set({ project, projectFilePath: filePath, isDirty: false });
  },

  saveProject: async () => {
    const { project, projectFilePath } = get();
    await ipcRenderer.invoke('project:save', { project, filePath: projectFilePath });
    set({ isDirty: false });
  },

  // ... rest of actions
}));
```

---

## Module Breakdown by "Agent"

### Agent 1: IR Design & Validation
- **Files:**
  - `src/core/ir/types.ts` - Zod schemas and TypeScript types
  - `src/core/ir/validator.ts` - Semantic validation logic
  - `src/core/ir/optimizer.ts` - Optional IR optimization (future)

### Agent 2: Runtime Execution Engine
- **Files:**
  - `src/runtime/engine/PLCRuntime.ts` - Main runtime class
  - `src/runtime/engine/ExecutionContext.ts` - Context state management
  - `src/runtime/engine/StatementExecutor.ts` - Execute IR statements
  - `src/runtime/engine/ExpressionEvaluator.ts` - Evaluate expressions
  - `src/runtime/instructions/` - Built-in function implementations
  - `src/runtime/edge-detection/EdgeDetector.ts`
  - **Tests:** `tests/runtime/` - Unit tests for all runtime components

### Agent 3: LAD Editor UI
- **Files:**
  - `src/ui/editors/lad/LADEditor.tsx` - Main editor component
  - `src/ui/editors/lad/Rung.tsx` - Single rung component
  - `src/ui/editors/lad/LadderElement.tsx` - Contact/coil rendering
  - `src/ui/editors/lad/drag-drop/` - Drag-and-drop handlers
  - `src/ui/editors/lad/layout/RungLayoutEngine.ts` - Grid layout logic
  - `src/compilers/lad-to-ir/` - Compiler
  - `src/decompilers/ir-to-lad/` - Decompiler

### Agent 4: Watch/Highlighting System
- **Files:**
  - `src/ui/watch/WatchDataProvider.tsx` - IPC listener and state
  - `src/ui/watch/HighlightRenderer.tsx` - Visual highlighting logic
  - `src/ui/watch/WatchTable.tsx` - Watch table component
  - `src/runtime/engine/WatchDataCollector.ts` - Collect highlight data during execution

### Agent 5: FBD Editor UI
- **Files:**
  - `src/ui/editors/fbd/FBDEditor.tsx` - Canvas-based editor
  - `src/ui/editors/fbd/Block.tsx` - Block rendering
  - `src/ui/editors/fbd/Wire.tsx` - Wire rendering
  - `src/ui/editors/fbd/layout/AutoLayoutEngine.ts` - Block positioning
  - `src/compilers/fbd-to-ir/` - Compiler
  - `src/decompilers/ir-to-fbd/` - Decompiler

### Agent 6: SCL Subset Parser/Translator
- **Files:**
  - `src/compilers/scl-to-ir/Lexer.ts` - Tokenizer
  - `src/compilers/scl-to-ir/Parser.ts` - AST parser
  - `src/compilers/scl-to-ir/ASTToIR.ts` - AST → IR translator
  - `src/decompilers/ir-to-scl/SCLGenerator.ts` - IR → SCL code generator
  - `src/ui/editors/scl/SCLEditor.tsx` - Monaco editor wrapper
  - **Tests:** `tests/compilers/scl/` - Parser tests

### Agent 7: Lesson Mode / Test Harness
- **Files:**
  - `src/lessons/LessonManager.ts` - Load and manage lessons
  - `src/lessons/TestHarness.ts` - Execute test cases
  - `src/lessons/lessons/` - JSON lesson definitions
  - `src/ui/lesson/LessonPanel.tsx` - Lesson UI
  - `src/ui/lesson/ValidationResults.tsx` - Test results display

### Agent 8: Packaging / Build / Installer
- **Files:**
  - `electron-builder.yml` - Electron builder config
  - `scripts/build.sh` - Build script
  - `scripts/package.sh` - Packaging script
  - `.github/workflows/release.yml` - CI/CD for releases (future)

---

## Directory Structure

```
plc-trainer-ide/
├── docs/                          # Documentation
│   ├── PRODUCT_SPEC.md
│   ├── IR_SCHEMA_DESIGN.md
│   ├── ENGINEERING_ARCHITECTURE.md
│   ├── UI_WIREFRAMES.md
│   └── TASK_BACKLOG.md
│
├── design/                        # Design assets
│   ├── wireframes/
│   └── mockups/
│
├── src/
│   ├── main/                      # Electron main process
│   │   ├── index.ts               # Entry point
│   │   ├── ipc/                   # IPC handlers
│   │   │   ├── runtimeHandlers.ts
│   │   │   └── projectHandlers.ts
│   │   └── menu.ts                # Application menu
│   │
│   ├── renderer/                  # React UI (renderer process)
│   │   ├── index.tsx              # Entry point
│   │   ├── App.tsx                # Root component
│   │   ├── store/                 # Zustand stores
│   │   │   └── appStore.ts
│   │   └── ui/
│   │       ├── layout/
│   │       │   ├── AppShell.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   └── BottomPanel.tsx
│   │       ├── editors/
│   │       │   ├── lad/
│   │       │   ├── fbd/
│   │       │   └── scl/
│   │       ├── io/
│   │       │   └── IOPanel.tsx
│   │       ├── watch/
│   │       │   └── WatchTable.tsx
│   │       ├── tags/
│   │       │   └── TagTable.tsx
│   │       ├── lesson/
│   │       │   └── LessonPanel.tsx
│   │       └── palette/
│   │           └── InstructionPalette.tsx
│   │
│   ├── core/                      # Core business logic (shared)
│   │   ├── ir/
│   │   │   ├── types.ts
│   │   │   ├── validator.ts
│   │   │   └── IRManager.ts
│   │   ├── project/
│   │   │   ├── Project.ts
│   │   │   └── ProjectManager.ts
│   │   └── tags/
│   │       └── TagTable.ts
│   │
│   ├── compilers/                 # Language → IR
│   │   ├── lad-to-ir/
│   │   │   └── LADCompiler.ts
│   │   ├── fbd-to-ir/
│   │   │   └── FBDCompiler.ts
│   │   └── scl-to-ir/
│   │       ├── Lexer.ts
│   │       ├── Parser.ts
│   │       └── ASTToIR.ts
│   │
│   ├── decompilers/               # IR → Language
│   │   ├── ir-to-lad/
│   │   │   └── LADGenerator.ts
│   │   ├── ir-to-fbd/
│   │   │   └── FBDGenerator.ts
│   │   └── ir-to-scl/
│   │       └── SCLGenerator.ts
│   │
│   ├── runtime/                   # PLC simulator
│   │   ├── engine/
│   │   │   ├── PLCRuntime.ts
│   │   │   ├── ExecutionContext.ts
│   │   │   ├── StatementExecutor.ts
│   │   │   ├── ExpressionEvaluator.ts
│   │   │   └── WatchDataCollector.ts
│   │   ├── instructions/
│   │   │   ├── timers.ts
│   │   │   ├── counters.ts
│   │   │   ├── math.ts
│   │   │   └── latches.ts
│   │   └── edge-detection/
│   │       └── EdgeDetector.ts
│   │
│   ├── lessons/                   # Lesson mode
│   │   ├── LessonManager.ts
│   │   ├── TestHarness.ts
│   │   └── lessons/
│   │       ├── 01-start-stop.json
│   │       ├── 02-interlock.json
│   │       └── 03-fault-latch.json
│   │
│   └── utils/                     # Utilities
│       ├── logger.ts
│       └── uuid.ts
│
├── tests/                         # Automated tests
│   ├── runtime/
│   │   ├── PLCRuntime.test.ts
│   │   ├── timers.test.ts
│   │   └── counters.test.ts
│   ├── compilers/
│   │   ├── lad-to-ir.test.ts
│   │   ├── fbd-to-ir.test.ts
│   │   └── scl-to-ir.test.ts
│   └── integration/
│       └── end-to-end.test.ts
│
├── public/                        # Static assets
│   ├── icons/
│   └── lessons/
│
├── dist/                          # Build output
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.yml
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## Technology Decisions

### Why Electron?
- **Cross-platform**: Windows primary, macOS/Linux future
- **Rich UI**: Full web stack (React, CSS)
- **Node.js access**: File I/O, native modules if needed
- **Familiar**: Large community, mature ecosystem

### Why React?
- **Component-based**: Modular UI architecture
- **Performance**: Virtual DOM for efficient updates
- **Ecosystem**: Rich library support (DnD, canvas, etc.)
- **TypeScript**: Strong typing for safety

### Why Zustand over Redux?
- **Simpler**: Less boilerplate, easier learning curve
- **Performance**: Fine-grained subscriptions
- **TypeScript**: Excellent type inference
- **Size**: Smaller bundle (~1KB vs ~8KB)

### Why Zod for Validation?
- **TypeScript-first**: Infer types from schemas
- **Runtime safety**: Validate JSON at load time
- **Composable**: Build complex schemas from primitives
- **Error messages**: Clear, actionable validation errors

### Why Vitest over Jest?
- **Fast**: Vite-powered, near-instant feedback
- **ESM-native**: Modern JavaScript support
- **Compatible**: Jest-like API, easy migration
- **Integrated**: Works seamlessly with Vite build

---

## Performance Considerations

### 1. Runtime Execution
**Target**: Execute 200 rungs in < 10ms per scan cycle

**Optimizations:**
- Pre-compile IR to bytecode (future)
- Cache tag lookups in hash maps
- Avoid deep cloning; use immutable updates only where needed
- Batch UI updates (throttle watch updates to 60 FPS)

### 2. UI Rendering
**Target**: 60 FPS animations even with 200 elements

**Optimizations:**
- Use `React.memo()` for ladder/FBD elements
- Canvas rendering for complex diagrams (FBD)
- Virtualize long tag tables (react-virtual)
- CSS transforms for animations (GPU-accelerated)
- Debounce expensive operations (layout recalculation)

### 3. Memory Usage
**Target**: < 200 MB RAM for typical projects

**Monitoring:**
- Profile with Chrome DevTools
- Avoid memory leaks in IPC listeners
- Clear old watch data (keep only last N scans)

---

## Testing Strategy

### Unit Tests (Vitest)
**Coverage target**: > 80% for core modules

**Test suites:**
1. **Runtime Tests:**
   - Timer accuracy (TON, TOF, TP)
   - Counter behavior (CTU, CTD, CTUD)
   - Edge detection (rising, falling)
   - Expression evaluation
   - Statement execution

2. **Compiler Tests:**
   - LAD-to-IR: Contacts, coils, branches
   - FBD-to-IR: Block ordering, wire resolution
   - SCL-to-IR: Parsing, syntax errors, AST generation

3. **IR Validation Tests:**
   - Type checking
   - Circular reference detection
   - Invalid operands

### Integration Tests (Playwright)
**Scenarios:**
1. Load project → Run → Verify outputs
2. Edit LAD → Switch to FBD → Verify synchronization
3. Create lesson → Validate → Pass all tests
4. Save project → Close → Reopen → Verify state

### Manual Testing Checklist
- [ ] Drag-and-drop instructions
- [ ] Keyboard shortcuts
- [ ] Undo/redo
- [ ] Auto-save recovery
- [ ] Blinking outputs with timers
- [ ] Edge detection visual feedback
- [ ] Watch table live updates

---

## Security & Safety

### Input Validation
- Validate all IPC messages (Zod schemas)
- Sanitize file paths (prevent directory traversal)
- Limit project file size (< 10 MB)

### Sandboxing
- Enable Electron's `contextIsolation`
- Disable `nodeIntegration` in renderer
- Use `preload.js` for controlled IPC exposure

### Error Handling
- Catch all runtime errors (no crashes)
- Display user-friendly error messages
- Log errors for debugging (console + file)

---

## Deployment & Distribution

### Build Process
```bash
# Development
npm run dev          # Start Vite + Electron in dev mode

# Production Build
npm run build        # Compile TypeScript + bundle React
npm run package      # Create Electron app package
npm run dist         # Build installer (NSIS for Windows)
```

### Installer (electron-builder)
**Windows:**
- NSIS installer (`.exe`)
- Auto-update support (future)
- Desktop shortcut
- Start menu entry

**Configuration:**
```yaml
# electron-builder.yml
appId: com.plctrainer.ide
productName: PLC Trainer IDE
directories:
  output: dist
  buildResources: build
files:
  - "dist/**/*"
  - "public/**/*"
win:
  target: nsis
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: always
  createStartMenuShortcut: true
```

---

## Future Extensibility

### Plugin System (v2.0)
- Allow custom instructions
- Custom visual themes
- Third-party lesson packs

### Cloud Sync (v2.0)
- Save projects to cloud storage
- Collaborative editing
- Version history

### Advanced Features (v3.0)
- Analog I/O simulation
- HMI designer
- Data logging and trending
- Export to real PLC formats

---

## Development Workflow

### Branching Strategy (Git)
- `main` - Production-ready releases
- `develop` - Integration branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes

### Code Review Process
- Pull requests required for all merges
- At least one reviewer
- Automated tests must pass
- Linter and formatter checks

### Release Process
1. Merge `develop` → `main`
2. Tag version (e.g., `v1.0.0`)
3. Build installer
4. Publish GitHub release
5. Update documentation

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| IR design too complex | High | Incremental design, validate with examples |
| Performance bottleneck | Medium | Profiling, optimize hot paths |
| LAD/FBD layout ambiguity | Medium | Heuristics, allow manual adjustment |
| SCL parser bugs | Medium | Extensive unit tests, PEG.js for robustness |
| Electron security issues | High | Follow best practices, regular updates |
| Scope creep | High | Strict MVP definition, backlog prioritization |

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
