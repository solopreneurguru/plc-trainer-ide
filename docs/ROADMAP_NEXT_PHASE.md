# PLC Trainer IDE - Next Phase Roadmap

**Last Updated:** 2026-01-15
**Current Version:** v0.4.0-alpha
**Target Version:** v1.0.0-beta (Phase 1 Complete)

---

## Vision Alignment

Our original vision is to create a **complete PLC programming trainer inspired by Siemens TIA Portal** with:
- ✅ Multiple programming languages (LAD, FBD, SCL)
- ✅ Interchangeable views via intermediate representation
- ✅ Real-time watch mode with power flow animation
- ✅ Simulated I/O panel
- ✅ Drag-and-drop instruction palette
- ✅ Tag system with various data types
- ✅ Timers, counters, and full instruction set
- ✅ Save/load project system
- ✅ Educational lesson mode

**Current State:** We have the foundation (IR runtime, basic LAD visualization, I/O panel). Now we build out the full feature set.

---

## Development Strategy

### Phase 1A: Core Instructions (CURRENT PRIORITY)
**Goal:** Make the runtime support all essential PLC instructions
**Timeline:** 2 weeks
**Effort:** ~24 hours

This phase adds the "meat" to our runtime - the actual PLC instructions students need to learn.

### Phase 1B: Essential UI Components
**Goal:** Add interfaces for tag management and watching values
**Timeline:** 2 weeks
**Effort:** ~26 hours

These UI components enable users to define variables and monitor execution.

### Phase 1C: Full LAD Editor
**Goal:** Transform visualization into full drag-and-drop editor
**Timeline:** 3 weeks
**Effort:** ~38 hours

This enables users to actually create and edit ladder programs visually.

### Phase 1D: Project System & Lessons
**Goal:** Save/load projects and educational lesson mode
**Timeline:** 3 weeks
**Effort:** ~37 hours

Final pieces to make it a complete learning tool.

**Total Phase 1:** ~10 weeks, ~125 hours

---

## Phase 1A: Core Instructions (Weeks 1-2)

### Sprint Goal
Add timers, counters, edge detection, and latches to make the runtime feature-complete for basic PLC programming.

### Tasks

#### Task 1A.1: Implement Timer Instructions ⭐ HIGH PRIORITY
**Estimated Time:** 10 hours
**Assigned To:** Agent 2 (Runtime Engine)

**Requirements:**
- Implement `TON` (On-Delay Timer)
  - IN=TRUE → count up to PT
  - Q=TRUE when ET >= PT
  - IN=FALSE → reset ET to 0
- Implement `TOF` (Off-Delay Timer)
  - IN=FALSE → count up to PT
  - Q=FALSE when ET >= PT
  - IN=TRUE → reset ET to 0
- Implement `TP` (Pulse Timer)
  - IN rising edge → Q=TRUE for PT duration
  - One-shot pulse

**Deliverables:**
- `src/runtime/ir/instructions/timers.ts`
- Timer instance management in TagStore
- Unit tests (30+ test cases)
  - Timing accuracy within 10ms
  - Reset behavior
  - Multiple timers simultaneously
  - Edge cases (zero PT, very long PT)

**Integration:**
- Update IR types to support Timer function calls
- Update ExpressionEvaluator to handle timer instance reads (Timer1.Q, Timer1.ET)
- Update StatementExecutor to execute timer call statements

**Success Criteria:**
- All timer tests pass
- Blinking output demo works (TON + TOF pattern)
- Timer values visible in watch mode

---

#### Task 1A.2: Implement Counter Instructions ⭐ HIGH PRIORITY
**Estimated Time:** 8 hours
**Assigned To:** Agent 2 (Runtime Engine)

**Requirements:**
- Implement `CTU` (Count Up)
  - CU rising edge → CV++
  - R=TRUE → CV=0
  - Q=TRUE when CV >= PV
- Implement `CTD` (Count Down)
  - CD rising edge → CV--
  - LD=TRUE → CV=PV
  - Q=TRUE when CV <= 0
- Implement `CTUD` (Count Up/Down)
  - Combined functionality
  - QU=TRUE when CV >= PV
  - QD=TRUE when CV <= 0

