import { useState, useEffect } from 'react';
import type { RecipeCard, RecipeDetail } from '../types';
import { RecipeImport } from './RecipeImport';
import { BrowseRecipeCard, AddedRecipeCard } from './RecipeCard';

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

type BrowseSource = 'nyt' | 'newdadskitchen';

export function MealSuggestions({ addedRecipes, onAdd, onRemove }: Props) {
  const [featured, setFeatured] = useState<FeaturedData | null>(null);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const [browseSource, setBrowseSource] = useState<BrowseSource>('nyt');
  const [showBrowse, setShowBrowse] = useState(false);

  const addedIds = new Set(addedRecipes.map((r) => r.id));

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    setLoadingFeatured(true);
    try {
      const res = await fetch('/api/recipes/featured');
      if (res.ok) setFeatured(await res.json());
    } finally {
      setLoadingFeatured(false);
    }
  }

  async function fetchAndAdd(card: RecipeCard) {
    if (addedIds.has(card.id)) { onRemove(card.id); return; }
    setLoadingRecipeId(card.id);
    try {
      const res = await fetch('/api/recipes/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: card.url }),
      });
      const detail: RecipeDetail = await res.json();
      onAdd({
        ...detail,
        id: card.id,
        source: card.source,
        imageUrl: card.imageUrl ?? detail.imageUrl,
        description: detail.description ?? card.description,
      });
    } catch (e) {
      alert(`Failed to load recipe: ${e instanceof Error ? e.message : e}`);
    } finally {
      setLoadingRecipeId(null);
    }
  }

  const browseCards = featured?.[browseSource] ?? [];
  const browseError = featured?.errors[browseSource];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-blue-700 flex items-center gap-2">
          <span>🍽</span> Recipes This Week
          {addedRecipes.length > 0 && (
            <span className="text-xs font-normal bg-blue-100 text-blue-600 rounded-full px-2 py-0.5">
              {addedRecipes.length} meal{addedRecipes.length !== 1 ? 's' : ''}
            </span>
          )}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Check a recipe to add all its ingredients to your list.
        </p>
      </div>

      {/* Added recipes — always visible at top */}
      {addedRecipes.length > 0 && (
        <div className="space-y-2">
          {addedRecipes.map((r) => (
            <AddedRecipeCard key={r.id} recipe={r} onRemove={() => onRemove(r.id)} />
          ))}
        </div>
      )}

      {/* Import a recipe */}
      <div className="border border-dashed border-blue-200 rounded-xl p-3 bg-blue-50/40">
        <RecipeImport onImport={onAdd} />
      </div>

      {/* Browse scraped suggestions */}
      <div>
        <button
          onClick={() => { setShowBrowse((s) => !s); if (!showBrowse) loadFeatured(); }}
          className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 font-medium py-1"
        >
          <span>Browse suggested recipes</span>
          <span className="text-gray-400">{showBrowse ? '▲' : '▼'}</span>
        </button>

        {showBrowse && (
          <div className="mt-3 space-y-3">
            {/* Source toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
              {(['nyt', 'newdadskitchen'] as BrowseSource[]).map((src) => (
                <button
                  key={src}
                  onClick={() => setBrowseSource(src)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    browseSource === src
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {src === 'nyt' ? 'NYT Cooking' : "New Dad's Kitchen"}
                </button>
              ))}
              <button
                onClick={loadFeatured}
                disabled={loadingFeatured}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white disabled:opacity-50"
                title="Refresh"
              >
                {loadingFeatured ? '…' : '↻'}
              </button>
            </div>

            {browseError && (
              <p className="text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2">
                Could not load recipes: {browseError}
              </p>
            )}

            {loadingFeatured ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : browseCards.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No recipes loaded. Try refreshing.
              </p>
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto pr-1">
                {browseCards.map((card) => (
                  <BrowseRecipeCard
                    key={card.id}
                    card={card}
                    isAdded={addedIds.has(card.id)}
                    isLoading={loadingRecipeId === card.id}
                    onAdd={() => fetchAndAdd(card)}
                    onRemove={() => onRemove(card.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
