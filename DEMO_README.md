# PLC Trainer IDE - Vertical Slice Demo

## ✅ Demo Status: READY TO RUN

This is a minimal working demo that demonstrates the core concept:
- A single Ladder rung: `I0.0 → Q0.0` (Input 1 controls Output 1)
- Real-time PLC runtime with scan cycle
- 7 digital inputs (toggles) and 7 digital outputs (indicator lamps)
- Live highlighting showing power flow when logic is energized

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd C:\Users\Zadik\plc-trainer-ide
npm install
```

This will install:
- Electron 28
- React 18 + TypeScript
- Tailwind CSS
- And all other dependencies

### 2. Run the Demo

```bash
npm run dev
```

This will:
1. Start the Vite dev server on `http://localhost:5173`
2. Compile TypeScript for Electron main process
3. Launch the Electron app

**Note**: The first run may take 10-20 seconds while Electron downloads. Subsequent runs are much faster.

## 🎮 How to Use the Demo

### The Interface

The demo window shows three main areas:

1. **Top Toolbar** (blue bar)
   - RUN button: Starts continuous scan cycles (100ms interval)
   - STOP button: Pauses the runtime
   - STEP button: Executes one scan cycle
   - RESET button: Clears all I/O
   - Scan counter and cycle time display

2. **Left Panel** (Ladder Diagram)
   - Single rung showing: `I0.0 → Q0.0`
   - Contact symbol: `┤ ├` (Normally Open)
   - Coil symbol: `( )` (Output)
   - Green highlighting when energized
   - Gray when de-energized

3. **Right Panel** (I/O Panel)
   - 7 Digital Inputs (toggle switches)
   - 7 Digital Outputs (indicator lamps)
   - Real-time updates each scan

### Try This:

1. **Click RUN** to start the PLC scan cycle
2. **Toggle Input 1** (%I0.0) ON
   - Watch the ladder rung turn GREEN (energized)
   - Watch Output 1 lamp turn GREEN
   - Watch power flow from left rail → contact → coil → right rail
3. **Toggle Input 1** OFF
   - Watch everything turn GRAY (de-energized)
   - Watch Output 1 lamp turn RED
4. Try **STEP** mode instead of RUN for manual control

## 🔍 What's Happening

### PLC Scan Cycle (100ms)

```
1. Read Inputs → %I0.0 (snapshot)
2. Execute Logic → If I0.0 is TRUE, energize Q0.0
3. Write Outputs → %Q0.0 follows I0.0
4. Send Watch Data → Update UI with highlights
```

### The Logic

```
Q0.0 := I0.0;
```

Output 1 follows Input 1. When the contact is closed (TRUE), power flows through and energizes the coil.

## 📂 What's Implemented

### Runtime Engine ✅
- `src/runtime/engine/ExecutionContext.ts` - Memory management
- `src/runtime/engine/PLCRuntime.ts` - Scan cycle loop
- Hardcoded single rung logic (I0.0 → Q0.0)
- Real-time execution at 100ms scan time

### Electron Main Process ✅
- `src/main/index.ts` - Main process with IPC handlers
- `src/main/preload.ts` - Secure IPC bridge
- IPC channels:
  - `runtime:start` - Start scan cycles
  - `runtime:stop` - Stop runtime
  - `runtime:step` - Single scan
  - `runtime:reset` - Reset all
  - `runtime:set-input` - Toggle input
  - `runtime:watch-update` - Broadcast updates

### React UI ✅
- `src/renderer/App.tsx` - Main app component
- `src/renderer/ui/layout/Toolbar.tsx` - Runtime controls
- `src/renderer/ui/io/IOPanel.tsx` - I/O toggles and lamps
- `src/renderer/ui/editors/lad/LadderDemo.tsx` - Ladder display with highlighting
- Tailwind CSS styling
- Smooth animations (CSS transitions)

## 🎨 Features Demonstrated

✅ **Real-time Scan Cycle**: 100ms loop with accurate timing
✅ **I/O Simulation**: 7 inputs (toggles) + 7 outputs (lamps)
✅ **Power Flow Visualization**: Green = energized, Gray = de-energized
✅ **Live Updates**: Watch table data sent via IPC every scan
✅ **Professional UI**: Clean, industrial look with Tailwind CSS
✅ **Runtime Controls**: Run, Stop, Step, Reset buttons
✅ **Scan Metrics**: Cycle number and duration display

## 🚧 What's NOT in the Demo

This is a vertical slice to validate the core architecture. NOT included:

- ❌ Full LAD editor (drag-and-drop, multiple rungs, editing)
- ❌ Timers and Counters
- ❌ FBD or SCL editors
- ❌ Tag table
- ❌ Watch table (only I/O panel)
- ❌ Project save/load
- ❌ Lesson mode
- ❌ Decompilers (IR → LAD)
- ❌ Full instruction set

All of these will be added in Phase 1 after the demo is validated!

## 🐛 Troubleshooting

### Port 5173 already in use
```bash
# Kill the process on port 5173
npx kill-port 5173
npm run dev
```

### Electron doesn't start
```bash
# Rebuild dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### TypeScript errors
```bash
# Check for errors
npm run typecheck
```

### Runtime doesn't respond
- Check browser DevTools (View → Toggle Developer Tools)
- Look for IPC errors in console
- Make sure you clicked RUN button first

## 📋 Next Steps

After validating this demo works:

1. **Phase 1A**: Implement full runtime engine
   - Timers (TON, TOF, TP)
   - Counters (CTU, CTD, CTUD)
   - Edge detection (rising/falling)
   - Expression evaluator
   - IR execution engine

2. **Phase 1B**: Implement LAD editor
   - Drag-and-drop from palette
   - Multiple rungs and networks
   - LAD-to-IR compiler
   - IR-to-LAD decompiler
   - Properties panel

3. **Phase 1C**: Complete UI
   - Tag table with CRUD
   - Watch table with pinned tags
   - Project save/load
   - Lesson mode with 3 examples

## 🎯 Success Criteria for Demo

This demo is successful if:

- ✅ Electron app launches without errors
- ✅ Vite dev server hot-reloads changes
- ✅ RUN button starts the runtime
- ✅ Toggling I0.0 updates Q0.0 in real-time
- ✅ Ladder rung highlights green when energized
- ✅ Output lamp changes color (red → green)
- ✅ Scan counter increments
- ✅ No lag or performance issues

## 💡 Tips

- **Hot Reload**: Edit React components and see changes instantly (no restart needed)
- **DevTools**: Press `Ctrl+Shift+I` to open Chrome DevTools for debugging
- **Console Logs**: Check both main process (terminal) and renderer (DevTools) logs
- **Fast Iteration**: Changes to UI components hot-reload; changes to runtime require restart

---

**Status**: Vertical Slice Demo - Ready to Run ✅
**Last Updated**: 2025-01-15
