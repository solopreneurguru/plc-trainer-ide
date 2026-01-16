/**
 * Ladder Editor Component
 *
 * Interactive grid-based editor for ladder diagrams.
 * Features:
 * - Visual grid layout
 * - Instruction placement via click or drag-and-drop
 * - Element selection and editing
 * - Add/remove rungs
 * - Real-time validation
 */

import { useState, useRef } from 'react';
import {
  LadderProgramFull,
  LadderNetwork,
  LadderRung,
  LadderElement,
  GridPosition,
  createEmptyRung,
  generateElementId,
  createContact,
  createCoil,
  createTagOperand,
  createLiteralOperand,
  createFunctionBlock,
  createComparison,
  ContactType,
  CoilType,
  FunctionBlockType,
  ComparisonType,
} from '../../../../core/ladder/LadderModelFull';

interface LadderEditorProps {
  program: LadderProgramFull;
  onProgramChange?: (program: LadderProgramFull) => void;
  selectedInstruction?: { id: string; name: string } | null;
}

// Grid cell size in pixels
const CELL_SIZE = 60;
const CELL_PADDING = 4;

function LadderEditor({ program, onProgramChange, selectedInstruction }: LadderEditorProps) {
  const [selectedNetwork, setSelectedNetwork] = useState<number>(0);
  const [selectedRung, setSelectedRung] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridPosition | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const network = program.networks[selectedNetwork];

  /**
   * Place an instruction on the grid
   */
  const placeInstruction = (instructionId: string, rungIndex: number, position: GridPosition) => {
    // Prompt for tag name
    const tagName = prompt(`Enter tag name for ${instructionId}:`);
    if (!tagName) return; // User cancelled

    let newElement: LadderElement | null = null;

    // Create element based on instruction type
    switch (instructionId) {
      case 'XIC':
        newElement = createContact(
          generateElementId('contact'),
          'NO',
          createTagOperand(tagName),
          position
        );
        break;
      case 'XIO':
        newElement = createContact(
          generateElementId('contact'),
          'NC',
          createTagOperand(tagName),
          position
        );
        break;
      case 'P_EDGE':
        newElement = createContact(
          generateElementId('contact'),
          'P',
          createTagOperand(tagName),
          position
        );
        break;
      case 'N_EDGE':
        newElement = createContact(
          generateElementId('contact'),
          'N',
          createTagOperand(tagName),
          position
        );
        break;

      case 'OTE':
        newElement = createCoil(
          generateElementId('coil'),
          'OTE',
          createTagOperand(tagName),
          position
        );
        break;
      case 'OTL':
        newElement = createCoil(
          generateElementId('coil'),
          'OTL',
          createTagOperand(tagName),
          position
        );
        break;
      case 'OTU':
        newElement = createCoil(
          generateElementId('coil'),
          'OTU',
          createTagOperand(tagName),
          position
        );
        break;

      // Function blocks need instance name and default inputs
      case 'TON':
      case 'TOF':
      case 'TP':
        const ptValue = prompt('Enter preset time (PT) in milliseconds:', '1000');
        newElement = createFunctionBlock(
          generateElementId('fb'),
          instructionId as FunctionBlockType,
          createTagOperand(tagName), // Instance
          {
            IN: createTagOperand('input_tag'),
            PT: createLiteralOperand(parseInt(ptValue || '1000'), 'TIME'),
          },
          {
            Q: createTagOperand('output_tag'),
            ET: createTagOperand('elapsed_tag'),
          },
          position
        );
        break;

      case 'CTU':
      case 'CTD':
      case 'CTUD':
        const pvValue = prompt('Enter preset value (PV):', '10');
        const inputs: any = {};
        const outputs: any = {};

        if (instructionId === 'CTU') {
          inputs.CU = createTagOperand('count_up_input');
          inputs.R = createTagOperand('reset_input');
          inputs.PV = createLiteralOperand(parseInt(pvValue || '10'), 'INT');
          outputs.Q = createTagOperand('done_output');
          outputs.CV = createTagOperand('current_value');
        } else if (instructionId === 'CTD') {
          inputs.CD = createTagOperand('count_down_input');
          inputs.LD = createTagOperand('load_input');
          inputs.PV = createLiteralOperand(parseInt(pvValue || '10'), 'INT');
          outputs.Q = createTagOperand('done_output');
          outputs.CV = createTagOperand('current_value');
        } else {
          // CTUD
          inputs.CU = createTagOperand('count_up_input');
          inputs.CD = createTagOperand('count_down_input');
          inputs.R = createTagOperand('reset_input');
          inputs.LD = createTagOperand('load_input');
          inputs.PV = createLiteralOperand(parseInt(pvValue || '10'), 'INT');
          outputs.QU = createTagOperand('up_done');
          outputs.QD = createTagOperand('down_done');
          outputs.CV = createTagOperand('current_value');
        }

        newElement = createFunctionBlock(
          generateElementId('fb'),
          instructionId as FunctionBlockType,
          createTagOperand(tagName),
          inputs,
          outputs,
          position
        );
        break;

      case 'SR':
      case 'RS':
        newElement = createFunctionBlock(
          generateElementId('fb'),
          instructionId as FunctionBlockType,
          createTagOperand(tagName),
          {
            S: createTagOperand('set_input'),
            R: createTagOperand('reset_input'),
          },
          {
            Q: createTagOperand('output'),
          },
          position
        );
        break;

      case 'EQ':
      case 'NE':
      case 'LT':
      case 'GT':
      case 'LE':
      case 'GE':
        newElement = createComparison(
          generateElementId('cmp'),
          instructionId as ComparisonType,
          createTagOperand('value_a'),
          createTagOperand('value_b'),
          position
        );
        break;

      default:
        alert(`Instruction ${instructionId} not yet implemented in editor`);
        return;
    }

    if (!newElement) return;

    // Add element to rung
    const updatedRung: LadderRung = {
      ...network.rungs[rungIndex],
      elements: [...network.rungs[rungIndex].elements, newElement],
    };

    const updatedNetwork: LadderNetwork = {
      ...network,
      rungs: network.rungs.map((r, i) => (i === rungIndex ? updatedRung : r)),
    };

    const updatedProgram: LadderProgramFull = {
      ...program,
      networks: program.networks.map((n, i) => (i === selectedNetwork ? updatedNetwork : n)),
    };

    onProgramChange?.(updatedProgram);
  };

  /**
   * Handle cell click - place selected instruction
   */
  const handleCellClick = (rungIndex: number, position: GridPosition) => {
    if (!selectedInstruction) {
      return;
    }

    placeInstruction(selectedInstruction.id, rungIndex, position);
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, rungIndex: number, position: GridPosition) => {
    e.preventDefault();

    try {
      const data = e.dataTransfer.getData('application/json');
      const instruction = JSON.parse(data);
      placeInstruction(instruction.id, rungIndex, position);
    } catch (error) {
      console.error('Failed to parse dropped instruction:', error);
    }
  };

  /**
   * Handle add new rung
   */
  const handleAddRung = () => {
    const newRung = createEmptyRung(generateElementId('rung'));
    const updatedNetwork: LadderNetwork = {
      ...network,
      rungs: [...network.rungs, newRung],
    };

    const updatedProgram: LadderProgramFull = {
      ...program,
      networks: program.networks.map((net, i) => (i === selectedNetwork ? updatedNetwork : net)),
    };

    onProgramChange?.(updatedProgram);
  };

  /**
   * Handle delete rung
   */
  const handleDeleteRung = (rungIndex: number) => {
    if (network.rungs.length === 1) {
      alert('Cannot delete the last rung');
      return;
    }

    const updatedNetwork: LadderNetwork = {
      ...network,
      rungs: network.rungs.filter((_, i) => i !== rungIndex),
    };

    const updatedProgram: LadderProgramFull = {
      ...program,
      networks: program.networks.map((net, i) => (i === selectedNetwork ? updatedNetwork : net)),
    };

    onProgramChange?.(updatedProgram);
    setSelectedRung(null);
  };

  /**
   * Render a single grid cell
   */
  const renderCell = (rungIndex: number, row: number, col: number) => {
    const isHovered =
      hoveredCell?.row === row && hoveredCell?.col === col && selectedRung === rungIndex;
    const rung = network.rungs[rungIndex];

    // Find element at this position
    const element = rung.elements.find(
      (el) => el.position.row === row && el.position.col === col
    );

    const isSelected = element && selectedElement === element.id;

    return (
      <div
        key={`${row}-${col}`}
        className={`border border-gray-300 flex items-center justify-center text-xs font-mono transition-colors ${
          isHovered ? 'bg-blue-100 cursor-pointer' : 'bg-white'
        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          padding: CELL_PADDING,
        }}
        onClick={() => handleCellClick(rungIndex, { row, col })}
        onMouseEnter={() => setHoveredCell({ row, col })}
        onMouseLeave={() => setHoveredCell(null)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, rungIndex, { row, col })}
      >
        {element && renderElement(element)}
      </div>
    );
  };

  /**
   * Render ladder element visual representation
   */
  const renderElement = (element: LadderElement): React.ReactNode => {
    switch (element.elementType) {
      case 'contact': {
        const symbol = element.contactType === 'NO' ? '─┤ ├─' : '─┤/├─';
        const tagName =
          element.operand.type === 'tag' ? String(element.operand.value) : 'literal';
        return (
          <div className="flex flex-col items-center">
            <div className="font-mono text-sm">{symbol}</div>
            <div className="text-xs text-gray-600 truncate max-w-full">{tagName}</div>
          </div>
        );
      }

      case 'coil': {
        const symbol = element.coilType === 'OTE' ? '─( )─' : `─(${element.coilType[2]})─`;
        const tagName =
          element.operand.type === 'tag' ? String(element.operand.value) : 'literal';
        return (
          <div className="flex flex-col items-center">
            <div className="font-mono text-sm">{symbol}</div>
            <div className="text-xs text-gray-600 truncate max-w-full">{tagName}</div>
          </div>
        );
      }

      case 'comparison': {
        const opSymbol = {
          EQ: '=',
          NE: '≠',
          LT: '<',
          GT: '>',
          LE: '≤',
          GE: '≥',
        }[element.comparisonType];
        return (
          <div className="flex flex-col items-center text-xs">
            <div className="font-semibold">{opSymbol}</div>
            <div className="text-gray-600">CMP</div>
          </div>
        );
      }

      case 'functionBlock': {
        return (
          <div className="flex flex-col items-center text-xs">
            <div className="font-semibold">{element.blockType}</div>
            <div className="text-gray-600 truncate max-w-full">
              {element.instance.type === 'tag' ? String(element.instance.value) : 'inst'}
            </div>
          </div>
        );
      }

      default:
        return <div className="text-xs text-gray-400">?</div>;
    }
  };

  /**
   * Render a single rung with grid
   */
  const renderRung = (rung: LadderRung, rungIndex: number) => {
    const isSelected = selectedRung === rungIndex;

    return (
      <div
        key={rung.id}
        className={`mb-4 border-2 rounded-lg p-2 transition-all ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
        onClick={() => setSelectedRung(rungIndex)}
      >
        {/* Rung Header */}
        <div className="flex items-center justify-between mb-2 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Rung {rungIndex + 1}</span>
            {rung.comment && <span className="text-xs text-gray-500">{rung.comment}</span>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRung(rungIndex);
            }}
            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50"
            title="Delete rung"
          >
            Delete
          </button>
        </div>

        {/* Ladder Grid */}
        <div className="flex items-center">
          {/* Left Power Rail */}
          <div
            className="bg-gray-800 rounded"
            style={{
              width: 8,
              height: rung.gridSize.rows * CELL_SIZE,
              marginRight: 8,
            }}
          />

          {/* Grid Cells */}
          <div className="flex flex-col gap-0">
            {Array.from({ length: rung.gridSize.rows }).map((_, row) => (
              <div key={row} className="flex gap-0">
                {Array.from({ length: rung.gridSize.cols }).map((_, col) =>
                  renderCell(rungIndex, row, col)
                )}
              </div>
            ))}
          </div>

          {/* Right Power Rail */}
          <div
            className="bg-gray-800 rounded ml-2"
            style={{
              width: 8,
              height: rung.gridSize.rows * CELL_SIZE,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50" ref={editorRef}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {network.title}
          </h3>
          {network.comment && (
            <span className="text-sm text-gray-500">{network.comment}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRung}
            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors flex items-center gap-1"
          >
            <span>+</span>
            Add Rung
          </button>
        </div>
      </div>

      {/* Rungs */}
      <div className="flex-1 overflow-auto p-6">
        {network.rungs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-semibold mb-2">No rungs in this network</p>
            <p className="text-sm">Click "Add Rung" to create your first rung</p>
          </div>
        )}

        {network.rungs.map((rung, index) => renderRung(rung, index))}
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-gray-300 p-2 text-xs text-gray-600 flex items-center gap-4">
        <div>
          <span className="font-semibold">Network:</span> {selectedNetwork + 1} /{' '}
          {program.networks.length}
        </div>
        <div>
          <span className="font-semibold">Rungs:</span> {network.rungs.length}
        </div>
        {selectedInstruction && (
          <div className="text-blue-600 font-semibold">
            Selected: {selectedInstruction.name} (click a cell to place)
          </div>
        )}
      </div>
    </div>
  );
}

export default LadderEditor;