**Deliverables:**
- `src/runtime/ir/instructions/counters.ts`
- Counter instance management in TagStore
- Unit tests (25+ test cases)

**Success Criteria:**
- All counter tests pass
- Batch counting demo works (count to 10)
- Counter values visible in watch mode

---

#### Task 1A.3: Implement Edge Detection ⭐ HIGH PRIORITY
**Estimated Time:** 3 hours
**Assigned To:** Agent 2 (Runtime Engine)

**Requirements:**
- Rising edge detection (P) - 0 → 1 transition
- Falling edge detection (N) - 1 → 0 transition
- Store previous values in edge memory
- Handle first scan (no previous value)

**Deliverables:**
- Update ExpressionEvaluator to support `operand.edge` flag
- Edge memory in TagStore
- Unit tests (10+ test cases)

**Success Criteria:**
- Edge contacts trigger only on transitions
- Multiple edges work simultaneously
- Edge detection persists across scans

---

#### Task 1A.4: Implement Latch Instructions
**Estimated Time:** 3 hours
**Assigned To:** Agent 2 (Runtime Engine)

**Requirements:**
- `SR` latch (Set-dominant)
  - S1=TRUE → Q1=TRUE (set wins)
  - R=TRUE → Q1=FALSE
- `RS` latch (Reset-dominant)
  - S=TRUE → Q1=TRUE
  - R1=TRUE → Q1=FALSE (reset wins)

**Deliverables:**
- `src/runtime/ir/instructions/latches.ts`
- Unit tests (10+ test cases)

**Success Criteria:**
- Latches maintain state correctly
- Dominance rules work as expected

---

### Phase 1A Milestones

**Week 1:**
- ✅ Day 1-3: Implement TON/TOF/TP timers
- ✅ Day 4-5: Write timer tests and fix bugs

**Week 2:**
- ✅ Day 1-2: Implement CTU/CTD/CTUD counters
- ✅ Day 3: Implement edge detection
- ✅ Day 4: Implement latches
- ✅ Day 5: Integration testing and demo programs

**Deliverables:**
- All instructions working
- Test coverage > 85%
- Demo programs showing each instruction type
- Updated documentation

---

## Phase 1B: Essential UI Components (Weeks 3-4)

### Sprint Goal
Build the Tag Table and Watch Table so users can define variables and monitor execution.

### Tasks

#### Task 1B.1: Implement Tag Table UI ⭐ HIGH PRIORITY
**Estimated Time:** 10 hours
**Assigned To:** UI Components Agent

**Requirements:**
- Spreadsheet-like interface with columns:
  - Name (editable)
  - Type (dropdown: BOOL, INT, DINT, REAL, TIME, TIMER, COUNTER)
  - Address (optional: %I0.0, %Q0.0, %M0.0+)
  - Initial Value (editable)
  - Comment (editable)
- Inline editing (click cell to edit)
- Validation (red border on errors)
- Add/Delete rows
- Auto-complete for tag names

**Deliverables:**
- `src/renderer/ui/tags/TagTable.tsx`
- `src/core/tags/TagDefinition.ts`
- Tag CRUD operations
- Validation logic

**Success Criteria:**
- Can add/edit/delete tags
- Validation prevents duplicates
- Tags integrate with runtime
- Clean, usable interface

---

#### Task 1B.2: Implement Watch Table UI ⭐ HIGH PRIORITY
**Estimated Time:** 10 hours
**Assigned To:** UI Components Agent

**Requirements:**
- Table showing live tag values
- Columns: Name, Value, Type, Format
- "Pin Tag" button to add tags to watch
- Expandable structs (Timer.IN, Timer.Q, Timer.ET, Timer.PT)
- Real-time updates each scan
- Format options: Decimal, Hex, Binary
- Force value feature (override for testing)

**Deliverables:**
- `src/renderer/ui/watch/WatchTable.tsx`
- Watch list management
- Force value dialog
- Format conversion logic

**Success Criteria:**
- Tags update in real-time
- Can force values for testing
- Struct members expand correctly
- Format switching works

---

#### Task 1B.3: Implement Instruction Palette ⭐ HIGH PRIORITY
**Estimated Time:** 6 hours
**Assigned To:** UI Components Agent

