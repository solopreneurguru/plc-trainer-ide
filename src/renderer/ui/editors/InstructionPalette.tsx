/**
 * Instruction Palette Component
 *
 * Displays available PLC instructions organized by category.
 * Users can browse and select instructions to add to their programs.
 * Phase 1C will add drag-and-drop functionality.
 */

import { useState } from 'react';

// Instruction definition
interface Instruction {
  id: string;
  name: string;
  symbol: string;
  description: string;
  category: string;
}

// Instruction categories
const INSTRUCTION_CATEGORIES = [
  'Contacts',
  'Coils',
  'Timers',
  'Counters',
  'Comparisons',
  'Math',
  'Logical',
  'Latches',
] as const;

// Available instructions organized by category
const INSTRUCTIONS: Instruction[] = [
  // Contacts
  {
    id: 'XIC',
    name: 'Examine If Closed',
    symbol: '─┤ ├─',
    description: 'Contact closes when input is TRUE (normally open)',
    category: 'Contacts',
  },
  {
    id: 'XIO',
    name: 'Examine If Open',
    symbol: '─┤/├─',
    description: 'Contact closes when input is FALSE (normally closed)',
    category: 'Contacts',
  },
  {
    id: 'P_EDGE',
    name: 'Positive Edge',
    symbol: '─┤P├─',
    description: 'Activates for one scan on FALSE→TRUE transition',
    category: 'Contacts',
  },
  {
    id: 'N_EDGE',
    name: 'Negative Edge',
    symbol: '─┤N├─',
    description: 'Activates for one scan on TRUE→FALSE transition',
    category: 'Contacts',
  },

  // Coils
  {
    id: 'OTE',
    name: 'Output Energize',
    symbol: '─( )─',
    description: 'Sets output TRUE when rung is TRUE',
    category: 'Coils',
  },
  {
    id: 'OTL',
    name: 'Output Latch',
    symbol: '─(L)─',
    description: 'Latches output ON (stays ON until unlatched)',
    category: 'Coils',
  },
  {
    id: 'OTU',
    name: 'Output Unlatch',
    symbol: '─(U)─',
    description: 'Unlatches output OFF',
    category: 'Coils',
  },

  // Timers
  {
    id: 'TON',
    name: 'Timer On-Delay',
    symbol: '┌TON─┐',
    description: 'Output turns ON after preset time when input is TRUE',
    category: 'Timers',
  },
  {
    id: 'TOF',
    name: 'Timer Off-Delay',
    symbol: '┌TOF─┐',
    description: 'Output turns OFF after preset time when input goes FALSE',
    category: 'Timers',
  },
  {
    id: 'TP',
    name: 'Timer Pulse',
    symbol: '┌TP──┐',
    description: 'Generates fixed-length pulse on rising edge',
    category: 'Timers',
  },

  // Counters
  {
    id: 'CTU',
    name: 'Count Up',
    symbol: '┌CTU─┐',
    description: 'Increments count on rising edge of CU input',
    category: 'Counters',
  },
  {
    id: 'CTD',
    name: 'Count Down',
    symbol: '┌CTD─┐',
    description: 'Decrements count on rising edge of CD input',
    category: 'Counters',
  },
  {
    id: 'CTUD',
    name: 'Count Up/Down',
    symbol: '┌CTUD┐',
    description: 'Combined up/down counter with dual outputs',
    category: 'Counters',
  },

  // Comparisons
  {
    id: 'EQ',
    name: 'Equal',
    symbol: '─[A=B]─',
    description: 'TRUE when A equals B',
    category: 'Comparisons',
  },
  {
    id: 'NE',
    name: 'Not Equal',
    symbol: '─[A≠B]─',
    description: 'TRUE when A not equal to B',
    category: 'Comparisons',
  },
  {
    id: 'LT',
    name: 'Less Than',
    symbol: '─[A<B]─',
    description: 'TRUE when A is less than B',
    category: 'Comparisons',
  },
  {
    id: 'LE',
    name: 'Less or Equal',
    symbol: '─[A≤B]─',
    description: 'TRUE when A is less than or equal to B',
    category: 'Comparisons',
  },
  {
    id: 'GT',
    name: 'Greater Than',
    symbol: '─[A>B]─',
    description: 'TRUE when A is greater than B',
    category: 'Comparisons',
  },
  {
    id: 'GE',
    name: 'Greater or Equal',
    symbol: '─[A≥B]─',
    description: 'TRUE when A is greater than or equal to B',
    category: 'Comparisons',
  },

  // Math
  {
    id: 'ADD',
    name: 'Add',
    symbol: '┌ADD─┐',
    description: 'Adds two values: Result = A + B',
    category: 'Math',
  },
  {
    id: 'SUB',
    name: 'Subtract',
    symbol: '┌SUB─┐',
    description: 'Subtracts two values: Result = A - B',
    category: 'Math',
  },
  {
    id: 'MUL',
    name: 'Multiply',
    symbol: '┌MUL─┐',
    description: 'Multiplies two values: Result = A × B',
    category: 'Math',
  },
  {
    id: 'DIV',
    name: 'Divide',
    symbol: '┌DIV─┐',
    description: 'Divides two values: Result = A ÷ B',
    category: 'Math',
  },
  {
    id: 'MOD',
    name: 'Modulo',
    symbol: '┌MOD─┐',
    description: 'Remainder of division: Result = A % B',
    category: 'Math',
  },

  // Logical
  {
    id: 'AND',
    name: 'AND',
    symbol: '┌AND─┐',
    description: 'Logical AND operation',
    category: 'Logical',
  },
  {
    id: 'OR',
    name: 'OR',
    symbol: '┌OR──┐',
    description: 'Logical OR operation',
    category: 'Logical',
  },
  {
    id: 'XOR',
    name: 'XOR',
    symbol: '┌XOR─┐',
    description: 'Logical exclusive OR operation',
    category: 'Logical',
  },
  {
    id: 'NOT',
    name: 'NOT',
    symbol: '┌NOT─┐',
    description: 'Logical NOT (invert) operation',
    category: 'Logical',
  },

  // Latches
  {
    id: 'SR',
    name: 'Set/Reset Latch',
    symbol: '┌SR──┐',
    description: 'Bistable latch (Set priority)',
    category: 'Latches',
  },
  {
    id: 'RS',
    name: 'Reset/Set Latch',
    symbol: '┌RS──┐',
    description: 'Bistable latch (Reset priority)',
    category: 'Latches',
  },
];

