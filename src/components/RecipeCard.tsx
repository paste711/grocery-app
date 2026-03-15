import type { RecipeDetail, RecipeCard as RecipeCardType } from '../types';

/**
 * A browse card (before full recipe is loaded).
 * Checking the box triggers a full fetch + add.
 */
interface BrowseCardProps {
  card: RecipeCardType;
  isAdded: boolean;
  isLoading: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

export function BrowseRecipeCard({
  card,
  isAdded,
  isLoading,
  onAdd,
  onRemove,
}: BrowseCardProps) {
  return (
    <label
      className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${
        isAdded
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
      }`}
    >
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={isAdded}
          disabled={isLoading}
          onChange={isAdded ? onRemove : onAdd}
          className="w-4 h-4 accent-blue-600 disabled:opacity-50"
        />
      </div>

      {/* Thumbnail */}
      {card.imageUrl && (
        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={card.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${isAdded ? 'text-blue-800' : 'text-gray-800'}`}>
          {card.title}
        </p>
        {card.description ? (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{card.description}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5 italic">
            {isLoading ? 'Loading ingredients…' : 'Check to add all ingredients'}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">{sourceLabel(card.source)}</span>
          {isAdded && (
            <span className="text-xs text-blue-600 font-medium">✓ Added to list</span>
          )}
          {isLoading && (
            <span className="text-xs text-blue-500">Fetching…</span>
          )}
        </div>
      </div>
    </label>
  );
}

/**
 * A card for a recipe that's already been fully loaded and added to the week.
 * Shows ingredient count and a remove button.
 */
interface AddedCardProps {
  recipe: RecipeDetail;
  onRemove: () => void;
}

export function AddedRecipeCard({ recipe, onRemove }: AddedCardProps) {
  return (
    <label className="flex gap-3 p-3 rounded-xl border bg-blue-50 border-blue-300 cursor-pointer">
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={true}
          onChange={onRemove}
          className="w-4 h-4 accent-blue-600"
        />
      </div>

      {recipe.imageUrl && (
        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={recipe.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-800 leading-tight">{recipe.title}</p>
        {recipe.description && (
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{recipe.description}</p>
        )}
        <p className="text-xs text-blue-600 font-medium mt-1">
          ✓ {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''} added
          {recipe.url && (
            <>
              {' · '}
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                onClick={(e) => e.stopPropagation()}
              >
                View recipe
              </a>
            </>
          )}
        </p>
      </div>
    </label>
  );
}

function sourceLabel(src: string) {
  if (src === 'nyt') return 'NYT Cooking';
  if (src === 'newdadskitchen') return "New Dad's Kitchen";
  return '';
}
