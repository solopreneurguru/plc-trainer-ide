/**
 * TagStore: Symbolic tag storage with scan cycle semantics
 *
 * Manages tag values by symbolic ID (tag-based addressing).
 * Supports snapshot/pending/commit pattern for PLC scan cycle.
 */

export type TagValue = boolean | number | string | object;

export class TagStore {
  // Current tag values (committed state)
  private tags: Map<string, TagValue> = new Map();

  // Snapshot of tags at start of scan (for reading previous state)
  private snapshot: Map<string, TagValue> = new Map();

  // Pending writes during scan execution (last write wins)
  private pending: Map<string, TagValue> = new Map();

  constructor() {
    // Initialize empty
  }

  /**
   * Initialize a tag with a default value
   */
  initialize(tagId: string, value: TagValue): void {
    this.tags.set(tagId, value);
    this.snapshot.set(tagId, value);
  }

  /**
   * Snapshot current tag values at start of scan
   * Contacts will read from snapshot (previous scan state)
   */
  snapshotTags(): void {
    this.snapshot.clear();
    for (const [tagId, value] of this.tags.entries()) {
      this.snapshot.set(tagId, value);
    }
  }

  /**
   * Clear pending writes buffer at start of scan
   * All pending writes default to their current values or undefined
   */
  clearPending(): void {
    this.pending.clear();
  }

  /**
   * Read tag value from snapshot (previous scan state)
   * Used by contacts/operands during program execution
   */
  readFromSnapshot(tagId: string): TagValue | undefined {
    return this.snapshot.get(tagId);
  }

  /**
   * Read tag value: pending writes first, then snapshot
   * Enables within-scan feedback: later networks see writes from earlier networks
   */
  readFromPendingOrSnapshot(tagId: string): TagValue | undefined {
    // Check pending writes first (within-scan updates)
    if (this.pending.has(tagId)) {
      return this.pending.get(tagId);
    }
    // Fallback to snapshot (previous scan state)
    return this.snapshot.get(tagId);
  }

  /**
   * Write tag value to pending buffer (during scan execution)
   * Last write wins - this enables scan order dominance
   */
  writeToPending(tagId: string, value: TagValue): void {
    this.pending.set(tagId, value);
  }

  /**
   * Commit pending writes to actual tag values (end of scan)
   * Applies all pending writes atomically
   */
  commitPending(): void {
    for (const [tagId, value] of this.pending.entries()) {
      this.tags.set(tagId, value);
    }
  }

  /**
   * Get current committed tag value
   * Used for watch data / debugging
   */
  getCurrentValue(tagId: string): TagValue | undefined {
    return this.tags.get(tagId);
  }

  /**
   * Get all current tag values as object
   * For debugging and watch mode
   */
  getAllValues(): Record<string, TagValue> {
    const result: Record<string, TagValue> = {};
    for (const [tagId, value] of this.tags.entries()) {
      result[tagId] = value;
    }
    return result;
  }

  /**
   * Reset all tags to default values
   */
  reset(): void {
    this.tags.clear();
    this.snapshot.clear();
    this.pending.clear();
  }

  /**
   * Direct address fallback support
   * Maps %I0.0 style addresses to synthetic tag IDs
   */
  static addressToTagId(address: string): string {
    // Direct addresses become synthetic tag IDs
    // %I0.0 -> "__addr_I0_0"
    return `__addr_${address.replace(/[%.]/g, '_')}`;
  }
}
