/**
 * IR-Based Runtime Engine
 *
 * Executes IR programs with proper PLC scan cycle semantics:
 * 1. Snapshot tags (inputs + previous outputs)
 * 2. Clear pending writes buffer
 * 3. Execute networks top-to-bottom (scan order)
 * 4. Execute statements in order (last write wins)
 * 5. Commit pending writes to tags
 * 6. Emit watch data
 */

import { Program } from '../../core/ir/types';
import { TagStore } from './TagStore';
import { StatementExecutor } from './StatementExecutor';

export interface ScanResult {
  scanNumber: number;
  scanDuration: number;
  tagValues: Record<string, any>;
}

export class IRRuntime {
  private tagStore: TagStore;
  private statementExecutor: StatementExecutor;
  private scanNumber: number = 0;
  private program: Program | null = null;

  constructor() {
    this.tagStore = new TagStore();
    this.statementExecutor = new StatementExecutor(this.tagStore);
  }

  /**
   * Load an IR program
   */
  loadProgram(program: Program): void {
    this.program = program;
    this.scanNumber = 0;
  }

  /**
   * Initialize a tag with a value
   * Used to set up inputs, outputs, and other tags before execution
   */
  setTagValue(tagId: string, value: any): void {
    this.tagStore.initialize(tagId, value);
  }

  /**
   * Get current tag value
   */
  getTagValue(tagId: string): any {
    return this.tagStore.getCurrentValue(tagId);
  }

  /**
   * Execute one scan cycle
   * Returns scan result with tag values
   * @param currentTime - Optional timestamp for testing (defaults to Date.now())
   */
  executeScan(currentTime?: number): ScanResult {
    if (!this.program) {
      throw new Error('No program loaded');
    }

    const startTime = currentTime !== undefined ? currentTime : Date.now();
    this.scanNumber++;

    // ===== SCAN PHASE 1: SNAPSHOT TAGS =====
    // Capture current tag state (inputs + previous outputs)
    // Operands will read from this snapshot during execution
    this.tagStore.snapshotTags();

    // ===== SCAN PHASE 2: CLEAR PENDING WRITES =====
    // Reset pending buffer (all writes default to current values)
    this.tagStore.clearPending();

    // ===== SCAN PHASE 3: EXECUTE PROGRAM =====
    // Set current time for timer execution
    this.statementExecutor.setCurrentTime(startTime);

    // Execute all networks in OB1 (cyclic execution)
    const ob1 = this.program.organization_blocks.find((ob) => ob.type === 'cyclic');
    if (ob1) {
      // Execute networks top-to-bottom (scan order)
      for (const network of ob1.networks) {
        // Execute statements in order (last write wins)
        for (const statement of network.statements) {
          this.statementExecutor.execute(statement);
        }
      }
    }

    // ===== SCAN PHASE 4: COMMIT PENDING WRITES =====
    // Apply all pending writes to tag values (atomic commit)
    this.tagStore.commitPending();

    // ===== SCAN PHASE 5: EMIT WATCH DATA =====
    const endTime = Date.now();
    const scanDuration = endTime - startTime;

    return {
      scanNumber: this.scanNumber,
      scanDuration,
      tagValues: this.tagStore.getAllValues(),
    };
  }

  /**
   * Execute multiple scan cycles
   * Useful for testing seal-in logic and multi-scan behavior
   */
  executeScans(count: number): ScanResult[] {
    const results: ScanResult[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.executeScan());
    }
    return results;
  }

  /**
   * Reset runtime state
   */
  reset(): void {
    this.tagStore.reset();
    this.scanNumber = 0;
  }

  /**
   * Get all current tag values
   */
  getAllTagValues(): Record<string, any> {
    return this.tagStore.getAllValues();
  }
}