**Requirements:**
- Collapsible tree structure with categories:
  - Bit Logic (Contacts, Coils, Edge)
  - Comparison (EQ, NE, LT, GT, LE, GE)
  - Math (ADD, SUB, MUL, DIV, MOD)
  - Timers (TON, TOF, TP)
  - Counters (CTU, CTD, CTUD)
  - Latches (SR, RS)
- Draggable items
- Search/filter box
- Tooltip descriptions

**Deliverables:**
- `src/renderer/ui/palette/InstructionPalette.tsx`
- Palette data structure
- Drag source setup (react-dnd)

**Success Criteria:**
- All instructions listed
- Categories collapsible
- Search works
- Ready for drag-and-drop integration

---

### Phase 1B Milestones

**Week 3:**
- ✅ Day 1-3: Build Tag Table UI
- ✅ Day 4-5: Build Watch Table UI

**Week 4:**
- ✅ Day 1-2: Build Instruction Palette
- ✅ Day 3-4: Integration and styling
- ✅ Day 5: Testing and bug fixes

**Deliverables:**
- Tag Table working
- Watch Table working
- Palette ready
- All integrated with existing UI

---

## Phase 1C: Full LAD Editor (Weeks 5-7)

### Sprint Goal
Transform the ladder visualization into a full drag-and-drop editor.

### Tasks

#### Task 1C.1: Full LAD Data Structures
**Estimated Time:** 2 hours
**Requirements:** Complete LAD network/rung/element model for editing

#### Task 1C.2: IR-to-LAD Decompiler
**Estimated Time:** 10 hours
**Requirements:** Convert IR back to LAD for editing (round-trip)

#### Task 1C.3: LAD Editor Component
**Estimated Time:** 8 hours
**Requirements:** Grid-based editor with selection, add/delete rungs

#### Task 1C.4: Drag-and-Drop Integration
**Estimated Time:** 8 hours
**Requirements:** Drag from palette → drop on rung grid

#### Task 1C.5: Properties Panel
**Estimated Time:** 10 hours
**Requirements:** Edit element properties (tag names, timer values, etc.)

### Phase 1C Milestones

**Week 5:**
- ✅ IR-to-LAD decompiler
- ✅ Enhanced LAD data structures

**Week 6:**
- ✅ LAD editor component
- ✅ Basic editing (add/delete)

**Week 7:**
- ✅ Drag-and-drop system
- ✅ Properties panel
- ✅ Full editing workflow

**Deliverables:**
- Complete LAD editor
- Drag-and-drop working
- Properties editing working
- Round-trip LAD ↔ IR ↔ LAD

---

## Phase 1D: Project System & Lessons (Weeks 8-10)

### Sprint Goal
Enable save/load and create educational lesson mode.

### Tasks

#### Task 1D.1: Project Manager
**Estimated Time:** 8 hours
**Requirements:** Save/load projects as JSON with metadata

#### Task 1D.2: Zustand Store Integration
**Estimated Time:** 10 hours
**Requirements:** Centralized state management for app

#### Task 1D.3: Auto-Save
**Estimated Time:** 2 hours
**Requirements:** Auto-save every 60 seconds

#### Task 1D.4: Lesson System
**Estimated Time:** 17 hours
**Requirements:**
- Lesson JSON schema
- Test harness
- 3 example lessons
- Lesson UI panel

### Phase 1D Milestones

**Week 8:**
- ✅ Project save/load system
- ✅ Zustand store integration

**Week 9:**
- ✅ Lesson schema and test harness
- ✅ Create 3 example lessons

**Week 10:**
- ✅ Lesson UI panel
- ✅ Integration testing
- ✅ Bug fixes and polish

**Deliverables:**
- Save/load working
- Auto-save working
- 3 working lessons
- Lesson validation working

---

## Phase 1 Completion Criteria

### Must Have (All)
- [x] IR runtime with scan cycle
- [x] Basic LAD visualization
- [ ] Timers (TON/TOF/TP) ⭐
- [ ] Counters (CTU/CTD) ⭐
- [ ] Edge detection (P/N) ⭐
- [ ] Tag Table UI ⭐
- [ ] Watch Table UI ⭐
- [ ] Instruction Palette ⭐
- [ ] LAD drag-and-drop editor ⭐
- [ ] Properties panel ⭐
- [ ] Save/load projects ⭐
- [ ] 3 example lessons ⭐
- [ ] Test harness ⭐

