/**
 * IR Serialization/Deserialization
 * Converts IR to/from JSON with validation
 */

import { Program, ProgramSchema } from './types';

/**
 * Serialize IR Program to JSON string
 */
export function serializeProgram(program: Program): string {
  // Validate before serializing
  const validated = ProgramSchema.parse(program);
  return JSON.stringify(validated, null, 2);
}

/**
 * Deserialize JSON string to IR Program
 * Throws if validation fails
 */
export function deserializeProgram(json: string): Program {
  const parsed = JSON.parse(json);
  return ProgramSchema.parse(parsed);
}

/**
 * Validate IR Program structure
 * Returns validation result without throwing
 */
export function validateProgram(program: unknown): {
  success: boolean;
  data?: Program;
  error?: string;
} {
  const result = ProgramSchema.safeParse(program);
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      error: result.error.message,
    };
  }
}
