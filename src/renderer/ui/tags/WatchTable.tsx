/**
 * Watch Table UI Component
 *
 * Real-time monitoring of tag values during PLC execution.
 * Displays tags with their current runtime values and highlights changes.
 */

import { useState, useEffect, useRef } from 'react';
import { TagDefinition } from '../../../core/tags/TagDefinition';
import { TimerInstance, CounterInstance, LatchInstance } from '../../../core/ir/types';

interface WatchTableProps {
  tags: TagDefinition[];
  tagValues: Record<string, any>;
  scanNumber: number;
  scanDuration: number;
}

interface TagWatch {
  tag: TagDefinition;
  value: any;
  previousValue: any;
  hasChanged: boolean;
}

function WatchTable({ tags, tagValues, scanNumber, scanDuration }: WatchTableProps) {
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [tagWatches, setTagWatches] = useState<Map<string, TagWatch>>(new Map());
  const previousValuesRef = useRef<Map<string, any>>(new Map());

  // Update tag watches when values change
  useEffect(() => {
    const newWatches = new Map<string, TagWatch>();

    tags.forEach((tag) => {
      const currentValue = tagValues[tag.name];
      const previousValue = previousValuesRef.current.get(tag.name);
      const hasChanged = currentValue !== previousValue && previousValue !== undefined;

      newWatches.set(tag.name, {
        tag,
        value: currentValue,
        previousValue,
        hasChanged,
      });

      // Update previous value for next comparison
      previousValuesRef.current.set(tag.name, currentValue);
    });

    setTagWatches(newWatches);

    // Clear change highlights after 300ms
    const timeout = setTimeout(() => {
      setTagWatches((prev) => {
        const updated = new Map(prev);
        updated.forEach((watch) => {
          updated.set(watch.tag.name, { ...watch, hasChanged: false });
        });
        return updated;
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [tags, tagValues]);

  // Filter tags based on search input
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const formatValue = (tag: TagDefinition, value: any): string => {
    if (value === undefined || value === null) {
      return '-';
    }

    // Format complex types (Timer, Counter, Latch)
    if (tag.dataType === 'TIMER') {
      const timer = value as TimerInstance;
      return `Q:${timer.Q ? 'TRUE' : 'FALSE'}, ET:${timer.ET}ms`;
    }

    if (tag.dataType === 'COUNTER') {
      const counter = value as CounterInstance;
      if (counter.type === 'CTUD') {
        return `QU:${counter.QU ? 'TRUE' : 'FALSE'}, QD:${counter.QD ? 'TRUE' : 'FALSE'}, CV:${counter.CV}`;
      } else {
        return `Q:${counter.Q ? 'TRUE' : 'FALSE'}, CV:${counter.CV}`;
      }
    }

    // Format simple types
    if (tag.dataType === 'BOOL') {
      return value ? 'TRUE' : 'FALSE';
    }

    if (tag.dataType === 'REAL') {
      return typeof value === 'number' ? value.toFixed(2) : String(value);
    }

    if (tag.dataType === 'TIME') {
      return `${value}ms`;
    }

    return String(value);
  };

  const getValueColor = (tag: TagDefinition, value: any): string => {
    if (value === undefined || value === null) {
      return 'text-gray-400';
    }

    if (tag.dataType === 'BOOL') {
      return value ? 'text-green-600 font-semibold' : 'text-gray-500';
    }

    return 'text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            Watch Table
          </h3>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-semibold">Scan:</span>
              <span className="font-mono">{scanNumber}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">Duration:</span>
              <span className="font-mono">{scanDuration}ms</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold">Tags:</span>
              <span className="font-mono">{tags.length}</span>
            </div>
          </div>
        </div>

        {/* Search Filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search tags..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-300 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Tag Name
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Type
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Address
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.map((tag) => {
              const watch = tagWatches.get(tag.name);
              const hasChanged = watch?.hasChanged || false;
              const value = watch?.value;

              return (
                <tr
                  key={tag.id}
                  className={`border-b border-gray-200 transition-colors duration-300 ${
                    hasChanged ? 'bg-yellow-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Tag Name */}
                  <td className="px-3 py-2 font-mono text-sm font-semibold text-gray-800">
                    {tag.name}
                  </td>

                  {/* Data Type */}
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        tag.dataType === 'BOOL'
                          ? 'bg-green-100 text-green-700'
                          : tag.dataType === 'TIMER'
                          ? 'bg-blue-100 text-blue-700'
                          : tag.dataType === 'COUNTER'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {tag.dataType}
                    </span>
                  </td>

                  {/* Address */}
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">
                    {tag.address || <span className="text-gray-400 italic">-</span>}
                  </td>

                  {/* Value */}
                  <td className={`px-3 py-2 font-mono text-sm ${getValueColor(tag, value)}`}>
                    {formatValue(tag, value)}
                  </td>
                </tr>
              );
            })}

            {filteredTags.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-500 italic">
                  {searchFilter
                    ? `No tags found matching "${searchFilter}"`
                    : 'No tags to watch. Add tags in the Tag Table.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Help Text */}
      <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>
          Values highlight yellow when changed. Use the search box to filter tags. Start the PLC
          runtime to see live values update.
        </p>
      </div>
    </div>
  );
}

export default WatchTable;
