/**
 * Toolbar Component
 *
 * Runtime control toolbar with Start/Stop/Step/Reset buttons and status display
 */

import React from 'react';

interface ToolbarProps {
  runtimeStatus: 'running' | 'stopped';
  onStart: () => void;
  onStop: () => void;
  onStep: () => void;
  onReset: () => void;
  scanNumber: number;
  scanDuration: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  runtimeStatus,
  onStart,
  onStop,
  onStep,
  onReset,
  scanNumber,
  scanDuration,
}) => {
  const isRunning = runtimeStatus === 'running';

  return (
    <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 shadow-lg">
      {/* Left: Control Buttons */}
      <div className="flex items-center space-x-2">
        {/* Start Button */}
        <button
          onClick={onStart}
          disabled={isRunning}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
            ${
              isRunning
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
            }
          `}
          title="Start Runtime (F5)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          <span>Start</span>
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          disabled={!isRunning}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
            ${
              !isRunning
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
            }
          `}
          title="Stop Runtime (F6)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
              clipRule="evenodd"
            />
          </svg>
          <span>Stop</span>
        </button>

        {/* Step Button */}
        <button
          onClick={onStep}
          disabled={isRunning}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
            ${
              isRunning
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }
          `}
          title="Execute One Scan (F7)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
          <span>Step</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white shadow-md hover:shadow-lg"
          title="Reset Runtime (F8)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          <span>Reset</span>
        </button>
      </div>

      {/* Center: Status Indicator */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center space-x-3 px-6 py-2 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <div
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${
                  isRunning
                    ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse'
                    : 'bg-gray-500'
                }
              `}
            />
            <span className="text-sm font-semibold text-white">
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Scan Info */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Scan:</span>
          <span className="text-white font-mono font-semibold">{scanNumber}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Cycle:</span>
          <span className="text-white font-mono font-semibold">{scanDuration}ms</span>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