### Should Have
- [ ] Latches (SR/RS)
- [ ] Set/Reset coils
- [ ] Compare blocks
- [ ] Math blocks
- [ ] Auto-save
- [ ] Undo/redo

### Nice to Have
- [ ] Keyboard shortcuts
- [ ] Dark theme
- [ ] Export/import CSV tags
- [ ] Recent projects list

---

## Post-Phase 1: Next Steps

### Phase 2: FBD Editor (3-4 weeks)
- FBD compiler/decompiler
- Block-based visual editor
- Wire routing system
- Auto-layout algorithm
- LAD ↔ FBD synchronization

### Phase 3: SCL Editor (2-3 weeks)
- SCL lexer and parser
- Monaco editor integration
- Syntax highlighting
- Auto-complete
- LAD/FBD ↔ SCL synchronization

### Phase 4: Packaging (1 week)
- Windows installer (NSIS)
- Build scripts
- Documentation
- Final testing
- Release v1.0.0

---

## Development Practices

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier for consistency
- Test coverage target: > 80%
- Code reviews (even for AI-generated code)

### Testing Strategy
- Unit tests for all runtime instructions
- Integration tests for UI workflows
- Manual testing checklist before each release
- Performance profiling (scan time, memory)

### Version Control
- Git repository: https://github.com/solopreneurguru/plc-trainer-ide
- Commit after each completed task
- Descriptive commit messages
- Tag releases (v0.4.0, v0.5.0, etc.)

### Documentation
- Update docs with each feature
- JSDoc comments on public APIs
- README with getting started guide
- User guide for lesson mode

---

## Risk Management

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Timer accuracy issues | High | Extensive testing, use high-resolution timers |
| Drag-and-drop UX complexity | Medium | Iterative design, user feedback |
| Performance degradation | Medium | Early profiling, optimize hot paths |
| State management complexity | Medium | Use Zustand, keep it simple |

### Schedule Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Feature creep | High | Strict Phase 1 scope, defer nice-to-haves |
| Unexpected complexity | Medium | Time buffers, focus on MVP |
| Testing taking longer | Low | Automated tests, TDD approach |

---

## Success Metrics

### Phase 1A Success
- ✅ All timer tests passing
- ✅ All counter tests passing
- ✅ Edge detection working
- ✅ Demo programs for each instruction
- ✅ Test coverage > 85%

### Phase 1B Success
- ✅ Tag Table usable
- ✅ Watch Table showing live values
- ✅ Palette with all instructions
- ✅ UI responsive and polished

### Phase 1C Success
- ✅ Can create programs by drag-and-drop
- ✅ Properties panel works
- ✅ Round-trip LAD ↔ IR ↔ LAD
- ✅ Students can complete exercises

### Phase 1D Success
- ✅ Projects save and load correctly
- ✅ 3 lessons working with validation
- ✅ Auto-save prevents data loss
- ✅ Ready for real student use

---

## Communication & Collaboration

### Regular Check-ins
- Progress updates after each task
- Demo after each sprint (2 weeks)
- Feedback incorporated immediately

### Decision Making
- User (Product Owner) validates features
- Claude proposes technical solutions
- Collaborative refinement

### Next Review
- **Date:** After Phase 1A completion (~2 weeks)
- **Topics:** Timer/counter implementation, adjust roadmap if needed

---

## Call to Action

**NEXT IMMEDIATE STEP:** Begin Phase 1A Task 1 - Implement Timer Instructions (TON/TOF/TP)

**Why Timers First?**
- Timers are fundamental to PLC programming
- Enable interesting demo programs (blinking, sequences)
- Students need timers for most real-world applications
- Proves our runtime can handle stateful, time-based logic

**Expected Output:**
- Working TON/TOF/TP implementation
- 30+ passing tests
- Blinking LED demo
- Timer values visible in watch mode

---

**Document Version:** 1.0
**Last Updated:** 2026-01-15
**Next Update:** After Phase 1A completion
