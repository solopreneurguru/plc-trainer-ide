/**
 * IR Runtime Tests
 *
 * Tests IR execution engine against JSON fixtures
 * Verifies scan cycle semantics, expression evaluation, and seal-in behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IRRuntime } from '../IRRuntime';
import { deserializeProgram } from '../../../core/ir/serialization';
import * as fs from 'fs';
import * as path from 'path';

describe('IR Runtime - Fixture Execution', () => {
  let runtime: IRRuntime;

  beforeEach(() => {
    runtime = new IRRuntime();
  });

  describe('Fixture 01: Simple Contact', () => {
    it('should execute simple assignment: motor_output := start_button', () => {
      // Load fixture
      const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/01-simple-contact.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const program = deserializeProgram(json);

      runtime.loadProgram(program);

      // Initialize tags
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('motor_output', false);

      // Scan 1: start_button OFF → motor_output OFF
      let result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Set start_button ON
      runtime.setTagValue('start_button', true);

      // Scan 2: start_button ON → motor_output ON
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Set start_button OFF
      runtime.setTagValue('start_button', false);

      // Scan 3: start_button OFF → motor_output OFF
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });
  });

  describe('Fixture 02: OR Branch', () => {
    it('should execute OR expression: motor_output := start_button OR seal_contact', () => {
      const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/02-or-branch.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const program = deserializeProgram(json);

      runtime.loadProgram(program);

      // Initialize tags
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('seal_contact', false);
      runtime.setTagValue('motor_output', false);

      // Scan 1: Both OFF → motor_output OFF
      let result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Set start_button ON
      runtime.setTagValue('start_button', true);

      // Scan 2: start_button ON → motor_output ON
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Set start_button OFF, seal_contact ON
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('seal_contact', true);

      // Scan 3: seal_contact ON → motor_output ON
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Set both OFF
      runtime.setTagValue('seal_contact', false);

      // Scan 4: Both OFF → motor_output OFF
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });
  });

  describe('Fixture 03: AND Series', () => {
    it('should execute AND expression: output := contact_a AND contact_b', () => {
      const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/03-and-series.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const program = deserializeProgram(json);

      runtime.loadProgram(program);

      // Initialize tags
      runtime.setTagValue('contact_a', false);
      runtime.setTagValue('contact_b', false);
      runtime.setTagValue('output', false);

      // Scan 1: Both OFF → output OFF
      let result = runtime.executeScan();
      expect(result.tagValues.output).toBe(false);

      // Set contact_a ON
      runtime.setTagValue('contact_a', true);

      // Scan 2: Only A ON → output OFF
      result = runtime.executeScan();
      expect(result.tagValues.output).toBe(false);

      // Set contact_b ON
      runtime.setTagValue('contact_b', true);

      // Scan 3: Both ON → output ON
      result = runtime.executeScan();
      expect(result.tagValues.output).toBe(true);

      // Set contact_a OFF
      runtime.setTagValue('contact_a', false);

      // Scan 4: Only B ON → output OFF
      result = runtime.executeScan();
      expect(result.tagValues.output).toBe(false);
    });
  });

  describe('Fixture 04: Seal-In Start/Stop', () => {
    it('should execute seal-in latch: motor_output := start_button OR motor_output', () => {
      const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/04-seal-in-start-stop.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const program = deserializeProgram(json);

      runtime.loadProgram(program);

      // Initialize tags
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('stop_button', false);
      runtime.setTagValue('motor_output', false);

      // Scan 1: All OFF → motor_output OFF
      let result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Press start button
      runtime.setTagValue('start_button', true);

      // Scan 2: start ON → motor_output ON
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Release start button
      runtime.setTagValue('start_button', false);

      // Scan 3: start OFF, but motor_output sealed → motor_output STAYS ON
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Scan 4: Still sealed → motor_output STAYS ON
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(true);

      // Press stop button
      runtime.setTagValue('stop_button', true);

      // Scan 5: stop ON (NC logic) → motor_output OFF (network 2 overwrites network 1)
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);

      // Release stop button
      runtime.setTagValue('stop_button', false);

      // Scan 6: stop OFF, motor_output OFF → motor_output STAYS OFF
      result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });

    it('should verify stop dominance: hold stop + press start → motor_output OFF', () => {
      const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/04-seal-in-start-stop.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const program = deserializeProgram(json);

      runtime.loadProgram(program);

      // Initialize tags
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('stop_button', false);
      runtime.setTagValue('motor_output', false);

      // Hold stop button + press start button
      runtime.setTagValue('start_button', true);
      runtime.setTagValue('stop_button', true);

      // Scan: Network 1 writes ON, Network 2 overwrites with OFF → motor_output OFF
      const result = runtime.executeScan();
      expect(result.tagValues.motor_output).toBe(false);
    });

    it('should verify scan order dominance across multiple scans', () => {
      const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/04-seal-in-start-stop.json');
      const json = fs.readFileSync(fixturePath, 'utf-8');
      const program = deserializeProgram(json);

      runtime.loadProgram(program);

      // Initialize tags
      runtime.setTagValue('start_button', false);
      runtime.setTagValue('stop_button', false);
      runtime.setTagValue('motor_output', false);

      // Complete start/stop cycle
      const results = [];

      // 1. Press start
      runtime.setTagValue('start_button', true);
      results.push(runtime.executeScan());
      expect(results[0].tagValues.motor_output).toBe(true);

      // 2. Release start (sealed)
      runtime.setTagValue('start_button', false);
      results.push(runtime.executeScan());
      expect(results[1].tagValues.motor_output).toBe(true);

      // 3. Still sealed
      results.push(runtime.executeScan());
      expect(results[2].tagValues.motor_output).toBe(true);

      // 4. Press stop
      runtime.setTagValue('stop_button', true);
      results.push(runtime.executeScan());
      expect(results[3].tagValues.motor_output).toBe(false);

      // 5. Release stop
      runtime.setTagValue('stop_button', false);
      results.push(runtime.executeScan());
      expect(results[4].tagValues.motor_output).toBe(false);

      // Verify scan numbers increment
      expect(results[0].scanNumber).toBe(1);
      expect(results[4].scanNumber).toBe(5);
    });
  });
});

describe('IR Runtime - Core Functionality', () => {
  let runtime: IRRuntime;

  beforeEach(() => {
    runtime = new IRRuntime();
  });

  it('should initialize tags with values', () => {
    runtime.setTagValue('test_tag', true);
    expect(runtime.getTagValue('test_tag')).toBe(true);

    runtime.setTagValue('test_tag', false);
    expect(runtime.getTagValue('test_tag')).toBe(false);
  });

  it('should increment scan number on each scan', () => {
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/01-simple-contact.json');
    const json = fs.readFileSync(fixturePath, 'utf-8');
    const program = deserializeProgram(json);

    runtime.loadProgram(program);
    runtime.setTagValue('start_button', false);
    runtime.setTagValue('motor_output', false);

    const result1 = runtime.executeScan();
    expect(result1.scanNumber).toBe(1);

    const result2 = runtime.executeScan();
    expect(result2.scanNumber).toBe(2);

    const result3 = runtime.executeScan();
    expect(result3.scanNumber).toBe(3);
  });

  it('should reset runtime state', () => {
    runtime.setTagValue('test_tag', true);
    runtime.reset();

    const allValues = runtime.getAllTagValues();
    expect(Object.keys(allValues).length).toBe(0);
  });

  it('should execute multiple scans in sequence', () => {
    const fixturePath = path.join(__dirname, '../../../core/ir/fixtures/01-simple-contact.json');
    const json = fs.readFileSync(fixturePath, 'utf-8');
    const program = deserializeProgram(json);

    runtime.loadProgram(program);
    runtime.setTagValue('start_button', true);
    runtime.setTagValue('motor_output', false);

    const results = runtime.executeScans(5);
    expect(results).toHaveLength(5);
    expect(results[4].scanNumber).toBe(5);

    // All scans should have motor_output ON (start_button is ON)
    results.forEach((result) => {
      expect(result.tagValues.motor_output).toBe(true);
    });
  });
});
