# Vertical Slice Demo - ARCHIVED

**Status**: Complete and archived (2025-01-15)
**Purpose**: Proof-of-concept for PLC scan cycle semantics

## What This Was

This vertical slice demo validated core runtime behavior:
- Scan cycle: Input snapshot → Execute logic → Commit outputs
- Seal-in / latching logic with feedback contacts
- Multiple rungs with scan order dominance (last write wins)
- Real-time highlighting of energized ladder elements
- Live editing without restart

## Why It's Archived

This code served its purpose as a **disposable proof-of-behavior**. It was never intended to be the final product architecture.

The production system uses:
- **IR-based architecture** (language-agnostic intermediate representation)
- **Symbolic addressing** (tag IDs, not hardcoded %I/%Q)
- **Multi-language support** (LAD, FBD, SCL compile to same IR)
- **Decompilers** (IR → LAD/FBD/SCL for any view)

## What's Preserved Here

### Code
- `ladder/LadderModel.ts` - Demo-specific ladder data model
- `ui/lad/LadderDemo.tsx` - Ladder visualization component
- `ui/lad/LadderEditPanel.tsx` - Dropdown-based editor

### Documentation
- `STEP1_SUMMARY.md` - Step 1 completion summary
- Implementation notes and test results

## Do NOT Build On This

This code is for **reference only**. The production system is being built from the IR foundation up.

If you need to understand scan cycle semantics, runtime behavior, or highlighting logic, refer to this archive. But all new features go into the IR-based architecture.

## Key Learnings Applied

✅ Scan cycle phase separation works
✅ Pending outputs buffer enables last-write-wins
✅ Output snapshot enables seal-in logic
✅ Electron + React + TypeScript stack is solid
✅ IPC communication pattern is effective

These lessons informed the IR-based architecture design.
