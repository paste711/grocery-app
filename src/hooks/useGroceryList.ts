import { useMemo } from 'react';
import type { Staple, PromptedItem, GroceryItem, RecipeDetail } from '../types';

/** Builds the final grocery list from all sources, grouped by category. */
export function useGroceryList(
  staples: Staple[],
  promptedItems: PromptedItem[],
  addedRecipes: RecipeDetail[],
  manualItems: GroceryItem[]
): GroceryItem[] {
  return useMemo(() => {
    const items: GroceryItem[] = [];

    // Staples — all always included
    for (const s of staples) {
      items.push({
        id: `staple-${s.id}`,
        name: s.name,
        quantity: s.quantity,
        unit: s.unit,
        category: s.category,
        source: 'staple',
      });
    }

    // Prompted items the user said they need
    for (const p of promptedItems) {
      if (p.included) {
        items.push({
          id: `prompted-${p.id}`,
          name: p.name,
          quantity: p.quantity,
          unit: p.unit,
          category: p.category,
          source: 'prompted',
        });
      }
    }

    // Recipe ingredients
    for (const recipe of addedRecipes) {
      for (const ing of recipe.ingredients) {
        items.push({
          id: `recipe-${recipe.id}-${ing.name}`,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit || undefined,
          source: 'recipe',
          recipeId: recipe.id,
        });
      }
    }

    // Manual additions
    items.push(...manualItems);

    return items;
  }, [staples, promptedItems, addedRecipes, manualItems]);
}

/** Group a flat list of grocery items by category. */
export function groupByCategory(
  items: GroceryItem[]
): Record<string, GroceryItem[]> {
  const groups: Record<string, GroceryItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}
