import { useState } from 'react';
import type { Staple, PromptedItem, GroceryItem, RecipeDetail } from './types';
import { DEFAULT_STAPLES, DEFAULT_PROMPTED_ITEMS } from './data/defaults';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useGroceryList } from './hooks/useGroceryList';
import { StaplesList } from './components/StaplesList';
import { PromptedItems } from './components/PromptedItems';
import { MealSuggestions } from './components/MealSuggestions';
import { GroceryList } from './components/GroceryList';

type Tab = 'staples' | 'meals' | 'list';

export default function App() {
  const [staples, setStaples] = useLocalStorage<Staple[]>('staples', DEFAULT_STAPLES);
  const [promptedItems, setPromptedItems] = useLocalStorage<PromptedItem[]>(
    'prompted-items',
    DEFAULT_PROMPTED_ITEMS
  );
  const [addedRecipes, setAddedRecipes] = useLocalStorage<RecipeDetail[]>('added-recipes', []);
  const [manualItems, setManualItems] = useLocalStorage<GroceryItem[]>('manual-items', []);

  const [activeTab, setActiveTab] = useState<Tab>('staples');
  const [instacartLoading, setInstacartLoading] = useState(false);
  const [instacartError, setInstacartError] = useState<string | null>(null);

  const groceryList = useGroceryList(staples, promptedItems, addedRecipes, manualItems);

  function addRecipe(recipe: RecipeDetail) {
    setAddedRecipes((prev) => {
      if (prev.some((r) => r.id === recipe.id)) return prev;
      return [...prev, recipe];
    });
  }

  function removeRecipe(id: string) {
    setAddedRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  function addManualItem(item: GroceryItem) {
    setManualItems((prev) => [...prev, item]);
  }

  function removeManualItem(id: string) {
    setManualItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function sendToInstacart() {
    setInstacartLoading(true);
    setInstacartError(null);
    try {
      const res = await fetch('/api/instacart/create-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Weekly Groceries',
          items: groceryList.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Open the Instacart cart link in a new tab
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setInstacartError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setInstacartLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; emoji: string; badge?: number }[] = [
    { id: 'staples', label: 'Staples', emoji: '🛒' },
    { id: 'meals', label: 'Meals', emoji: '🍽', badge: addedRecipes.length || undefined },
    { id: 'list', label: 'List', emoji: '📋', badge: groceryList.length || undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Weekly Grocery Planner</h1>
              <p className="text-xs text-gray-400">Build your list → Send to Instacart</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{groceryList.length}</span> items ready
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="flex border-t border-gray-100 md:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-700'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.emoji} {tab.label}
              {tab.badge !== undefined && (
                <span className="bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 text-xs leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Desktop: 3-column layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
            <StaplesList staples={staples} onChange={setStaples} />
            <hr className="border-gray-100" />
            <PromptedItems items={promptedItems} onChange={setPromptedItems} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <MealSuggestions
              addedRecipes={addedRecipes}
              onAdd={addRecipe}
              onRemove={removeRecipe}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col" style={{ minHeight: '70vh' }}>
            <GroceryList
              items={groceryList}
              manualItems={manualItems}
              onAddManual={addManualItem}
              onRemoveManual={removeManualItem}
              onSendToInstacart={sendToInstacart}
              instacartLoading={instacartLoading}
              instacartError={instacartError}
            />
          </div>
        </div>

        {/* Mobile: tab panels */}
        <div className="md:hidden">
          {activeTab === 'staples' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
              <StaplesList staples={staples} onChange={setStaples} />
              <hr className="border-gray-100" />
              <PromptedItems items={promptedItems} onChange={setPromptedItems} />
            </div>
          )}
          {activeTab === 'meals' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <MealSuggestions
                addedRecipes={addedRecipes}
                onAdd={addRecipe}
                onRemove={removeRecipe}
              />
            </div>
          )}
          {activeTab === 'list' && (
            <div
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col"
              style={{ minHeight: '70vh' }}
            >
              <GroceryList
                items={groceryList}
                manualItems={manualItems}
                onAddManual={addManualItem}
                onRemoveManual={removeManualItem}
                onSendToInstacart={sendToInstacart}
                instacartLoading={instacartLoading}
                instacartError={instacartError}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