interface InstructionPaletteProps {
  onSelectInstruction?: (instruction: Instruction) => void;
}

function InstructionPalette({ onSelectInstruction }: InstructionPaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);

  // Filter instructions by category and search
  const filteredInstructions = INSTRUCTIONS.filter((inst) => {
    const matchesCategory = selectedCategory === 'All' || inst.category === selectedCategory;
    const matchesSearch =
      searchFilter === '' ||
      inst.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      inst.id.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get instruction count per category
  const getCategoryCount = (category: string): number => {
    if (category === 'All') return INSTRUCTIONS.length;
    return INSTRUCTIONS.filter((inst) => inst.category === category).length;
  };

  const handleInstructionClick = (instruction: Instruction) => {
    setSelectedInstruction(instruction);
    onSelectInstruction?.(instruction);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
          <span className="text-2xl">🧰</span>
          Instruction Palette
        </h3>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search instructions..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="text-gray-500 hover:text-gray-700"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'All'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({getCategoryCount('All')})
        </button>
        {INSTRUCTION_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category} ({getCategoryCount(category)})
          </button>
        ))}
      </div>

      {/* Instruction List */}
      <div className="flex-1 overflow-auto border border-gray-300 rounded">
        <div className="p-2 space-y-1">
          {filteredInstructions.map((instruction) => (
            <button
              key={instruction.id}
              onClick={() => handleInstructionClick(instruction)}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify(instruction));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className={`w-full text-left p-3 rounded border transition-all cursor-move ${
                selectedInstruction?.id === instruction.id
                  ? 'bg-blue-50 border-blue-500 shadow-md'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
              title={instruction.description}
            >
              <div className="flex items-center gap-3">
                {/* Symbol */}
                <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border border-gray-300 min-w-[70px] text-center">
                  {instruction.symbol}
                </div>

                {/* Name and Description */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-800">{instruction.name}</div>
                  <div className="text-xs text-gray-600 truncate">{instruction.description}</div>
                </div>

                {/* ID Badge */}
                <div className="px-2 py-0.5 bg-gray-200 rounded text-xs font-mono font-semibold text-gray-700">
                  {instruction.id}
                </div>
              </div>
            </button>
          ))}

          {filteredInstructions.length === 0 && (
            <div className="text-center py-8 text-gray-500 italic text-sm">
              {searchFilter
                ? `No instructions found matching "${searchFilter}"`
                : `No instructions in ${selectedCategory} category`}
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>
          Click an instruction to select it, then click a grid cell in the LAD Editor to place it.
          Or drag-and-drop instructions directly onto the editor grid!
        </p>
      </div>
    </div>
  );
}

export default InstructionPalette;
