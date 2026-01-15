/**
 * Ladder Model - For Visualization
 * Simplified model used by the ladder diagram renderer
 */

export type ContactType = 'NO' | 'NC'; // Normally Open or Normally Closed
export type ContactLogic = 'AND' | 'OR'; // Series (AND) or Parallel (OR)

export interface LadderContact {
  type: ContactType;
  address: string; // e.g., "%I0.0", "start_button"
}

export interface LadderCoil {
  address: string; // e.g., "%Q0.0", "motor_output"
}

export interface LadderRung {
  id: string;
  contacts: LadderContact[];
  contactLogic: ContactLogic; // How to combine contacts (AND/OR)
  coil: LadderCoil;
}

export interface LadderNetwork {
  id: string;
  title: string;
  rungs: LadderRung[];
}

export interface LadderProgram {
  networks: LadderNetwork[];
}

/**
 * Create a default ladder program
 */
export function createDefaultLadderProgram(): LadderProgram {
  return {
    networks: [
      {
        id: 'Network_1',
        title: 'Network 1: Seal-In Start/Stop',
        rungs: [
          {
            id: 'Rung_1',
            contacts: [
              { type: 'NO', address: 'start_button' },
              { type: 'NO', address: 'motor_output' },
            ],
            contactLogic: 'OR',
            coil: { address: 'motor_output' },
          },
          {
            id: 'Rung_2',
            contacts: [
              { type: 'NO', address: 'motor_output' },
              { type: 'NC', address: 'stop_button' },
            ],
            contactLogic: 'AND',
            coil: { address: 'motor_output' },
          },
        ],
      },
    ],
  };
}
