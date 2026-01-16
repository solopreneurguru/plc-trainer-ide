/**
 * Main App Component
 */

import { useState, useEffect } from 'react';
import IOPanel from './ui/io/IOPanel';
import Toolbar from './ui/layout/Toolbar';
import LadderDemo from './ui/editors/lad/LadderDemo';
import TagTable from './ui/tags/TagTable';
import WatchTable from './ui/tags/WatchTable';
import { createDefaultLadderProgram } from '../core/ladder/LadderModel';
import { TagDefinition, createTag } from '../core/tags/TagDefinition';

interface WatchData {
  scanNumber: number;
  scanDuration: number;
  tagValues: Record<string, any>;
}

type ViewTab = 'ladder' | 'tags' | 'watch';

function App() {
  const [runtimeStatus, setRuntimeStatus] = useState<'running' | 'stopped'>('stopped');
  const [watchData, setWatchData] = useState<WatchData>({
    scanNumber: 0,
    scanDuration: 0,
    tagValues: {},
  });
  const [activeTab, setActiveTab] = useState<ViewTab>('ladder');
  const [tags, setTags] = useState<TagDefinition[]>([
    createTag('start_button', 'BOOL', '%I0.0', 'Start button input'),
    createTag('stop_button', 'BOOL', '%I0.1', 'Stop button input'),
    createTag('motor_output', 'BOOL', '%Q0.0', 'Motor output'),
  ]);

  // Ladder program for visualization
  const ladderProgram = createDefaultLadderProgram();

  // Convert tag values to I/O arrays for display
  const inputs = Array(7)
    .fill(false)
    .map((_, i) => {
      // Map fixture tag names to inputs
      if (i === 0) return watchData.tagValues['start_button'] || watchData.tagValues[`input_${i}`] || false;
      if (i === 1) return watchData.tagValues['stop_button'] || watchData.tagValues[`input_${i}`] || false;
      return watchData.tagValues[`input_${i}`] || false;
    });

  const outputs = Array(7)
    .fill(false)
    .map((_, i) => {
      // Map fixture tag names to outputs
      if (i === 0) return watchData.tagValues['motor_output'] || watchData.tagValues[`output_${i}`] || false;
      return watchData.tagValues[`output_${i}`] || false;
    });

  // Calculate rung highlights based on tag values
  const calculateRungHighlights = () => {
    const highlights: { [rungId: string]: boolean } = {};
    const tags = watchData.tagValues;

    // Rung 1: (start_button OR motor_output) → motor_output
    const rung1Result = (tags['start_button'] || false) || (tags['motor_output'] || false);
    highlights['Rung_1'] = rung1Result;

    // Rung 2: (motor_output AND NOT(stop_button)) → motor_output
    const rung2Result = (tags['motor_output'] || false) && !(tags['stop_button'] || false);
    highlights['Rung_2'] = rung2Result;

    return highlights;
  };

  const rungHighlights = calculateRungHighlights();

  useEffect(() => {
    // Set up watch data listener
    window.electronAPI.runtime.onWatchUpdate((data: WatchData) => {
      setWatchData(data);
    });

    // Cleanup on unmount
    return () => {
      window.electronAPI.runtime.removeWatchListener();
    };
  }, []);

  const handleStart = async () => {
    await window.electronAPI.runtime.start(100); // 100ms scan time
    setRuntimeStatus('running');
  };

  const handleStop = async () => {
    await window.electronAPI.runtime.stop();
    setRuntimeStatus('stopped');
  };

  const handleStep = async () => {
    await window.electronAPI.runtime.step();
  };

  const handleReset = async () => {
    await window.electronAPI.runtime.reset();
    setRuntimeStatus('stopped');
    setWatchData({
      scanNumber: 0,
      scanDuration: 0,
      tagValues: {},
    });
  };

  const handleToggleInput = async (index: number) => {
    const address = `%I0.${index}`;
    const newValue = !inputs[index];
    await window.electronAPI.runtime.setInput(address, newValue);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <Toolbar
        runtimeStatus={runtimeStatus}
        onStart={handleStart}
        onStop={handleStop}
        onStep={handleStep}
        onReset={handleReset}
        scanNumber={watchData.scanNumber}
        scanDuration={watchData.scanDuration}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Panel - Tabbed Views */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Tab Navigation */}
          <div className="flex gap-1 px-6 pt-4">
            <button
              onClick={() => setActiveTab('ladder')}
              className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
                activeTab === 'ladder'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-300'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              📊 Ladder Diagram
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
                activeTab === 'tags'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-300'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              🏷️ Tag Table
            </button>
            <button
              onClick={() => setActiveTab('watch')}
              className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
                activeTab === 'watch'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-300'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              👁️ Watch Table
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 pt-0 overflow-auto">
            {activeTab === 'ladder' && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-4 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Seal-In Start/Stop Circuit</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Scan:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {watchData.scanNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Cycle:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    {watchData.scanDuration}ms
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 Quick Start:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>
                  Click <strong>Start</strong> → Toggle <strong>Input 1</strong> (start_button) →
                  Watch power flow!
                </li>
                <li>
                  Motor seals itself ON (green glow) via feedback
                </li>
                <li>
                  Toggle <strong>Input 2</strong> (stop_button) to break the seal
                </li>
              </ol>
            </div>

                {/* Ladder Diagram with Real-Time Animation */}
                <LadderDemo ladderProgram={ladderProgram} rungHighlights={rungHighlights} />
              </div>
            )}

            {activeTab === 'tags' && (
              <div className="h-full mt-4">
                <TagTable tags={tags} onTagsChange={setTags} />
              </div>
            )}

            {activeTab === 'watch' && (
              <div className="h-full mt-4">
                <WatchTable
                  tags={tags}
                  tagValues={watchData.tagValues}
                  scanNumber={watchData.scanNumber}
                  scanDuration={watchData.scanDuration}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - I/O */}
        <div className="w-80 bg-gray-50 border-l border-gray-300 p-4 overflow-auto">
          <IOPanel inputs={inputs} outputs={outputs} onToggleInput={handleToggleInput} />
        </div>
      </div>
    </div>
  );
}

export default App;
