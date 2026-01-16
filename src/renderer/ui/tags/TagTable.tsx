/**
 * Tag Table UI Component
 *
 * Spreadsheet-like interface for defining and managing PLC tags.
 */

import { useState } from 'react';
import {
  TagDefinition,
  TagDataType,
  createTag,
  validateTagName,
  validateAddress,
  getDefaultValue,
} from '../../../core/tags/TagDefinition';

interface TagTableProps {
  tags: TagDefinition[];
  onTagsChange: (tags: TagDefinition[]) => void;
}

function TagTable({ tags, onTagsChange }: TagTableProps) {
  const [editingCell, setEditingCell] = useState<{
    tagId: string;
    field: 'name' | 'dataType' | 'address' | 'initialValue' | 'comment';
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const dataTypes: TagDataType[] = ['BOOL', 'INT', 'DINT', 'REAL', 'TIME', 'TIMER', 'COUNTER'];

  const handleAddTag = () => {
    const newTag = createTag(`Tag_${tags.length + 1}`, 'BOOL');
    onTagsChange([...tags, newTag]);
  };

  const handleDeleteTag = (tagId: string) => {
    onTagsChange(tags.filter((t) => t.id !== tagId));
  };

  const startEditing = (tagId: string, field: keyof TagDefinition, currentValue: any) => {
    setEditingCell({ tagId, field: field as any });
    setEditValue(String(currentValue || ''));
    setValidationError(null);
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
    setValidationError(null);
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const { tagId, field } = editingCell;
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    // Validation
    if (field === 'name') {
      const validation = validateTagName(editValue);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid tag name');
        return;
      }

      // Check for duplicates
      const duplicate = tags.find((t) => t.id !== tagId && t.name === editValue);
      if (duplicate) {
        setValidationError('Tag name already exists');
        return;
      }
    }

    if (field === 'address' && editValue) {
      const validation = validateAddress(editValue);
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid address');
        return;
      }
    }

    // Update tag
    const updatedTags = tags.map((t) => {
      if (t.id !== tagId) return t;

      if (field === 'dataType') {
        // When changing data type, reset initial value
        return {
          ...t,
          dataType: editValue as TagDataType,
          initialValue: getDefaultValue(editValue as TagDataType),
        };
      }

      if (field === 'initialValue') {
        // Parse initial value based on data type
        let parsedValue: any = editValue;
        if (t.dataType === 'BOOL') {
          parsedValue = editValue.toLowerCase() === 'true' || editValue === '1';
        } else if (t.dataType === 'INT' || t.dataType === 'DINT') {
          parsedValue = parseInt(editValue) || 0;
        } else if (t.dataType === 'REAL') {
          parsedValue = parseFloat(editValue) || 0.0;
        } else if (t.dataType === 'TIME') {
          parsedValue = parseInt(editValue) || 0;
        }
        return { ...t, [field]: parsedValue };
      }

      return { ...t, [field]: editValue };
    });

    onTagsChange(updatedTags);
    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const formatInitialValue = (tag: TagDefinition): string => {
    if (tag.dataType === 'TIMER' || tag.dataType === 'COUNTER') {
      return '<struct>';
    }
    return String(tag.initialValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <span className="text-2xl">🏷️</span>
          Tag Table
        </h3>
        <button
          onClick={handleAddTag}
          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
        >
          <span>+</span>
          Add Tag
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-300 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Name
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Type
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Address
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Initial Value
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Comment
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300 w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-gray-200 hover:bg-gray-50">
                {/* Name */}
                <td className="px-3 py-2">
                  {editingCell?.tagId === tag.id && editingCell?.field === 'name' ? (
                    <div>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        autoFocus
                        className={`w-full px-2 py-1 border rounded font-mono text-sm ${
                          validationError ? 'border-red-500' : 'border-blue-500'
                        }`}
                      />
                      {validationError && (
                        <div className="text-xs text-red-500 mt-1">{validationError}</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded font-mono text-sm"
                      onClick={() => startEditing(tag.id, 'name', tag.name)}
                    >
                      {tag.name}
                    </div>
                  )}
                </td>

                {/* Data Type */}
                <td className="px-3 py-2">
                  {editingCell?.tagId === tag.id && editingCell?.field === 'dataType' ? (
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                    >
                      {dataTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm"
                      onClick={() => startEditing(tag.id, 'dataType', tag.dataType)}
                    >
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
                    </div>
                  )}
                </td>

                {/* Address */}
                <td className="px-3 py-2">
                  {editingCell?.tagId === tag.id && editingCell?.field === 'address' ? (
                    <div>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        autoFocus
                        placeholder="%I0.0"
                        className={`w-full px-2 py-1 border rounded font-mono text-sm ${
                          validationError ? 'border-red-500' : 'border-blue-500'
                        }`}
                      />
                      {validationError && (
                        <div className="text-xs text-red-500 mt-1">{validationError}</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded font-mono text-xs text-gray-600"
                      onClick={() => startEditing(tag.id, 'address', tag.address)}
                    >
                      {tag.address || <span className="text-gray-400 italic">optional</span>}
                    </div>
                  )}
                </td>

                {/* Initial Value */}
                <td className="px-3 py-2">
                  {tag.dataType === 'TIMER' || tag.dataType === 'COUNTER' ? (
                    <div className="px-2 py-1 text-sm text-gray-500 italic">&lt;struct&gt;</div>
                  ) : editingCell?.tagId === tag.id && editingCell?.field === 'initialValue' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={saveEdit}
                      autoFocus
                      className="w-full px-2 py-1 border border-blue-500 rounded font-mono text-sm"
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded font-mono text-sm"
                      onClick={() => startEditing(tag.id, 'initialValue', formatInitialValue(tag))}
                    >
                      {formatInitialValue(tag)}
                    </div>
                  )}
                </td>

                {/* Comment */}
                <td className="px-3 py-2">
                  {editingCell?.tagId === tag.id && editingCell?.field === 'comment' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={saveEdit}
                      autoFocus
                      className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-sm text-gray-600"
                      onClick={() => startEditing(tag.id, 'comment', tag.comment)}
                    >
                      {tag.comment || <span className="text-gray-400 italic">add comment</span>}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    title="Delete tag"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}

            {tags.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500 italic">
                  No tags defined. Click "Add Tag" to create your first tag.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Help Text */}
      <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Click any cell to edit. Press Enter to save or Escape to cancel.</p>
      </div>
    </div>
  );
}

export default TagTable;
