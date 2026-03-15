import { useState } from 'react';
import type { GroceryItem } from '../types';
import { groupByCategory } from '../hooks/useGroceryList';
import { CATEGORIES } from '../data/defaults';

interface Props {
  items: GroceryItem[];
  manualItems: GroceryItem[];
  onAddManual: (item: GroceryItem) => void;
  onRemoveManual: (id: string) => void;
  onSendToInstacart: () => void;
  instacartLoading: boolean;
  instacartError: string | null;
}

const SOURCE_LABEL: Record<string, string> = {
  staple: '🛒',
  prompted: '🔁',
  search: '🔎',
  recipe: '🍴',
  manual: '✏️',
};

export function GroceryList({
  items,
  manualItems,
  onAddManual,
  onRemoveManual,
  onSendToInstacart,
  instacartLoading,
  instacartError,
}: Props) {
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('');
  const [newCat, setNewCat] = useState('Other');
  const [showCopied, setShowCopied] = useState(false);

  const grouped = groupByCategory(items);
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORIES.indexOf(a);
    const bi = CATEGORIES.indexOf(b);
    const aIdx = ai === -1 ? 999 : ai;
    const bIdx = bi === -1 ? 999 : bi;
    return aIdx - bIdx;
  });

  function addItem() {
    if (!newName.trim()) return;
    onAddManual({
      id: `manual-${Date.now()}`,
      name: newName.trim(),
      quantity: parseFloat(newQty) || 1,
      unit: newUnit.trim() || undefined,
      category: newCat,
      source: 'manual',
    });
    setNewName('');
    setNewQty('1');
    setNewUnit('');
  }

  function copyToClipboard() {
    const text = sortedCategories
      .map((cat) => {
        const catItems = grouped[cat]
          .map(
            (i) =>
              `  ${SOURCE_LABEL[i.source] || ''} ${i.quantity}${
                i.unit ? ' ' + i.unit : ''
              } ${i.name}`
          )
          .join('\n');
        return `${cat}:\n${catItems}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📋</span> This Week's List
          <span className="text-sm font-normal text-gray-400">
            ({items.length} items)
          </span>
        </h2>
        <button
          onClick={copyToClipboard}
          className="text-xs text-gray-500 hover:text-gray-700"
          title="Copy list to clipboard"
        >
          {showCopied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Quick add */}
      <div className="flex gap-1.5 mb-3">
        <input
          className="flex-1 border rounded px-2 py-1.5 text-sm min-w-0"
          placeholder="Add item…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <input
          className="w-14 border rounded px-2 py-1.5 text-sm"
          type="number"
          min="0.1"
          step="0.5"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          placeholder="Qty"
        />
        <input
          className="w-16 border rounded px-2 py-1.5 text-sm"
          placeholder="Unit"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
        />
        <select
          className="w-24 border rounded px-1 py-1.5 text-xs"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={addItem}
          className="bg-gray-800 text-white rounded px-3 py-1.5 text-sm hover:bg-black"
        >
          +
        </button>
      </div>

      {/* Grouped list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            Your list is empty. Add staples, check prompted items, or pick meals.
          </p>
        )}
        {sortedCategories.map((cat) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              {cat}
            </p>
            <div className="space-y-0.5">
              {grouped[cat].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-50 group"
                >
                  <span className="text-xs">{SOURCE_LABEL[item.source] ?? '·'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="text-gray-800 truncate block">
                      {(item as GroceryItem & { label?: string }).label ?? item.name}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {item.quantity}
                    {item.unit && !((item as GroceryItem & { label?: string }).label) ? ' ' + item.unit : ''}
                  </span>
                  {item.upc && (
                    <span className="text-xs text-gray-200 flex-shrink-0" title={`UPC ${item.upc}`}>🎯</span>
                  )}
                  {(item.source === 'manual' || item.source === 'search') && (
                    <button
                      onClick={() => onRemoveManual(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Instacart button */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        {instacartError && (
          <p className="text-xs text-red-500 bg-red-50 rounded p-2">
            {instacartError}
          </p>
        )}
        <button
          onClick={onSendToInstacart}
          disabled={items.length === 0 || instacartLoading}
          className="w-full bg-[#43B02A] text-white rounded-lg py-3 font-semibold text-sm hover:bg-[#3a9c24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {instacartLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating cart…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.1 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.44 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              Send to Instacart ({items.length} items)
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Opens a pre-filled Instacart cart in your browser
        </p>
      </div>
    </div>
  );
}
