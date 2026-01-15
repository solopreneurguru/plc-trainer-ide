/**
 * Ladder Model - Step 3: Multiple Contacts with AND/OR Logic
 * Supports seal-in / latching patterns
 */

export type ContactType = 'NO' | 'NC';  // Normally Open or Normally Closed
export type ContactLogic = 'AND' | 'OR';  // Series (AND) or Parallel (OR)

export interface LadderContact {
  type: ContactType;
  address: string;  // e.g., "%I0.0" or "%Q0.0" for feedback
}

export interface LadderCoil {
  address: string;  // e.g., "%Q0.0"
}

export interface LadderRung {
  id: string;
  contacts: LadderContact[];  // Step 3: Multiple contacts
  contactLogic: ContactLogic;  // How to combine contacts (AND/OR)
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
 * Create a default ladder program (I0.0 → Q0.0)
 */
export function createDefaultLadderProgram(): LadderProgram {
  return {
    networks: [
      {
        id: 'Network_1',
        title: 'Network 1: Simple Contact to Coil',
        rungs: [
          {
            id: 'Rung_1',
            contacts: [
              {
                type: 'NO',
                address: '%I0.0',
              },
            ],
            contactLogic: 'AND',
            coil: {
              address: '%Q0.0',
            },
          },
        ],
      },
    ],
  };
}

/**
 * Validate a ladder program
 */
export function validateLadderProgram(program: LadderProgram): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!program.networks || program.networks.length === 0) {
    errors.push('Program must have at least one network');
  }

  for (const network of program.networks) {
    if (!network.rungs || network.rungs.length === 0) {
      errors.push(`Network ${network.id} must have at least one rung`);
    }

    for (const rung of network.rungs) {
      // Validate at least one contact
      if (!rung.contacts || rung.contacts.length === 0) {
        errors.push(`Rung ${rung.id} must have at least one contact`);
      }

      // Validate each contact address
      for (const contact of rung.contacts) {
        if (!contact.address.match(/^%[IQ]0\.[0-6]$/)) {
          errors.push(`Invalid contact address in ${rung.id}: ${contact.address}`);
        }
      }

      // Validate coil address
      if (!rung.coil.address.match(/^%Q0\.[0-6]$/)) {
        errors.push(`Invalid coil address in ${rung.id}: ${rung.coil.address}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
