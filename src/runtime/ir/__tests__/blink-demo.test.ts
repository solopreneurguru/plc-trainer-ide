/**
 * Blinking LED Demo Test
 *
 * Tests a complete blinking LED program using TON timer
 */

import { describe, it, expect } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { Program } from '../../../core/ir/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Blinking LED Demo', () => {
  it('should create a blinking pattern using TON timer', () => {
    const runtime = new IRRuntime();

    // Load the blinking timer fixture
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/05-blink-timer.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize tags
    runtime.setTagValue('enable_blink', true);
    runtime.setTagValue('timer_done', false);
    runtime.setTagValue('led_output', false);
    runtime.setTagValue('blink_elapsed', 0);

    // Scan 1: Timer starts, LED should be ON
    let result = runtime.executeScan(1000);
    expect(result.tagValues['led_output']).toBe(true); // LED ON
    expect(result.tagValues['timer_done']).toBe(false); // Timer not done yet

    // Scan 2: After 500ms, LED still ON
    result = runtime.executeScan(1500);
    expect(result.tagValues['led_output']).toBe(true); // LED still ON
    expect(result.tagValues['blink_elapsed']).toBe(500);

    // Scan 3: After 1000ms, timer done, LED turns OFF, enable_blink toggles
    result = runtime.executeScan(2000);
    expect(result.tagValues['timer_done']).toBe(true); // Timer done
    expect(result.tagValues['enable_blink']).toBe(false); // Toggle to FALSE
    expect(result.tagValues['led_output']).toBe(false); // LED OFF

    // Scan 4: Timer resets because enable_blink is now FALSE
    result = runtime.executeScan(2100);
    expect(result.tagValues['timer_done']).toBe(false); // Timer reset
    expect(result.tagValues['led_output']).toBe(false); // LED still OFF

    // At this point, enable_blink is FALSE and timer_done is FALSE
    // So enable_blink XOR timer_done = FALSE XOR FALSE = FALSE
    // enable_blink stays FALSE, LED stays OFF

    // This demonstrates the timer working, though the blink logic needs refinement
    // for continuous blinking (would need separate on/off timers or different logic)
  });

  it('should demonstrate timer elapsed time updates', () => {
    const runtime = new IRRuntime();

    // Load the blinking timer fixture
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/05-blink-timer.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize tags
    runtime.setTagValue('enable_blink', true);
    runtime.setTagValue('timer_done', false);
    runtime.setTagValue('led_output', false);
    runtime.setTagValue('blink_elapsed', 0);

    // Execute multiple scans and verify elapsed time increases
    let result = runtime.executeScan(0);
    expect(result.tagValues['blink_elapsed']).toBe(0);

    result = runtime.executeScan(250);
    expect(result.tagValues['blink_elapsed']).toBe(250);

    result = runtime.executeScan(500);
    expect(result.tagValues['blink_elapsed']).toBe(500);

    result = runtime.executeScan(750);
    expect(result.tagValues['blink_elapsed']).toBe(750);

    result = runtime.executeScan(1000);
    expect(result.tagValues['blink_elapsed']).toBe(1000);
    expect(result.tagValues['timer_done']).toBe(true);
  });
});
