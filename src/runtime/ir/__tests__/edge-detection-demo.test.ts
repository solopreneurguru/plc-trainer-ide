/**
 * Edge Detection Demo Test
 *
 * Tests a pushbutton counter program using rising and falling edge detection
 */

import { describe, it, expect } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { Program } from '../../../core/ir/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Edge Detection Demo - Pushbutton Counter', () => {
  it('should count button presses using rising edge detection', () => {
    const runtime = new IRRuntime();

    // Load the edge detection counter fixture
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/06-edge-detection-counter.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize tags
    runtime.setTagValue('push_button', false);
    runtime.setTagValue('reset_button', false);
    runtime.setTagValue('button_count', 0);
    runtime.setTagValue('status_led', false);

    // Scan 1: Initial state - button not pressed
    let result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(0);
    expect(result.tagValues['status_led']).toBe(false);

    // Scan 2: Press button (rising edge) - count increments to 1
    runtime.setTagValue('push_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(1);
    expect(result.tagValues['status_led']).toBe(true);

    // Scan 3: Hold button (no edge) - count stays at 1
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(1);
    expect(result.tagValues['status_led']).toBe(true);

    // Scan 4: Release button
    runtime.setTagValue('push_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(1);

    // Scan 5: Press button again (rising edge) - count increments to 2
    runtime.setTagValue('push_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(2);

    // Scan 6: Release button
    runtime.setTagValue('push_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(2);

    // Scan 7: Press button third time - count increments to 3
    runtime.setTagValue('push_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(3);

    // Scan 8: Release button
    runtime.setTagValue('push_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(3);
  });

  it('should reset counter on falling edge of reset button', () => {
    const runtime = new IRRuntime();

    // Load the edge detection counter fixture
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/06-edge-detection-counter.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize tags
    runtime.setTagValue('push_button', false);
    runtime.setTagValue('reset_button', false);
    runtime.setTagValue('button_count', 0);

    // Count up to 5
    for (let i = 0; i < 5; i++) {
      runtime.setTagValue('push_button', true);
      runtime.executeScan();
      runtime.setTagValue('push_button', false);
      runtime.executeScan();
    }

    let result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(5);

    // Scan: Press reset button
    runtime.setTagValue('reset_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(5); // No reset yet (waiting for falling edge)

    // Scan: Release reset button (falling edge) - counter resets!
    runtime.setTagValue('reset_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(0); // Reset!
    expect(result.tagValues['status_led']).toBe(false); // LED off
  });

  it('should demonstrate status LED behavior', () => {
    const runtime = new IRRuntime();

    // Load the edge detection counter fixture
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/06-edge-detection-counter.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize tags
    runtime.setTagValue('push_button', false);
    runtime.setTagValue('reset_button', false);
    runtime.setTagValue('button_count', 0);
    runtime.setTagValue('status_led', false);

    // Scan 1: Count is 0 - LED should be OFF
    let result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(0);
    expect(result.tagValues['status_led']).toBe(false);

    // Scan 2: Increment count to 1 - LED should turn ON
    runtime.setTagValue('push_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(1);
    expect(result.tagValues['status_led']).toBe(true);

    // Scan 3: Count stays at 1 - LED stays ON
    runtime.setTagValue('push_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['status_led']).toBe(true);

    // Scan 4: Press and release reset button to reset counter
    runtime.setTagValue('reset_button', true);
    result = runtime.executeScan();
    runtime.setTagValue('reset_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['button_count']).toBe(0);
    expect(result.tagValues['status_led']).toBe(false); // LED turns OFF when count is 0
  });
});
