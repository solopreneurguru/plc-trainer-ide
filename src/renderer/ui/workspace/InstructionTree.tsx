/**
 * Instruction Tree Component (TIA Portal Style)
 *
 * Hierarchical, collapsible tree of PLC instructions
 * organized by category (like TIA's right panel).
 *
 * Categories:
 * - Basic Instructions
 *   - Bit Logic Operations (Contacts, Coils)
 *   - Timer Operations (TON, TOF, TP)
 *   - Counter Operations (CTU, CTD, CTUD)
 *   - Comparison Operations (EQ, NE, LT, GT, LE, GE)
 *   - Math Operations (ADD, SUB, MUL, DIV, MOD)
 * - Advanced Instructions
 *   - Logical Operations (AND, OR, XOR, NOT)
 *   - Latch Operations (SR, RS)
 */

import { useState } from 'react';

interface Instruction {
  id: string;
  name: string;
  symbol: string;
  description: string;
  category: string;
}

interface InstructionCategory {
  id: string;
  name: string;
  icon: string;
  subcategories?: InstructionCategory[];
  instructions?: Instruction[];
}

const INSTRUCTION_TREE: InstructionCategory[] = [
  {
    id: 'basic',
    name: 'Basic Instructions',
    icon: '📦',
    subcategories: [
      {
        id: 'bit_logic',
        name: 'Bit Logic Operations',
        icon: '⚡',
        instructions: [
          { id: 'XIC', name: 'Examine If Closed', symbol: '─┤ ├─', description: 'Normally open contact', category: 'Contacts' },
          { id: 'XIO', name: 'Examine If Open', symbol: '─┤/├─', description: 'Normally closed contact', category: 'Contacts' },
          { id: 'P_EDGE', name: 'Positive Edge', symbol: '─┤P├─', description: 'Rising edge detection', category: 'Contacts' },
          { id: 'N_EDGE', name: 'Negative Edge', symbol: '─┤N├─', description: 'Falling edge detection', category: 'Contacts' },
          { id: 'OTE', name: 'Output Energize', symbol: '─( )─', description: 'Standard output coil', category: 'Coils' },
          { id: 'OTL', name: 'Output Latch', symbol: '─(L)─', description: 'Latching coil', category: 'Coils' },
          { id: 'OTU', name: 'Output Unlatch', symbol: '─(U)─', description: 'Unlatching coil', category: 'Coils' },
        ],
      },
      {
        id: 'timers',
        name: 'Timer Operations',
        icon: '⏱️',
        instructions: [
          { id: 'TON', name: 'Timer On-Delay', symbol: '┌TON─┐', description: 'On-delay timer', category: 'Timers' },
          { id: 'TOF', name: 'Timer Off-Delay', symbol: '┌TOF─┐', description: 'Off-delay timer', category: 'Timers' },
          { id: 'TP', name: 'Timer Pulse', symbol: '┌TP──┐', description: 'Pulse timer', category: 'Timers' },
        ],
      },
      {
        id: 'counters',
        name: 'Counter Operations',
        icon: '🔢',
        instructions: [
          { id: 'CTU', name: 'Count Up', symbol: '┌CTU─┐', description: 'Up counter', category: 'Counters' },
          { id: 'CTD', name: 'Count Down', symbol: '┌CTD─┐', description: 'Down counter', category: 'Counters' },
          { id: 'CTUD', name: 'Count Up/Down', symbol: '┌CTUD┐', description: 'Up/Down counter', category: 'Counters' },
        ],
      },
      {
        id: 'compare',
        name: 'Comparison Operations',
        icon: '⚖️',
        instructions: [
          { id: 'EQ', name: 'Equal', symbol: '─[A=B]─', description: 'Compare equal', category: 'Comparisons' },
          { id: 'NE', name: 'Not Equal', symbol: '─[A≠B]─', description: 'Compare not equal', category: 'Comparisons' },
          { id: 'LT', name: 'Less Than', symbol: '─[A<B]─', description: 'Compare less than', category: 'Comparisons' },
          { id: 'GT', name: 'Greater Than', symbol: '─[A>B]─', description: 'Compare greater than', category: 'Comparisons' },
          { id: 'LE', name: 'Less or Equal', symbol: '─[A≤B]─', description: 'Compare less or equal', category: 'Comparisons' },
          { id: 'GE', name: 'Greater or Equal', symbol: '─[A≥B]─', description: 'Compare greater or equal', category: 'Comparisons' },
        ],
      },
      {
        id: 'math',
        name: 'Math Operations',
        icon: '➕',
        instructions: [
          { id: 'ADD', name: 'Add', symbol: '┌ADD─┐', description: 'Addition', category: 'Math' },
          { id: 'SUB', name: 'Subtract', symbol: '┌SUB─┐', description: 'Subtraction', category: 'Math' },
          { id: 'MUL', name: 'Multiply', symbol: '┌MUL─┐', description: 'Multiplication', category: 'Math' },
          { id: 'DIV', name: 'Divide', symbol: '┌DIV─┐', description: 'Division', category: 'Math' },
          { id: 'MOD', name: 'Modulo', symbol: '┌MOD─┐', description: 'Modulo', category: 'Math' },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced Instructions',
    icon: '🔧',
    subcategories: [
      {
        id: 'logical',
        name: 'Logical Operations',
        icon: '🔀',
        instructions: [
          { id: 'AND', name: 'AND', symbol: '┌AND─┐', description: 'Logical AND', category: 'Logical' },
          { id: 'OR', name: 'OR', symbol: '┌OR──┐', description: 'Logical OR', category: 'Logical' },
          { id: 'XOR', name: 'XOR', symbol: '┌XOR─┐', description: 'Logical XOR', category: 'Logical' },
          { id: 'NOT', name: 'NOT', symbol: '┌NOT─┐', description: 'Logical NOT', category: 'Logical' },
        ],
      },
      {
        id: 'latches',
        name: 'Latch Operations',
        icon: '🔒',
        instructions: [
          { id: 'SR', name: 'Set/Reset', symbol: '┌SR──┐', description: 'SR latch', category: 'Latches' },
          { id: 'RS', name: 'Reset/Set', symbol: '┌RS──┐', description: 'RS latch', category: 'Latches' },
        ],
      },
    ],
  },
];

interface InstructionTreeProps {
  onSelectInstruction?: (instruction: Instruction) => void;
}

function InstructionTree({ onSelectInstruction }: InstructionTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['basic', 'bit_logic']) // Start with basic instructions expanded
  );
  const [selectedInstructionId, setSelectedInstructionId] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleInstructionClick = (instruction: Instruction) => {
    setSelectedInstructionId(instruction.id);
    onSelectInstruction?.(instruction);
  };

  const handleDragStart = (e: React.DragEvent, instruction: Instruction) => {
    e.dataTransfer.setData('application/json', JSON.stringify(instruction));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderInstruction = (instruction: Instruction) => {
    const isSelected = selectedInstructionId === instruction.id;

    return (
      <div
        key={instruction.id}
        draggable={true}
        onDragStart={(e) => handleDragStart(e, instruction)}
        onClick={() => handleInstructionClick(instruction)}
        className={`pl-8 pr-2 py-2 cursor-move hover:bg-gray-100 transition-colors ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        title={instruction.description}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">
            {instruction.symbol}
          </span>
          <span className="text-xs font-medium text-gray-700">{instruction.name}</span>
        </div>
      </div>
    );
  };

  const renderSubcategory = (subcategory: InstructionCategory, depth: number = 0) => {
    const isExpanded = expandedCategories.has(subcategory.id);
    const paddingLeft = depth * 12 + 8;

    return (
      <div key={subcategory.id}>
        {/* Subcategory Header */}
        <div
          onClick={() => toggleCategory(subcategory.id)}
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 cursor-pointer"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <span className="text-xs text-gray-500">{isExpanded ? '▾' : '▸'}</span>
          <span className="text-sm">{subcategory.icon}</span>
          <span className="text-xs font-semibold text-gray-700">{subcategory.name}</span>
        </div>

        {/* Instructions or Nested Subcategories */}
        {isExpanded && (
          <>
            {subcategory.instructions?.map(renderInstruction)}
            {subcategory.subcategories?.map((sub) => renderSubcategory(sub, depth + 1))}
          </>
        )}
      </div>
    );
  };

  const renderCategory = (category: InstructionCategory) => {
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className="mb-2">
        {/* Category Header */}
        <div
          onClick={() => toggleCategory(category.id)}
          className="flex items-center gap-2 px-2 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded"
        >
          <span className="text-sm text-gray-500">{isExpanded ? '▾' : '▸'}</span>
          <span className="text-base">{category.icon}</span>
          <span className="text-sm font-bold text-gray-800">{category.name}</span>
        </div>

        {/* Subcategories */}
        {isExpanded && (
          <div className="mt-1">
            {category.subcategories?.map((sub) => renderSubcategory(sub, 0))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-2">
      {INSTRUCTION_TREE.map(renderCategory)}

      {/* Help Text */}
      <div className="mt-4 mx-2 p-2 bg-blue-50 rounded text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Click to select, drag onto ladder to place</p>
      </div>
    </div>
  );
}

export default InstructionTree;
