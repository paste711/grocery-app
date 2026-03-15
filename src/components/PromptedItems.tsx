import { useState } from 'react';
import type { PromptedItem } from '../types';
import { CATEGORIES } from '../data/defaults';

interface Props {
  items: PromptedItem[];
  onChange: (items: PromptedItem[]) => void;
}

export function PromptedItems({ items, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [newCat, setNewCat] = useState('Pantry');

  function toggle(id: string) {
    onChange(
      items.map((i) => (i.id === id ? { ...i, included: !i.included } : i))
    );
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

  const needed = items.filter((i) => i.included);
  const skipped = items.filter((i) => !i.included);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
          <span>🔔</span> Do You Need These?
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-orange-500 hover:text-orange-700 font-medium"
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Check anything you're running low on this week.
      </p>

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
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addItem}
            className="w-full bg-orange-500 text-white rounded py-1 text-sm hover:bg-orange-600"
          >
            Add Prompted Item
          </button>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <PromptRow key={item.id} item={item} onToggle={toggle} onRemove={remove} />
        ))}
      </div>

      {needed.length > 0 && (
        <p className="text-xs text-orange-600 font-medium">
          {needed.length} item{needed.length !== 1 ? 's' : ''} added to list
        </p>
      )}
      {skipped.length === items.length && items.length > 0 && (
        <p className="text-xs text-gray-400">None selected — check items you need.</p>
      )}
    </div>
  );
}

function PromptRow({
  item,
  onToggle,
  onRemove,
}: {
  item: PromptedItem;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm group transition-colors ${
        item.included
          ? 'bg-orange-50 border border-orange-200'
          : 'bg-gray-50 border border-gray-100'
      }`}
    >
      <input
        type="checkbox"
        checked={item.included}
        onChange={() => onToggle(item.id)}
        className="accent-orange-500"
      />
      <span
        className={`flex-1 font-medium ${
          item.included ? 'text-gray-800' : 'text-gray-400'
        }`}
      >
        {item.name}
      </span>
      <span className="text-gray-400 text-xs">
        {item.quantity} {item.unit}
      </span>
      <button
        onClick={() => onRemove(item.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs px-1"
      >
        ✕
      </button>
    </div>
  );
}
