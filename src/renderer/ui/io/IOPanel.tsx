/**
 * I/O Panel Component - Digital Inputs and Outputs
 */

interface IOPanelProps {
  inputs: boolean[];
  outputs: boolean[];
  onToggleInput: (index: number) => void;
}

function IOPanel({ inputs, outputs, onToggleInput }: IOPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        I/O Panel
      </h3>

      {/* Digital Inputs */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          📥 Digital Inputs
        </h4>
        <div className="space-y-2">
          {inputs.map((value, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-600 w-16">%I0.{index}</span>
                <span className="text-sm text-gray-700">Input {index + 1}</span>
              </div>
              <button
                onClick={() => onToggleInput(index)}
                className={`
                  w-12 h-6 rounded-full transition-all duration-200 relative
                  ${value ? 'bg-green-500' : 'bg-gray-300'}
                `}
                title={`Toggle Input %I0.${index}`}
              >
                <div
                  className={`
                    w-5 h-5 bg-white rounded-full shadow-md absolute top-0.5 transition-transform duration-200
                    ${value ? 'translate-x-6' : 'translate-x-0.5'}
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Digital Outputs */}
      <div>
        <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          📤 Digital Outputs
        </h4>
        <div className="space-y-2">
          {outputs.map((value, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-600 w-16">%Q0.{index}</span>
                <span className="text-sm text-gray-700">Output {index + 1}</span>
              </div>
              <div
                className={`
                  w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center
                  ${value ? 'bg-green-500 shadow-lg shadow-green-300' : 'bg-red-500 shadow-sm'}
                `}
                title={`Output %Q0.${index}: ${value ? 'ON' : 'OFF'}`}
              >
                <div className={`w-4 h-4 rounded-full ${value ? 'bg-green-300' : 'bg-red-300'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-3 bg-blue-50 rounded text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Toggle Input 1 (%I0.0) to see the output and ladder diagram respond in real-time!</p>
      </div>
    </div>
  );
}

export default IOPanel;
