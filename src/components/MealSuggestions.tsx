import { useState, useEffect } from 'react';
import type { RecipeCard, RecipeDetail } from '../types';
import { RecipeImport } from './RecipeImport';

interface Props {
  addedRecipes: RecipeDetail[];
  onAdd: (recipe: RecipeDetail) => void;
  onRemove: (recipeId: string) => void;
}

type FeaturedData = {
  nyt: RecipeCard[];
  newdadskitchen: RecipeCard[];
  errors: { nyt: string | null; newdadskitchen: string | null };
};

export function MealSuggestions({ addedRecipes, onAdd, onRemove }: Props) {
  const [featured, setFeatured] = useState<FeaturedData | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<'nyt' | 'newdadskitchen' | 'import'>('import');

  const addedIds = new Set(addedRecipes.map((r) => r.id));

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    setLoadingFeatured(true);
    setError(null);
    try {
      const res = await fetch('/api/recipes/featured');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FeaturedData = await res.json();
      setFeatured(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recipes');
    } finally {
      setLoadingFeatured(false);
    }
  }

  async function fetchAndAdd(card: RecipeCard) {
    setLoadingRecipeId(card.id);
    try {
      const res = await fetch('/api/recipes/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: card.url }),
      });
      const detail: RecipeDetail = await res.json();
      onAdd({ ...detail, id: card.id, source: card.source, imageUrl: card.imageUrl ?? detail.imageUrl });
    } catch (e) {
      alert(`Failed to load recipe: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoadingRecipeId(null);
    }
  }

  const cards =
    activeSource === 'nyt'
      ? featured?.nyt ?? []
      : activeSource === 'newdadskitchen'
      ? featured?.newdadskitchen ?? []
      : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
          <span>🍽</span> Meal Suggestions
        </h2>
        <button
          onClick={loadFeatured}
          disabled={loadingFeatured}
          className="text-sm text-blue-500 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {loadingFeatured ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Added recipes */}
      {addedRecipes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            This week's meals
          </p>
          {addedRecipes.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-500">🍴</span>
                <div>
                  <p className="font-medium text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-400">
                    {r.ingredients.length} ingredients · {sourceLabel(r.source)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemove(r.id)}
                className="text-red-400 hover:text-red-600 text-xs font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Source tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['import', 'nyt', 'newdadskitchen'] as const).map((src) => (
          <button
            key={src}
            onClick={() => setActiveSource(src)}
            className={`px-3 py-1.5 text-sm font-medium rounded-t border-b-2 transition-colors ${
              activeSource === src
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {sourceLabel(src)}
          </button>
        ))}
      </div>

      {/* Import panel (URL / screenshot / text) */}
      {activeSource === 'import' && (
        <RecipeImport onImport={onAdd} />
      )}

      {/* Error states for scraped sources */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>
      )}
      {activeSource !== 'import' && featured?.errors[activeSource as 'nyt' | 'newdadskitchen'] && (
        <p className="text-sm text-yellow-700 bg-yellow-50 rounded p-2">
          Could not load {sourceLabel(activeSource)} recipes:{' '}
          {featured.errors[activeSource as 'nyt' | 'newdadskitchen']}
        </p>
      )}

      {/* Recipe cards grid */}
      {activeSource !== 'import' && (
        <>
          {loadingFeatured ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {cards.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400 text-center py-4">
                  No recipes loaded. Try refreshing.
                </p>
              )}
              {cards.map((card) => {
                const isAdded = addedIds.has(card.id);
                const isLoading = loadingRecipeId === card.id;
                return (
                  <RecipeCardUI
                    key={card.id}
                    card={card}
                    isAdded={isAdded}
                    isLoading={isLoading}
                    onAdd={() => fetchAndAdd(card)}
                    onRemove={() => onRemove(card.id)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecipeCardUI({
  card,
  isAdded,
  isLoading,
  onAdd,
  onRemove,
}: {
  card: RecipeCard;
  isAdded: boolean;
  isLoading: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden border transition-all ${
        isAdded ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-200'
      }`}
    >
      {/* Image */}
      <div className="h-20 bg-gray-100 overflow-hidden">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🍳
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight">
          {card.title}
        </p>
      </div>

      <button
        onClick={isAdded ? onRemove : onAdd}
        disabled={isLoading}
        className={`absolute bottom-2 right-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors ${
          isAdded
            ? 'bg-blue-500 text-white hover:bg-red-400'
            : 'bg-gray-200 text-gray-600 hover:bg-blue-500 hover:text-white'
        } disabled:opacity-50`}
        title={isAdded ? 'Remove from meals' : 'Add to meals'}
      >
        {isLoading ? '…' : isAdded ? '✓' : '+'}
      </button>
    </div>
  );
}

function sourceLabel(src: string) {
  if (src === 'import') return '➕ Import';
  if (src === 'nyt') return 'NYT Cooking';
  if (src === 'newdadskitchen') return "New Dad's Kitchen";
  return src;
}
