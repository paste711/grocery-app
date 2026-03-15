import { useState } from 'react';
import type { Staple, PromptedItem, GroceryItem, RecipeDetail } from './types';
import { DEFAULT_STAPLES, DEFAULT_PROMPTED_ITEMS } from './data/defaults';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useGroceryList } from './hooks/useGroceryList';
import { StaplesList } from './components/StaplesList';
import { UsualsList } from './components/UsualsList';
import { WhatElse } from './components/WhatElse';
import { MealSuggestions } from './components/MealSuggestions';
import { GroceryList } from './components/GroceryList';

type Tab = 'build' | 'meals' | 'list';

export default function App() {
  const [staples, setStaples] = useLocalStorage<Staple[]>('staples', DEFAULT_STAPLES);
  const [promptedItems, setPromptedItems] = useLocalStorage<PromptedItem[]>(
    'prompted-items',
    DEFAULT_PROMPTED_ITEMS
  );
  const [searchItems, setSearchItems] = useLocalStorage<GroceryItem[]>('search-items', []);
  const [addedRecipes, setAddedRecipes] = useLocalStorage<RecipeDetail[]>('added-recipes', []);
  const [manualItems, setManualItems] = useLocalStorage<GroceryItem[]>('manual-items', []);

  const [activeTab, setActiveTab] = useState<Tab>('build');
  const [instacartLoading, setInstacartLoading] = useState(false);
  const [instacartError, setInstacartError] = useState<string | null>(null);

  const groceryList = useGroceryList(staples, promptedItems, searchItems, addedRecipes, manualItems);

  function addRecipe(recipe: RecipeDetail) {
    setAddedRecipes((prev) => {
      if (prev.some((r) => r.id === recipe.id)) return prev;
      return [...prev, recipe];
    });
  }

  function removeRecipe(id: string) {
    setAddedRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  function addSearchItem(item: GroceryItem) {
    setSearchItems((prev) => [...prev, item]);
  }

  function removeSearchItem(id: string) {
    setSearchItems((prev) => prev.filter((i) => i.id !== id));
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
            upc: i.upc ?? undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setInstacartError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setInstacartLoading(false);
    }
  }

  // ── Mobile tab config ──────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; emoji: string; badge?: number }[] = [
    { id: 'build', label: 'Build', emoji: '🛒' },
    { id: 'meals', label: 'Recipes', emoji: '🍽', badge: addedRecipes.length || undefined },
    { id: 'list', label: 'Cart', emoji: '📋', badge: groceryList.length || undefined },
  ];

  // ── Shared panels ──────────────────────────────────────────────────────
  const BuildPanel = (
    <div className="space-y-5">
      {/* 1. Staples */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <StaplesList staples={staples} onChange={setStaples} />
      </section>

      {/* 2. Usuals */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <UsualsList items={promptedItems} onChange={setPromptedItems} />
      </section>

      {/* 3. What else */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <WhatElse
          items={searchItems}
          onAdd={addSearchItem}
          onRemove={removeSearchItem}
        />
      </section>
    </div>
  );

  const RecipesPanel = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <MealSuggestions
        addedRecipes={addedRecipes}
        onAdd={addRecipe}
        onRemove={removeRecipe}
      />
    </div>
  );

  const CartPanel = (
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥦</span>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Weekly Grocery Planner</h1>
              <p className="text-xs text-gray-400">Staples · Usuals · What Else · Recipes → Instacart</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{groceryList.length}</span> items
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
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Desktop: 3-column — Build (sections 1-3) | Recipes (section 4) | Cart */}
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_320px] gap-5 items-start">
          <div>{BuildPanel}</div>
          <div>{RecipesPanel}</div>
          <div>{CartPanel}</div>
        </div>

        {/* Mobile: tab panels */}
        <div className="md:hidden">
          {activeTab === 'build' && BuildPanel}
          {activeTab === 'meals' && RecipesPanel}
          {activeTab === 'list' && CartPanel}
        </div>
      </main>
    </div>
  );
}
