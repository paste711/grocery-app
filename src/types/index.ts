export interface GroceryItem {
  id: string;
  name: string;
  /** Full display label, e.g. "Kraft Parmesan Cheese, Shredded, 5 oz" */
  label?: string;
  quantity: number;
  unit?: string;
  category?: string;
  source: 'staple' | 'prompted' | 'recipe' | 'manual' | 'search';
  recipeId?: string;
  checked?: boolean;
  /** UPC barcode — sent to Instacart for precise product matching */
  upc?: string | null;
  /** Thumbnail from product search */
  imageUrl?: string | null;
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
  /** Short 1-2 sentence description, if available from listing page */
  description?: string | null;
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
