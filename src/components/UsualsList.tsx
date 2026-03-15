import { useState } from 'react';
import type { PromptedItem } from '../types';
import { CATEGORIES } from '../data/defaults';

interface Props {
  items: PromptedItem[];
  onChange: (items: PromptedItem[]) => void;
}

export function UsualsList({ items, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [newCat, setNewCat] = useState('Pantry');

  function toggle(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, included: !i.included } : i)));
  }

  function selectAll() {
    onChange(items.map((i) => ({ ...i, included: true })));
  }

  function clearAll() {
    onChange(items.map((i) => ({ ...i, included: false })));
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function addItem() {
    if (!newName.trim()) return;
    onChange([
      ...items,
      {
        id: `p-${Date.now()}`,
        name: newName.trim(),
        quantity: parseFloat(newQty) || 1,
        unit: newUnit.trim() || undefined,
        category: newCat,
        included: true,
      },
    ]);
    setNewName('');
    setNewQty('1');
    setNewUnit('');
    setAdding(false);
  }

  const includedCount = items.filter((i) => i.included).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-orange-700 flex items-center gap-2">
          <span>🔁</span> Usuals
          {includedCount > 0 && (
            <span className="text-xs font-normal bg-orange-100 text-orange-600 rounded-full px-2 py-0.5">
              {includedCount} selected
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdding(!adding)}
            className="text-xs text-orange-500 hover:text-orange-700 font-medium"
          >
            {adding ? 'Cancel' : '+ Add'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 -mt-1">
        Things you buy most weeks. Check what you're running low on.
      </p>

      {/* Select / clear all */}
      {items.length > 0 && (
        <div className="flex gap-3 text-xs">
          <button onClick={selectAll} className="text-orange-500 hover:text-orange-700 font-medium">
            Select all
          </button>
          <button onClick={clearAll} className="text-gray-400 hover:text-gray-600">
            Clear all
          </button>
        </div>
      )}

      {adding && (
        <div className="bg-orange-50 rounded-lg p-3 space-y-2 border border-orange-200">
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Item name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            autoFocus
          />
          <div className="flex gap-2">
            <input
              className="w-20 border rounded px-2 py-1 text-sm"
              placeholder="Qty"
              type="number"
              min="0.1"
              step="0.5"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
            />
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Unit"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
            />
            <select
              className="flex-1 border rounded px-1 py-1 text-xs"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button
            onClick={addItem}
            className="w-full bg-orange-500 text-white rounded py-1 text-sm hover:bg-orange-600"
          >
            Add to Usuals
          </button>
        </div>
      )}

      <div className="space-y-0.5">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors ${
              item.included
                ? 'bg-orange-50 border border-orange-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <input
              type="checkbox"
              checked={item.included}
              onChange={() => toggle(item.id)}
              className="accent-orange-500 w-4 h-4 flex-shrink-0"
            />
            <span
              className={`flex-1 text-sm font-medium ${
                item.included ? 'text-gray-800' : 'text-gray-500'
              }`}
            >
              {item.name}
            </span>
            <span className="text-xs text-gray-400">
              {item.quantity}{item.unit ? ' ' + item.unit : ''}
            </span>
            <button
              onClick={(e) => { e.preventDefault(); remove(item.id); }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs ml-1"
              title="Remove from usuals"
            >
              ✕
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
