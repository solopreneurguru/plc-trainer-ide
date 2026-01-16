/**
 * Properties Panel Component
 *
 * Displays and allows editing of selected instruction parameters.
 * Shows different fields based on element type (contact, coil, timer, counter, etc.)
 */

import {
  LadderElement,
  LadderContact,
  LadderCoil,
  LadderFunctionBlock,
  LadderComparison,
  LadderOperand,
} from '../../../core/ladder/LadderModelFull';

interface PropertiesPanelProps {
  selectedElement: LadderElement | null;
  onElementChange?: (element: LadderElement) => void;
  onClose?: () => void;
}

function PropertiesPanel({ selectedElement, onElementChange, onClose }: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="h-full bg-gray-100 p-4 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <div className="font-semibold">No Element Selected</div>
          <div className="text-sm mt-1">Click an instruction on the grid to view its properties</div>
        </div>
      </div>
    );
  }

  const handleOperandChange = (operand: LadderOperand, newValue: string) => {
    const updatedOperand: LadderOperand = {
      ...operand,
      value: newValue,
    };

    const updatedElement = { ...selectedElement };

    // Update operand based on element type
    if (selectedElement.elementType === 'contact') {
      (updatedElement as LadderContact).operand = updatedOperand;
    } else if (selectedElement.elementType === 'coil') {
      (updatedElement as LadderCoil).operand = updatedOperand;
    }

    onElementChange?.(updatedElement);
  };

  const handleFunctionBlockInput = (pinName: string, newValue: string) => {
    if (selectedElement.elementType !== 'functionBlock') return;

    const fb = selectedElement as LadderFunctionBlock;
    const updatedInputs = {
      ...fb.inputs,
      [pinName]: {
        ...fb.inputs[pinName],
        value: newValue,
      },
    };

    const updatedElement: LadderFunctionBlock = {
      ...fb,
      inputs: updatedInputs,
    };

    onElementChange?.(updatedElement);
  };

  const handleFunctionBlockOutput = (pinName: string, newValue: string) => {
    if (selectedElement.elementType !== 'functionBlock') return;

    const fb = selectedElement as LadderFunctionBlock;
    const updatedOutputs = {
      ...fb.outputs,
      [pinName]: {
        ...fb.outputs[pinName],
        value: newValue,
      },
    };

    const updatedElement: LadderFunctionBlock = {
      ...fb,
      outputs: updatedOutputs,
    };

    onElementChange?.(updatedElement);
  };

  const renderContactProperties = (contact: LadderContact) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Type</label>
        <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">{contact.contactType}</div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tag Name</label>
        <input
          type="text"
          value={String(contact.operand.value)}
          onChange={(e) => handleOperandChange(contact.operand, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
        <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
          Row {contact.position.row}, Col {contact.position.col}
        </div>
      </div>
    </div>
  );

  const renderCoilProperties = (coil: LadderCoil) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Coil Type</label>
        <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">{coil.coilType}</div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tag Name</label>
        <input
          type="text"
          value={String(coil.operand.value)}
          onChange={(e) => handleOperandChange(coil.operand, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
        <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
          Row {coil.position.row}, Col {coil.position.col}
        </div>
      </div>
    </div>
  );

  const renderFunctionBlockProperties = (fb: LadderFunctionBlock) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Block Type</label>
        <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded text-sm font-mono font-semibold">
          {fb.blockType}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Instance Tag</label>
        <input
          type="text"
          value={String(fb.instance.value)}
          onChange={(e) =>
            onElementChange?.({
              ...fb,
              instance: { ...fb.instance, value: e.target.value },
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Inputs */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Inputs</label>
        <div className="space-y-2">
          {Object.entries(fb.inputs).map(([pinName, operand]) => (
            <div key={pinName}>
              <label className="block text-xs text-gray-600 mb-1">{pinName}</label>
              <input
                type="text"
                value={String(operand.value)}
                onChange={(e) => handleFunctionBlockInput(pinName, e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Outputs */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Outputs</label>
        <div className="space-y-2">
          {Object.entries(fb.outputs).map(([pinName, operand]) => (
            <div key={pinName}>
              <label className="block text-xs text-gray-600 mb-1">{pinName}</label>
              <input
                type="text"
                value={String(operand.value)}
                onChange={(e) => handleFunctionBlockOutput(pinName, e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
        <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
          Row {fb.position.row}, Col {fb.position.col}
        </div>
      </div>
    </div>
  );

  const renderComparisonProperties = (cmp: LadderComparison) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Comparison Type</label>
        <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded text-sm font-mono font-semibold">
          {cmp.comparisonType}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Operand A</label>
        <input
          type="text"
          value={String(cmp.operandA.value)}
          onChange={(e) =>
            onElementChange?.({
              ...cmp,
              operandA: { ...cmp.operandA, value: e.target.value },
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Operand B</label>
        <input
          type="text"
          value={String(cmp.operandB.value)}
          onChange={(e) =>
            onElementChange?.({
              ...cmp,
              operandB: { ...cmp.operandB, value: e.target.value },
            })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
        <div className="px-3 py-2 bg-gray-100 rounded text-sm font-mono">
          Row {cmp.position.row}, Col {cmp.position.col}
        </div>
      </div>
    </div>
  );

  const getElementTitle = (): string => {
    switch (selectedElement.elementType) {
      case 'contact':
        return `Contact (${(selectedElement as LadderContact).contactType})`;
      case 'coil':
        return `Coil (${(selectedElement as LadderCoil).coilType})`;
      case 'functionBlock':
        return `Function Block (${(selectedElement as LadderFunctionBlock).blockType})`;
      case 'comparison':
        return `Comparison (${(selectedElement as LadderComparison).comparisonType})`;
      default:
        return 'Element';
    }
  };

  return (
    <div className="h-full bg-white border-l border-gray-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Properties
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <div className="text-sm font-semibold text-blue-900">{getElementTitle()}</div>
          <div className="text-xs text-blue-700 mt-1">ID: {selectedElement.id}</div>
        </div>

        {selectedElement.elementType === 'contact' &&
          renderContactProperties(selectedElement as LadderContact)}
        {selectedElement.elementType === 'coil' &&
          renderCoilProperties(selectedElement as LadderCoil)}
        {selectedElement.elementType === 'functionBlock' &&
          renderFunctionBlockProperties(selectedElement as LadderFunctionBlock)}
        {selectedElement.elementType === 'comparison' &&
          renderComparisonProperties(selectedElement as LadderComparison)}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-300 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="font-semibold mb-1">💡 Tip:</p>
          <p>Edit tag names and parameters above. Changes are saved automatically.</p>
        </div>
      </div>
    </div>
  );
}

export default PropertiesPanel;
