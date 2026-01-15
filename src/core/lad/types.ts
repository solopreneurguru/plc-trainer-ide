/**
 * Ladder Logic (LAD) Data Structure
 *
 * Represents ladder diagrams before compilation to IR.
 * This is the native format for the LAD editor.
 */

import { z } from 'zod';

/**
 * LAD Program
 * Top-level container for ladder logic
 */
export interface LADProgram {
  version: string;
  networks: LADNetwork[];
}

/**
 * LAD Network
 * A group of related rungs (equivalent to IR Network)
 */
export interface LADNetwork {
  id: string;
  title?: string;
  comment?: string;
  rungs: LADRung[];
}

/**
 * LAD Rung
 * One horizontal line of ladder logic
 * Elements are executed left-to-right in series (AND logic)
 */
export interface LADRung {
  id: string;
  elements: LADElement[];
}

/**
 * LAD Element
 * A single component in a rung (contact, coil, or branch)
 */
export type LADElement = LADContact | LADCoil | LADBranch;

/**
 * LAD Contact
 * Input condition (NO = normally open, NC = normally closed)
 */
export interface LADContact {
  type: 'contact';
  contact_type: 'NO' | 'NC';
  operand: string; // Tag name or address (e.g., "start_button", "%I0.0")
}

/**
 * LAD Coil
 * Output instruction (output, set, reset)
 */
export interface LADCoil {
  type: 'coil';
  coil_type: 'output' | 'set' | 'reset';
  operand: string; // Tag name or address (e.g., "motor_output", "%Q0.0")
}

/**
 * LAD Branch
 * Parallel paths (OR logic)
 * Each branch is an array of elements in series
 *
 * Example:
 *   --+--[contact_a]--
 *     |
 *     +--[contact_b]--
 *
 * Compiles to: (contact_a OR contact_b)
 */
export interface LADBranch {
  type: 'branch';
  branches: LADElement[][]; // Array of parallel paths
}

// ===== Zod Schemas for Validation =====

export const LADContactSchema: z.ZodType<LADContact> = z.object({
  type: z.literal('contact'),
  contact_type: z.enum(['NO', 'NC']),
  operand: z.string().min(1),
});

export const LADCoilSchema: z.ZodType<LADCoil> = z.object({
  type: z.literal('coil'),
  coil_type: z.enum(['output', 'set', 'reset']),
  operand: z.string().min(1),
});

export const LADBranchSchema: z.ZodType<LADBranch> = z.lazy(() =>
  z.object({
    type: z.literal('branch'),
    branches: z.array(z.array(LADElementSchema)).min(2), // At least 2 parallel paths
  })
);

export const LADElementSchema: z.ZodType<LADElement> = z.union([
  LADContactSchema,
  LADCoilSchema,
  LADBranchSchema,
]);

export const LADRungSchema: z.ZodType<LADRung> = z.object({
  id: z.string(),
  elements: z.array(LADElementSchema),
});

export const LADNetworkSchema: z.ZodType<LADNetwork> = z.object({
  id: z.string(),
  title: z.string().optional(),
  comment: z.string().optional(),
  rungs: z.array(LADRungSchema),
});

export const LADProgramSchema: z.ZodType<LADProgram> = z.object({
  version: z.string(),
  networks: z.array(LADNetworkSchema),
});

/**
 * Validate a LAD program against the schema
 */
export function validateLADProgram(data: unknown): LADProgram {
  return LADProgramSchema.parse(data);
}
