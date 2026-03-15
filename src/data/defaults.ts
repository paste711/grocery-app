import type { Staple, PromptedItem } from '../types';

export const DEFAULT_STAPLES: Staple[] = [
  { id: 's-eggs', name: 'Eggs', quantity: 12, unit: 'count', category: 'Dairy & Eggs', alwaysInclude: true },
  { id: 's-milk', name: 'Whole Milk', quantity: 1, unit: 'gallon', category: 'Dairy & Eggs', alwaysInclude: true },
  { id: 's-butter', name: 'Unsalted Butter', quantity: 1, unit: 'lb', category: 'Dairy & Eggs', alwaysInclude: true },
  { id: 's-bread', name: 'Sourdough Bread', quantity: 1, unit: 'loaf', category: 'Bakery', alwaysInclude: true },
  { id: 's-bananas', name: 'Bananas', quantity: 1, unit: 'bunch', category: 'Produce', alwaysInclude: true },
  { id: 's-apples', name: 'Apples', quantity: 4, unit: 'count', category: 'Produce', alwaysInclude: true },
  { id: 's-chicken', name: 'Chicken Breast', quantity: 2, unit: 'lb', category: 'Meat', alwaysInclude: true },
  { id: 's-pasta', name: 'Pasta', quantity: 1, unit: 'lb', category: 'Pantry', alwaysInclude: true },
  { id: 's-olive-oil', name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'Pantry', alwaysInclude: true },
  { id: 's-garlic', name: 'Garlic', quantity: 1, unit: 'head', category: 'Produce', alwaysInclude: true },
  { id: 's-onions', name: 'Yellow Onions', quantity: 3, unit: 'count', category: 'Produce', alwaysInclude: true },
  { id: 's-lemons', name: 'Lemons', quantity: 3, unit: 'count', category: 'Produce', alwaysInclude: true },
];

export const DEFAULT_PROMPTED_ITEMS: PromptedItem[] = [
  { id: 'p-coffee', name: 'Coffee', quantity: 1, unit: 'bag', category: 'Beverages', included: false },
  { id: 'p-yogurt', name: 'Greek Yogurt', quantity: 2, unit: 'container', category: 'Dairy & Eggs', included: false },
  { id: 'p-cheese', name: 'Shredded Cheese', quantity: 1, unit: 'bag', category: 'Dairy & Eggs', included: false },
  { id: 'p-rice', name: 'White Rice', quantity: 1, unit: 'bag', category: 'Pantry', included: false },
  { id: 'p-canned-tomatoes', name: 'Canned Diced Tomatoes', quantity: 2, unit: 'can', category: 'Pantry', included: false },
  { id: 'p-broth', name: 'Chicken Broth', quantity: 2, unit: 'carton', category: 'Pantry', included: false },
  { id: 'p-spinach', name: 'Baby Spinach', quantity: 1, unit: 'bag', category: 'Produce', included: false },
  { id: 'p-salmon', name: 'Salmon Fillet', quantity: 1, unit: 'lb', category: 'Seafood', included: false },
  { id: 'p-ground-beef', name: 'Ground Beef', quantity: 1, unit: 'lb', category: 'Meat', included: false },
  { id: 'p-potatoes', name: 'Potatoes', quantity: 2, unit: 'lb', category: 'Produce', included: false },
  { id: 'p-tp', name: 'Toilet Paper', quantity: 1, unit: 'pack', category: 'Household', included: false },
  { id: 'p-dish-soap', name: 'Dish Soap', quantity: 1, unit: 'bottle', category: 'Household', included: false },
];

export const CATEGORIES = [
  'Produce',
  'Dairy & Eggs',
  'Meat',
  'Seafood',
  'Bakery',
  'Pantry',
  'Beverages',
  'Frozen',
  'Household',
  'Other',
];
