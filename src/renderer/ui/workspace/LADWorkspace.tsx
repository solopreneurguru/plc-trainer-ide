/**
 * LAD Workspace Component (TIA Portal Style)
 *
 * Unified workspace for ladder diagram editing with docked panels:
 * - Center: Ladder editor canvas
 * - Right: Instruction tree (hierarchical, collapsible)
 * - Bottom: Properties panel + Tag/Watch tabs
 *
 * No more page switching - everything in one workspace!
 */

import { useState } from 'react';
import LadderEditor from '../editors/lad/LadderEditor';
import InstructionTree from './InstructionTree';
import PropertiesPanel from '../editors/PropertiesPanel';
import TagTable from '../tags/TagTable';
import WatchTable from '../tags/WatchTable';
import {
  LadderProgramFull,
  LadderElement,
} from '../../../core/ladder/LadderModelFull';
import { TagDefinition } from '../../../core/tags/TagDefinition';

interface LADWorkspaceProps {
  program: LadderProgramFull;
  onProgramChange?: (program: LadderProgramFull) => void;
  tags: TagDefinition[];
  onTagsChange?: (tags: TagDefinition[]) => void;
  watchData: {
    scanNumber: number;
    scanDuration: number;
    tagValues: Record<string, any>;
  };
}

type BottomPanelTab = 'properties' | 'tags' | 'watch';

function LADWorkspace({
  program,
  onProgramChange,
  tags,
  onTagsChange,
  watchData,
}: LADWorkspaceProps) {
  const [selectedInstruction, setSelectedInstruction] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedElement, setSelectedElement] = useState<LadderElement | null>(null);
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('properties');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);

  const handleInstructionSelect = (instruction: { id: string; name: string; symbol: string; description: string; category: string }) => {
    setSelectedInstruction({ id: instruction.id, name: instruction.name });
  };

  const handleElementSelect = (element: LadderElement | null) => {
    setSelectedElement(element);
    if (element) {
      setBottomPanelTab('properties');
      setIsBottomPanelCollapsed(false);
    }
  };

  const handleElementChange = (element: LadderElement) => {
    // Update the element in the program
    // Find the element and replace it
    const updatedNetworks = program.networks.map((network) => ({
      ...network,
      rungs: network.rungs.map((rung) => ({
        ...rung,
        elements: rung.elements.map((el) =>
          el.id === element.id ? element : el
        ),
      })),
    }));

    const updatedProgram: LadderProgramFull = {
      ...program,
      networks: updatedNetworks,
    };

    onProgramChange?.(updatedProgram);
    setSelectedElement(element); // Update local state
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center: Ladder Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <LadderEditor
            program={program}
            onProgramChange={onProgramChange}
            selectedInstruction={selectedInstruction}
            onElementSelect={handleElementSelect}
            onElementChange={handleElementChange}
          />
        </div>

        {/* Right Dock: Instruction Tree */}
        {!isRightPanelCollapsed && (
          <div className="w-80 border-l border-gray-300 bg-gray-50 flex flex-col">
            <div className="p-3 border-b border-gray-300 flex items-center justify-between bg-white">
              <h3 className="text-sm font-semibold text-gray-700">Instructions</h3>
              <button
                onClick={() => setIsRightPanelCollapsed(true)}
                className="text-gray-500 hover:text-gray-700 text-xs font-semibold"
                title="Collapse panel"
              >
                ›
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <InstructionTree onSelectInstruction={handleInstructionSelect} />
            </div>
          </div>
        )}

        {/* Collapsed Right Panel Button */}
        {isRightPanelCollapsed && (
          <div className="w-8 border-l border-gray-300 bg-gray-200 flex flex-col items-center pt-2">
            <button
              onClick={() => setIsRightPanelCollapsed(false)}
              className="text-gray-600 hover:text-gray-800 font-bold"
              title="Show instructions"
            >
              ‹
            </button>
            <div className="mt-4 transform -rotate-90 origin-center whitespace-nowrap text-xs font-semibold text-gray-600">
              Instructions
            </div>
          </div>
        )}
      </div>

      {/* Bottom Dock: Properties / Tags / Watch */}
      {!isBottomPanelCollapsed && (
        <div className="h-64 border-t border-gray-300 bg-white flex flex-col">
          {/* Tab Bar */}
          <div className="flex items-center gap-1 px-4 pt-2 bg-gray-50 border-b border-gray-300">
            <button
              onClick={() => setBottomPanelTab('properties')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
                bottomPanelTab === 'properties'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-300'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              📋 Properties
            </button>
            <button
              onClick={() => setBottomPanelTab('tags')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
                bottomPanelTab === 'tags'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-300'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              🏷️ Tags
            </button>
            <button
              onClick={() => setBottomPanelTab('watch')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
                bottomPanelTab === 'watch'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-300'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              👁️ Watch
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setIsBottomPanelCollapsed(true)}
              className="text-gray-500 hover:text-gray-700 text-xs font-semibold px-2"
              title="Collapse panel"
            >
              ▾
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {bottomPanelTab === 'properties' && (
              <PropertiesPanel
                selectedElement={selectedElement}
                onElementChange={handleElementChange}
              />
            )}
            {bottomPanelTab === 'tags' && (
              <div className="h-full p-4">
                <TagTable tags={tags} onTagsChange={onTagsChange || (() => {})} />
              </div>
            )}
            {bottomPanelTab === 'watch' && (
              <div className="h-full p-4">
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
      )}

      {/* Collapsed Bottom Panel Button */}
      {isBottomPanelCollapsed && (
        <div className="h-6 border-t border-gray-300 bg-gray-200 flex items-center justify-center">
          <button
            onClick={() => setIsBottomPanelCollapsed(false)}
            className="text-gray-600 hover:text-gray-800 text-xs font-semibold"
            title="Show bottom panel"
          >
            ▴ Properties / Tags / Watch
          </button>
        </div>
      )}
    </div>
  );
}

export default LADWorkspace;
