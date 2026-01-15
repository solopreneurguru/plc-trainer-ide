/**
 * Ladder Demo Component - Ladder Logic Visualization
 * Displays rungs with real-time power flow animation
 */

import { LadderProgram, LadderRung } from '../../../../core/ladder/LadderModel';

interface LadderDemoProps {
  ladderProgram: LadderProgram;
  rungHighlights: { [rungId: string]: boolean };
}

function LadderDemo({ ladderProgram, rungHighlights }: LadderDemoProps) {
  const network = ladderProgram.networks[0];

  // Render a single rung
  const renderRung = (rung: LadderRung, rungIndex: number) => {
    const rungEnergized = rungHighlights[rung.id] || false;

    return (
      <div key={rung.id} className="mb-8 pb-8 border-b border-gray-200 last:border-b-0">
        {/* Rung Header */}
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-500">
            Rung {rungIndex + 1} {rung.contacts.length > 1 && `(${rung.contactLogic})`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {rung.coil.address} :=
            {rung.contacts.map((contact, idx) => (
              <span key={idx}>
                {idx > 0 && ` ${rung.contactLogic} `}
                {contact.type === 'NC' && 'NOT '}
                {contact.address}
              </span>
            ))}
          </div>
        </div>

        {/* Ladder Rung Visual */}
        <div className="flex items-center gap-2 my-4">
          {/* Left Power Rail */}
          <div
            className={`
              w-2 h-16 rounded transition-colors duration-200
              ${rungEnergized ? 'bg-green-500 shadow-lg shadow-green-300' : 'bg-gray-400'}
            `}
          />

          {/* Horizontal Line to Contacts */}
          <div
            className={`
              h-1 w-8 transition-colors duration-200
              ${rungEnergized ? 'bg-green-500' : 'bg-gray-400'}
            `}
          />

          {/* Contacts (Series or Parallel) */}
          {rung.contacts.map((contact, contactIdx) => (
            <div key={contactIdx} className="flex items-center gap-2">
              {/* Contact Symbol */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    border-4 px-4 py-3 rounded transition-all duration-200
                    ${
                      rungEnergized
                        ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200'
                        : 'border-gray-400 bg-white'
                    }
                  `}
                >
                  <div className={`text-2xl ${rungEnergized ? 'text-green-600' : 'text-gray-600'}`}>
                    {contact.type === 'NO' ? '┤ ├' : '┤/├'}
                  </div>
                </div>
                <div className="text-xs mt-2 text-gray-600 font-semibold">{contact.address}</div>
                <div className="text-xs text-gray-500">{contact.type === 'NO' ? 'NO' : 'NC'}</div>
              </div>

              {/* Logic Operator between contacts */}
              {contactIdx < rung.contacts.length - 1 && (
                <div className="flex flex-col items-center mx-1">
                  <div
                    className={`
                      px-2 py-1 rounded text-xs font-bold
                      ${rung.contactLogic === 'OR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                    `}
                  >
                    {rung.contactLogic}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Horizontal Line to Coil */}
          <div
            className={`
              h-1 flex-1 min-w-[50px] transition-colors duration-200
              ${rungEnergized ? 'bg-green-500' : 'bg-gray-400'}
            `}
          />

          {/* Coil */}
          <div className="flex flex-col items-center">
            <div
              className={`
                border-4 px-4 py-3 rounded-full transition-all duration-200
                ${
                  rungEnergized
                    ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200'
                    : 'border-gray-400 bg-white'
                }
              `}
            >
              <div className={`text-2xl ${rungEnergized ? 'text-green-600' : 'text-gray-600'}`}>
                ( )
              </div>
            </div>
            <div className="text-xs mt-2 text-gray-600 font-semibold">{rung.coil.address}</div>
            <div className="text-xs text-gray-500">Output Coil</div>
          </div>

          {/* Horizontal Line to Right Rail */}
          <div
            className={`
              h-1 w-8 transition-colors duration-200
              ${rungEnergized ? 'bg-green-500' : 'bg-gray-400'}
            `}
          />

          {/* Right Power Rail */}
          <div
            className={`
              w-2 h-16 rounded transition-colors duration-200
              ${rungEnergized ? 'bg-green-500 shadow-lg shadow-green-300' : 'bg-gray-400'}
            `}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="font-mono">
      {/* Network Header */}
      <div className="mb-4 pb-2 border-b border-gray-300">
        <div className="text-sm font-semibold text-gray-600">{network.title}</div>
        <div className="text-xs text-gray-500 mt-1">
          {network.rungs.length} {network.rungs.length === 1 ? 'rung' : 'rungs'}
        </div>
      </div>

      {/* Render all rungs */}
      {network.rungs.map((rung, index) => renderRung(rung, index))}

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-300">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Ladder Logic Symbols:</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">┤ ├</span>
            <span className="text-gray-600">Normally Open (NO) Contact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">┤/├</span>
            <span className="text-gray-600">Normally Closed (NC) Contact</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">( )</span>
            <span className="text-gray-600">Output Coil</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-green-500" />
            <span className="text-gray-600">Energized (TRUE)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-gray-400" />
            <span className="text-gray-600">De-energized (FALSE)</span>
          </div>
        </div>
      </div>

      {/* Seal-In / Latching Explanation */}
      <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-700 mb-2">💡 How it Works:</h4>
        <p className="text-xs text-gray-600 mb-2">
          <strong>Rung 1:</strong> Start button OR motor feedback creates a seal-in latch.
          Once motor turns on, it holds itself on even when start is released.
        </p>
        <p className="text-xs text-gray-600">
          <strong>Rung 2:</strong> Stop button (NC contact) breaks the seal.
          Motor AND NOT(stop) turns off when stop is pressed.
        </p>
      </div>
    </div>
  );
}

export default LadderDemo;
