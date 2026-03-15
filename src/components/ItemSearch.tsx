import { useState, useRef, useEffect, useCallback } from 'react';
import type { GroceryItem } from '../types';

interface ProductResult {
  id: string;
  upc: string | null;
  name: string;
  brand: string | null;
  size: string | null;
  imageUrl: string | null;
  category: string | null;
}

interface Props {
  onAdd: (item: GroceryItem) => void;
}

const DEBOUNCE_MS = 320;

export function ItemSearch({ onAdd }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [searchError, setSearchError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setSearchError(false);
    try {
      const res = await fetch(`/api/search/products?q=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      setResults(data.products ?? []);
      setOpen(true);
      setHighlightIndex(-1);
      if (!res.ok || data.error) setSearchError(true);
    } catch {
      setSearchError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), DEBOUNCE_MS);
  }

  function selectProduct(p: ProductResult) {
    const label = [p.brand, p.name, p.size].filter(Boolean).join(' · ');
    onAdd({
      id: `search-${p.id}-${Date.now()}`,
      name: p.name,
      label,
      brand: p.brand ?? undefined,
      quantity: 1,
      unit: p.size ?? undefined,
      category: p.category ?? 'Other',
      source: 'search',
      upc: p.upc,
      imageUrl: p.imageUrl,
    } as GroceryItem & { brand?: string });
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function addFreeText() {
    if (!query.trim()) return;
    onAdd({
      id: `search-text-${Date.now()}`,
      name: query.trim(),
      label: query.trim(),
      quantity: 1,
      source: 'search',
    });
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    const total = results.length + 1; // +1 for free-text entry at bottom
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + total) % total);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < results.length) {
        selectProduct(results[highlightIndex]);
      } else {
        addFreeText();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products — brand, size, variant…"
          className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-shadow"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (query.length >= 2) && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
          {searchError && results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-yellow-700 bg-yellow-50">
              Product search unavailable — you can still add the item by name below.
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-xs text-gray-500">
              No products found for "{query}"
            </div>
          ) : (
            results.map((p, i) => (
              <button
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); selectProduct(p); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  highlightIndex === i ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-lg">🛍</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.brand && (
                      <span className="text-xs text-purple-600 font-medium">{p.brand}</span>
                    )}
                    {p.size && (
                      <span className="text-xs text-gray-400">{p.size}</span>
                    )}
                    {p.upc && (
                      <span className="text-xs text-gray-300" title="UPC — enables exact Instacart matching">
                        #{p.upc.slice(-6)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs text-gray-300 flex-shrink-0">+ Add</span>
              </button>
            ))
          )}

          {/* Free-text fallback at bottom */}
          {query.trim().length > 0 && (
            <button
              onMouseDown={(e) => { e.preventDefault(); addFreeText(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-t border-gray-100 transition-colors ${
                highlightIndex === results.length ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                ✏️
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Add "<span className="font-medium text-gray-800">{query}</span>" as written
                </p>
                <p className="text-xs text-gray-400">No exact product match — Instacart will search by name</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
