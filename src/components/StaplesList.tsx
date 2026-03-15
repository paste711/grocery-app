import { useState } from 'react';
import type { Staple } from '../types';
import { CATEGORIES } from '../data/defaults';

interface Props {
  staples: Staple[];
  onChange: (staples: Staple[]) => void;
}

export function StaplesList({ staples, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [newCat, setNewCat] = useState('Produce');

  function toggleInclude(id: string) {
    onChange(
      staples.map((s) =>
        s.id === id ? { ...s, alwaysInclude: !s.alwaysInclude } : s
      )
    );
  }

  function remove(id: string) {
    onChange(staples.filter((s) => s.id !== id));
  }

  function addItem() {
    if (!newName.trim()) return;
    const id = `s-${Date.now()}`;
    onChange([
      ...staples,
      {
        id,
        name: newName.trim(),
        quantity: parseFloat(newQty) || 1,
        unit: newUnit.trim() || undefined,
        category: newCat,
        alwaysInclude: true,
      },
    ]);
    setNewName('');
    setNewQty('1');
    setNewUnit('');
    setAdding(false);
  }

  const always = staples.filter((s) => s.alwaysInclude);
  const optional = staples.filter((s) => !s.alwaysInclude);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2">
          <span>🛒</span> Weekly Staples
        </h2>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-green-600 hover:text-green-800 font-medium"
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Always-included items appear in every cart. Uncheck to demote to
        "prompted" status.
      </p>

      {adding && (
        <div className="bg-green-50 rounded-lg p-3 space-y-2 border border-green-200">
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
              placeholder="Unit (e.g. lb, bag)"
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
            className="w-full bg-green-600 text-white rounded py-1 text-sm hover:bg-green-700"
          >
            Add Staple
          </button>
        </div>
      )}

      <div className="space-y-1">
        {always.map((s) => (
          <StapleRow key={s.id} staple={s} onToggle={toggleInclude} onRemove={remove} />
        ))}
        {optional.length > 0 && (
          <>
            <p className="text-xs text-gray-400 pt-2 pb-1 font-medium uppercase tracking-wide">
              Not always included
            </p>
            {optional.map((s) => (
              <StapleRow key={s.id} staple={s} onToggle={toggleInclude} onRemove={remove} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function StapleRow({
  staple,
  onToggle,
  onRemove,
}: {
  staple: Staple;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm group ${
        staple.alwaysInclude ? 'bg-white border border-gray-100' : 'bg-gray-50 opacity-70'
      }`}
    >
      <input
        type="checkbox"
        checked={staple.alwaysInclude}
        onChange={() => onToggle(staple.id)}
        className="accent-green-600"
      />
      <span className="flex-1 font-medium text-gray-800">{staple.name}</span>
      <span className="text-gray-400 text-xs">
        {staple.quantity} {staple.unit}
      </span>
      <button
        onClick={() => onRemove(staple.id)}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs px-1"
      >
        ✕
      </button>
    </div>
  );
}
