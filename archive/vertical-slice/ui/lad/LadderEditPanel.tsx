/**
 * Ladder Edit Panel - Step 3: Multiple Contacts with AND/OR Logic
 */

import { LadderProgram, ContactType, ContactLogic, LadderRung, LadderContact } from '../../../../core/ladder/LadderModel';

interface LadderEditPanelProps {
  ladderProgram: LadderProgram;
  onUpdate: (program: LadderProgram) => void;
}

function LadderEditPanel({ ladderProgram, onUpdate }: LadderEditPanelProps) {
  const network = ladderProgram.networks[0];

  // Contact logic (AND/OR) change
  const handleContactLogicChange = (rungIndex: number, logic: ContactLogic) => {
    const updatedRungs = [...network.rungs];
    updatedRungs[rungIndex] = {
      ...updatedRungs[rungIndex],
      contactLogic: logic,
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: updatedRungs }],
    };
    onUpdate(updated);
  };

  // Contact type change
  const handleContactTypeChange = (rungIndex: number, contactIndex: number, type: ContactType) => {
    const updatedRungs = [...network.rungs];
    const updatedContacts = [...updatedRungs[rungIndex].contacts];
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      type,
    };
    updatedRungs[rungIndex] = {
      ...updatedRungs[rungIndex],
      contacts: updatedContacts,
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: updatedRungs }],
    };
    onUpdate(updated);
  };

  // Contact address change
  const handleContactAddressChange = (rungIndex: number, contactIndex: number, address: string) => {
    const updatedRungs = [...network.rungs];
    const updatedContacts = [...updatedRungs[rungIndex].contacts];
    updatedContacts[contactIndex] = {
      ...updatedContacts[contactIndex],
      address,
    };
    updatedRungs[rungIndex] = {
      ...updatedRungs[rungIndex],
      contacts: updatedContacts,
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: updatedRungs }],
    };
    onUpdate(updated);
  };

  // Add contact to rung
  const handleAddContact = (rungIndex: number) => {
    const updatedRungs = [...network.rungs];
    const newContact: LadderContact = {
      type: 'NO',
      address: '%I0.0',
    };
    updatedRungs[rungIndex] = {
      ...updatedRungs[rungIndex],
      contacts: [...updatedRungs[rungIndex].contacts, newContact],
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: updatedRungs }],
    };
    onUpdate(updated);
  };

  // Remove contact from rung
  const handleRemoveContact = (rungIndex: number, contactIndex: number) => {
    const updatedRungs = [...network.rungs];
    if (updatedRungs[rungIndex].contacts.length <= 1) {
      return; // Keep at least one contact
    }
    const updatedContacts = updatedRungs[rungIndex].contacts.filter((_, i) => i !== contactIndex);
    updatedRungs[rungIndex] = {
      ...updatedRungs[rungIndex],
      contacts: updatedContacts,
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: updatedRungs }],
    };
    onUpdate(updated);
  };

  // Coil address change
  const handleCoilAddressChange = (rungIndex: number, address: string) => {
    const updatedRungs = [...network.rungs];
    updatedRungs[rungIndex] = {
      ...updatedRungs[rungIndex],
      coil: {
        ...updatedRungs[rungIndex].coil,
        address,
      },
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: updatedRungs }],
    };
    onUpdate(updated);
  };

  // Add new rung
  const handleAddRung = () => {
    const newRung: LadderRung = {
      id: `Rung_${Date.now()}`,
      contacts: [{ type: 'NO', address: '%I0.0' }],
      contactLogic: 'AND',
      coil: { address: '%Q0.0' },
    };

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [{ ...network, rungs: [...network.rungs, newRung] }],
    };
    onUpdate(updated);
  };

  const handleRemoveRung = (rungIndex: number) => {
    if (network.rungs.length <= 1) {
      return; // Keep at least one rung
    }

    const updatedRungs = network.rungs.filter((_, index) => index !== rungIndex);

    const updated: LadderProgram = {
      ...ladderProgram,
      networks: [
        {
          ...network,
          rungs: updatedRungs,
        },
      ],
    };
    onUpdate(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          Edit Ladder Rungs ({network.rungs.length})
        </h3>
        <button
          onClick={handleAddRung}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-semibold"
        >
          + Add Rung
        </button>
      </div>

      <div className="space-y-6">
        {network.rungs.map((rung, rungIndex) => (
          <div
            key={rung.id}
            className="p-4 border border-gray-300 rounded-lg bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Rung {rungIndex + 1}
              </h4>
              {network.rungs.length > 1 && (
                <button
                  onClick={() => handleRemoveRung(rungIndex)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Contact Logic (AND/OR) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Contact Logic
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleContactLogicChange(rungIndex, 'AND')}
                    className={`
                      px-3 py-1 rounded transition-colors flex-1 text-sm
                      ${
                        rung.contactLogic === 'AND'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }
                    `}
                  >
                    AND (Series)
                  </button>
                  <button
                    onClick={() => handleContactLogicChange(rungIndex, 'OR')}
                    className={`
                      px-3 py-1 rounded transition-colors flex-1 text-sm
                      ${
                        rung.contactLogic === 'OR'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }
                    `}
                  >
                    OR (Parallel)
                  </button>
                </div>
              </div>

              {/* Contacts List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-600">
                    Contacts ({rung.contacts.length})
                  </label>
                  <button
                    onClick={() => handleAddContact(rungIndex)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs"
                  >
                    + Add Contact
                  </button>
                </div>

                {rung.contacts.map((contact, contactIndex) => (
                  <div key={contactIndex} className="mb-2 p-2 bg-white border border-gray-200 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Contact {contactIndex + 1}</span>
                      {rung.contacts.length > 1 && (
                        <button
                          onClick={() => handleRemoveContact(rungIndex, contactIndex)}
                          className="px-1 py-0 text-red-500 hover:text-red-700 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Contact Type */}
                    <div className="flex gap-1 mb-1">
                      <button
                        onClick={() => handleContactTypeChange(rungIndex, contactIndex, 'NO')}
                        className={`
                          px-2 py-1 rounded transition-colors flex-1 text-xs
                          ${
                            contact.type === 'NO'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <span className="font-mono">┤ ├</span> NO
                      </button>
                      <button
                        onClick={() => handleContactTypeChange(rungIndex, contactIndex, 'NC')}
                        className={`
                          px-2 py-1 rounded transition-colors flex-1 text-xs
                          ${
                            contact.type === 'NC'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <span className="font-mono">┤/├</span> NC
                      </button>
                    </div>

                    {/* Contact Address */}
                    <select
                      value={contact.address}
                      onChange={(e) => handleContactAddressChange(rungIndex, contactIndex, e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <optgroup label="Digital Inputs">
                        <option value="%I0.0">%I0.0 - Input 1</option>
                        <option value="%I0.1">%I0.1 - Input 2</option>
                        <option value="%I0.2">%I0.2 - Input 3</option>
                        <option value="%I0.3">%I0.3 - Input 4</option>
                        <option value="%I0.4">%I0.4 - Input 5</option>
                        <option value="%I0.5">%I0.5 - Input 6</option>
                        <option value="%I0.6">%I0.6 - Input 7</option>
                      </optgroup>
                      <optgroup label="Digital Outputs (Feedback)">
                        <option value="%Q0.0">%Q0.0 - Output 1</option>
                        <option value="%Q0.1">%Q0.1 - Output 2</option>
                        <option value="%Q0.2">%Q0.2 - Output 3</option>
                        <option value="%Q0.3">%Q0.3 - Output 4</option>
                        <option value="%Q0.4">%Q0.4 - Output 5</option>
                        <option value="%Q0.5">%Q0.5 - Output 6</option>
                        <option value="%Q0.6">%Q0.6 - Output 7</option>
                      </optgroup>
                    </select>
                  </div>
                ))}
              </div>

              {/* Coil Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Coil Address (Output)
                </label>
                <select
                  value={rung.coil.address}
                  onChange={(e) => handleCoilAddressChange(rungIndex, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="%Q0.0">%Q0.0 - Output 1</option>
                  <option value="%Q0.1">%Q0.1 - Output 2</option>
                  <option value="%Q0.2">%Q0.2 - Output 3</option>
                  <option value="%Q0.3">%Q0.3 - Output 4</option>
                  <option value="%Q0.4">%Q0.4 - Output 5</option>
                  <option value="%Q0.5">%Q0.5 - Output 6</option>
                  <option value="%Q0.6">%Q0.6 - Output 7</option>
                </select>
              </div>

              {/* Current Logic Display */}
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                <code className="text-xs text-gray-800 block">
                  {rung.coil.address} :=
                  {rung.contacts.map((contact, idx) => (
                    <span key={idx}>
                      {idx > 0 && ` ${rung.contactLogic} `}
                      {contact.type === 'NC' && 'NOT '}
                      {contact.address}
                    </span>
                  ))}
                  ;
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LadderEditPanel;
