import type { GroceryItem } from '../types';
import { ItemSearch } from './ItemSearch';

interface Props {
  items: GroceryItem[];
  onAdd: (item: GroceryItem) => void;
  onRemove: (id: string) => void;
}

export function WhatElse({ items, onAdd, onRemove }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-purple-700 flex items-center gap-2">
          <span>🔎</span> What Else?
          {items.length > 0 && (
            <span className="text-xs font-normal bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">
              {items.length} added
            </span>
          )}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Search by name to find specific brands, sizes, and variants from the product catalog.
        </p>
      </div>

      <ItemSearch onAdd={onAdd} />

      {items.length > 0 && (
        <div className="space-y-0.5 pt-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-100 text-sm group"
            >
              {/* Thumbnail if available */}
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-7 h-7 rounded object-contain bg-gray-50 flex-shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {!item.imageUrl && <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />}

              <span className="flex-1 min-w-0">
                <span className="font-medium text-gray-800 truncate block">
                  {(item as GroceryItem & { label?: string }).label ?? item.name}
                </span>
              </span>

              {item.upc && (
                <span
                  className="text-xs text-gray-300 flex-shrink-0"
                  title={`UPC ${item.upc} — Instacart will match exact product`}
                >
                  🎯
                </span>
              )}

              <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs ml-1 flex-shrink-0"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-gray-300 text-center py-2">
          Nothing added yet — search above to find specific products.
        </p>
      )}
    </div>
  );
}
