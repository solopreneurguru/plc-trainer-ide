/**
 * Latch Demo Test - Motor Control System
 *
 * Tests a practical motor control application using SR and RS latches.
 * Demonstrates typical industrial start/stop circuit with emergency stop.
 */

import { describe, it, expect } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { Program } from '../../../core/ir/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Latch Demo - Motor Control System', () => {
  it('should control motor with start/stop buttons using SR latch', () => {
    const runtime = new IRRuntime();

    // Load the latch motor control fixture
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/07-latch-motor-control.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize all tags
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('stop_button', false);
    runtime.setTagValue('enable_switch', true);
    runtime.setTagValue('emergency_stop', false);
    runtime.setTagValue('motor_running', false);
    runtime.setTagValue('system_enabled', false);
    runtime.setTagValue('motor_output', false);

    // Scan 1: Initial state - nothing running
    let result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(false);
    expect(result.tagValues['motor_output']).toBe(false);

    // Scan 2: Enable system first
    runtime.setTagValue('enable_switch', true);
    result = runtime.executeScan();
    expect(result.tagValues['system_enabled']).toBe(true);
    expect(result.tagValues['motor_output']).toBe(false); // Motor not started yet

    // Scan 3: Press start button - motor should start
    runtime.setTagValue('start_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(true);
    expect(result.tagValues['motor_output']).toBe(true); // Motor ON

    // Scan 4: Release start button - motor should stay ON (latched)
    runtime.setTagValue('start_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(true);
    expect(result.tagValues['motor_output']).toBe(true); // Still ON

    // Scan 5: Press stop button - motor should stop
    runtime.setTagValue('stop_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(false);
    expect(result.tagValues['motor_output']).toBe(false); // Motor OFF

    // Scan 6: Release stop button - motor should stay OFF
    runtime.setTagValue('stop_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(false);
    expect(result.tagValues['motor_output']).toBe(false);
  });

  it('should demonstrate SR latch priority: start has priority over stop', () => {
    const runtime = new IRRuntime();

    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/07-latch-motor-control.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('stop_button', false);
    runtime.setTagValue('enable_switch', true);
    runtime.setTagValue('emergency_stop', false);

    // Enable system
    runtime.executeScan();

    // Scan: Press BOTH start and stop simultaneously
    runtime.setTagValue('start_button', true);
    runtime.setTagValue('stop_button', true);
    let result = runtime.executeScan();

    // SR latch: Set (start) has priority → motor should be ON
    expect(result.tagValues['motor_running']).toBe(true);
    expect(result.tagValues['motor_output']).toBe(true);
  });

  it('should demonstrate emergency stop with RS latch', () => {
    const runtime = new IRRuntime();

    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/07-latch-motor-control.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('stop_button', false);
    runtime.setTagValue('enable_switch', false);
    runtime.setTagValue('emergency_stop', false);

    // Scan 1: Enable system
    runtime.setTagValue('enable_switch', true);
    let result = runtime.executeScan();
    expect(result.tagValues['system_enabled']).toBe(true);

    // Scan 2: Start motor
    runtime.setTagValue('start_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(true);
    expect(result.tagValues['motor_output']).toBe(true);

    // Scan 3: Release start
    runtime.setTagValue('start_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(true); // Still running

    // Scan 4: Activate emergency stop!
    runtime.setTagValue('emergency_stop', true);
    result = runtime.executeScan();
    expect(result.tagValues['system_enabled']).toBe(false); // System disabled
    expect(result.tagValues['motor_output']).toBe(false); // Motor OFF

    // Scan 5: Try to start motor while emergency stop is active
    runtime.setTagValue('start_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(true); // Motor latch tries to set
    expect(result.tagValues['motor_output']).toBe(false); // But output is OFF (system disabled)

    // Scan 6: Release emergency stop while enable switch still TRUE
    runtime.setTagValue('emergency_stop', false);
    result = runtime.executeScan();
    expect(result.tagValues['system_enabled']).toBe(true); // System re-enables (enable_switch still TRUE)
    expect(result.tagValues['motor_output']).toBe(true); // Motor can run again (start still pressed)

    // Scan 7: Stop the motor first
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('stop_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_running']).toBe(false); // Motor latch reset
    expect(result.tagValues['motor_output']).toBe(false); // Motor stops

    // Scan 8: Release stop button and disable enable switch
    runtime.setTagValue('stop_button', false);
    runtime.setTagValue('enable_switch', false);
    result = runtime.executeScan();
    expect(result.tagValues['system_enabled']).toBe(true); // System latch maintains TRUE state (bistable)
    expect(result.tagValues['motor_output']).toBe(false); // Motor still off

    // Scan 9: To disable system, must activate emergency stop again
    runtime.setTagValue('emergency_stop', true);
    result = runtime.executeScan();
    expect(result.tagValues['system_enabled']).toBe(false); // Now system is disabled
    expect(result.tagValues['motor_output']).toBe(false);
  });

  it('should demonstrate RS latch priority: emergency stop has priority', () => {
    const runtime = new IRRuntime();

    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/07-latch-motor-control.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('stop_button', false);
    runtime.setTagValue('enable_switch', false);
    runtime.setTagValue('emergency_stop', false);

    // Scan 1: Press BOTH enable and emergency stop simultaneously
    runtime.setTagValue('enable_switch', true);
    runtime.setTagValue('emergency_stop', true);
    let result = runtime.executeScan();

    // RS latch: Reset (emergency stop) has priority → system should be disabled
    expect(result.tagValues['system_enabled']).toBe(false);
  });

  it('should demonstrate full motor control sequence', () => {
    const runtime = new IRRuntime();

    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/07-latch-motor-control.json');
    const programJson = fs.readFileSync(fixturePath, 'utf-8');
    const program: Program = JSON.parse(programJson);

    runtime.loadProgram(program);

    // Initialize all tags
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('stop_button', false);
    runtime.setTagValue('enable_switch', false);
    runtime.setTagValue('emergency_stop', false);

    // Step 1: System is disabled, motor cannot start
    runtime.setTagValue('start_button', true);
    let result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(false); // Cannot run (system disabled)

    // Step 2: Enable system
    runtime.setTagValue('enable_switch', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(true); // Motor starts

    // Step 3: Release start button
    runtime.setTagValue('start_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(true); // Motor keeps running (latched)

    // Step 4: Stop motor
    runtime.setTagValue('stop_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(false); // Motor stops

    // Step 5: Release stop button
    runtime.setTagValue('stop_button', false);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(false); // Motor stays off

    // Step 6: Start motor again
    runtime.setTagValue('start_button', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(true); // Motor starts again

    // Step 7: Emergency stop while running
    runtime.setTagValue('emergency_stop', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(false); // Immediate shutdown

    // Step 8: Clear emergency stop and re-enable
    runtime.setTagValue('emergency_stop', false);
    runtime.setTagValue('enable_switch', true);
    result = runtime.executeScan();
    expect(result.tagValues['motor_output']).toBe(true); // Motor can run (start still active)
  });
});
