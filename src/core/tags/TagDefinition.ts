/**
 * Tag Definition Types
 *
 * Defines the structure for PLC tags (variables) used in programs.
 */

export type TagDataType = 'BOOL' | 'INT' | 'DINT' | 'REAL' | 'TIME' | 'TIMER' | 'COUNTER';

export interface TagDefinition {
  id: string; // Unique identifier
  name: string; // Tag name (e.g., "motor_running")
  dataType: TagDataType;
  address?: string; // Optional direct address (e.g., "%I0.0", "%Q0.1", "%M0.0")
  initialValue: TagValue;
  comment?: string;
}

export type TagValue = boolean | number | string | TimerValue | CounterValue;

export interface TimerValue {
  IN: boolean;
  PT: number;
  Q: boolean;
  ET: number;
}

export interface CounterValue {
  CU?: boolean;
  CD?: boolean;
  R?: boolean;
  LD?: boolean;
  PV: number;
  Q?: boolean;
  QU?: boolean;
  QD?: boolean;
  CV: number;
}

/**
 * Get default value for a data type
 */
export function getDefaultValue(dataType: TagDataType): TagValue {
  switch (dataType) {
    case 'BOOL':
      return false;
    case 'INT':
    case 'DINT':
      return 0;
    case 'REAL':
      return 0.0;
    case 'TIME':
      return 0;
    case 'TIMER':
      return {
        IN: false,
        PT: 0,
        Q: false,
        ET: 0,
      };
    case 'COUNTER':
      return {
        PV: 0,
        CV: 0,
        Q: false,
      };
  }
}

/**
 * Validate tag name
 * Must start with letter, can contain letters, numbers, underscores
 */
export function validateTagName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Tag name cannot be empty' };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return {
      valid: false,
      error: 'Tag name must start with a letter and contain only letters, numbers, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Validate address format
 * Accepts: %I0.0, %Q0.0, %M0.0, etc.
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address) {
    return { valid: true }; // Address is optional
  }

  if (!/^%[IQMDB]\d+\.\d+$/.test(address)) {
    return {
      valid: false,
      error: 'Address must be in format %I0.0, %Q0.0, %M0.0, etc.',
    };
  }

  return { valid: true };
}

/**
 * Create a new tag definition
 */
export function createTag(
  name: string,
  dataType: TagDataType = 'BOOL',
  address?: string,
  comment?: string
): TagDefinition {
  return {
    id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    dataType,
    address,
    initialValue: getDefaultValue(dataType),
    comment,
  };
}
