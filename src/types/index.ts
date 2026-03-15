export interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  source: 'staple' | 'prompted' | 'recipe' | 'manual';
  recipeId?: string;
  checked?: boolean;
}

export interface Staple {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  /** Always in cart every week, no prompting needed */
  alwaysInclude: boolean;
}

/** A staple that needs weekly confirmation (e.g. "Do you need more milk?") */
export interface PromptedItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: string;
  /** Whether user checked "yes, I need this" for this week */
  included: boolean;
}

export interface RecipeIngredient {
  raw: string;
  name: string;
  quantity: number;
  unit: string | null;
}

export interface RecipeCard {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  source: 'nyt' | 'newdadskitchen';
  description?: string;
}

export interface RecipeDetail extends RecipeCard {
  ingredients: RecipeIngredient[];
}

export interface WeeklyPlan {
  /** ISO week string, e.g. "2024-W48" */
  week: string;
  addedRecipeIds: string[];
  promptedItems: Record<string, boolean>;
  manualItems: GroceryItem[];
}
