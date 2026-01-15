/**
 * Runtime Manager
 *
 * Bridges IPC handlers and the IR Runtime engine.
 * Manages the lifecycle of the PLC runtime:
 * - Load LAD programs and compile to IR
 * - Start/Stop/Step/Reset execution
 * - Handle I/O updates
 * - Stream watch data to renderer
 */

import { IRRuntime, ScanResult } from '../runtime/ir/IRRuntime';
import { LADProgram } from '../core/lad/types';
import { LADCompiler } from '../compilers/lad-to-ir/LADCompiler';
import { Program } from '../core/ir/types';

export interface WatchData {
  scanNumber: number;
  scanDuration: number;
  tagValues: Record<string, any>;
}

export type RuntimeStatus = 'stopped' | 'running' | 'paused';

export class RuntimeManager {
  private runtime: IRRuntime;
  private compiler: LADCompiler;
  private scanIntervalId: NodeJS.Timeout | null = null;
  private scanTimeMs: number = 100;
  private status: RuntimeStatus = 'stopped';
  private watchCallback: ((data: WatchData) => void) | null = null;

  constructor() {
    this.runtime = new IRRuntime();
    this.compiler = new LADCompiler();
  }

  /**
   * Load a LAD program, compile to IR, and prepare for execution
   */
  loadLADProgram(ladProgram: LADProgram): void {
    // Compile LAD → IR
    const irProgram: Program = this.compiler.compile(ladProgram);

    // Load into runtime
    this.runtime.loadProgram(irProgram);

    // Initialize default I/O tags (input_0 through input_6)
    for (let i = 0; i < 7; i++) {
      this.runtime.setTagValue(`input_${i}`, false);
      this.runtime.setTagValue(`output_${i}`, false);
    }

    // Also initialize common tag names from fixtures
    this.runtime.setTagValue('start_button', false);
    this.runtime.setTagValue('stop_button', false);
    this.runtime.setTagValue('motor_output', false);
    this.runtime.setTagValue('seal_contact', false);
    this.runtime.setTagValue('contact_a', false);
    this.runtime.setTagValue('contact_b', false);
    this.runtime.setTagValue('output', false);
  }

  /**
   * Load an IR program directly
   */
  loadIRProgram(irProgram: Program): void {
    this.runtime.loadProgram(irProgram);

    // Initialize default I/O tags
    for (let i = 0; i < 7; i++) {
      this.runtime.setTagValue(`input_${i}`, false);
      this.runtime.setTagValue(`output_${i}`, false);
    }
  }

  /**
   * Set watch callback for streaming updates
   */
  setWatchCallback(callback: (data: WatchData) => void): void {
    this.watchCallback = callback;
  }

  /**
   * Start continuous execution
   */
  start(scanTimeMs: number = 100): void {
    if (this.status === 'running') {
      return; // Already running
    }

    this.scanTimeMs = scanTimeMs;
    this.status = 'running';

    // Start scan cycle interval
    this.scanIntervalId = setInterval(() => {
      this.executeScanAndNotify();
    }, this.scanTimeMs);
  }

  /**
   * Stop continuous execution
   */
  stop(): void {
    if (this.scanIntervalId) {
      clearInterval(this.scanIntervalId);
      this.scanIntervalId = null;
    }
    this.status = 'stopped';
  }

  /**
   * Execute one scan cycle (step mode)
   */
  step(): WatchData {
    this.status = 'paused';
    return this.executeScanAndNotify();
  }

  /**
   * Reset runtime to initial state
   */
  reset(): void {
    this.stop();
    this.runtime.reset();
    this.status = 'stopped';

    // Notify with zero state
    if (this.watchCallback) {
      this.watchCallback({
        scanNumber: 0,
        scanDuration: 0,
        tagValues: {},
      });
    }
  }

  /**
   * Get current status
   */
  getStatus(): RuntimeStatus {
    return this.status;
  }

  /**
   * Set tag value (typically for inputs)
   */
  setTagValue(tagId: string, value: any): void {
    this.runtime.setTagValue(tagId, value);
  }

  /**
   * Get tag value
   */
  getTagValue(tagId: string): any {
    return this.runtime.getTagValue(tagId);
  }

  /**
   * Get all tag values
   */
  getAllTagValues(): Record<string, any> {
    return this.runtime.getAllTagValues();
  }

  /**
   * Execute one scan and notify watchers
   */
  private executeScanAndNotify(): WatchData {
    const result: ScanResult = this.runtime.executeScan();

    const watchData: WatchData = {
      scanNumber: result.scanNumber,
      scanDuration: result.scanDuration,
      tagValues: result.tagValues,
    };

    // Notify callback
    if (this.watchCallback) {
      this.watchCallback(watchData);
    }

    return watchData;
  }
}
