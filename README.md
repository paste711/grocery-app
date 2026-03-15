# Weekly Grocery Planner

A full-stack app to streamline weekly grocery orders — builds your list from weekly staples, prompted items, and meal suggestions from NYT Cooking and New Dad's Kitchen, then sends the whole cart to Instacart in one click.

## Features

- **Weekly Staples** — fixed items that always appear in every cart (eggs, milk, bread, etc.)
- **Prompted Items** — a checklist of items you often need; check what you're running low on each week
- **Meal Suggestions** — browse recipes from NYT Cooking and [newdadskitchen.com](https://newdadskitchen.com), or paste any recipe URL to extract ingredients automatically
- **Grocery List** — auto-built from all sources, grouped by category, with quick-add for one-off items
- **Instacart Integration** — one-click cart creation via the Instacart Connect API; opens a pre-filled Instacart cart in your browser

## Setup

```bash
cp .env.example .env
# Add your INSTACART_API_KEY to .env
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Getting an Instacart Connect API Key

Sign up as an Instacart Connect partner at https://www.instacart.com/partner to receive your API key. Add it to your `.env`:

```
INSTACART_API_KEY=your_key_here
```

## Architecture

```
grocery-app/
├── server/               # Express backend
│   ├── index.js          # Server entry point
│   ├── routes/
│   │   ├── recipes.js    # /api/recipes/* — scraping + caching
│   │   └── instacart.js  # /api/instacart/create-cart
│   └── scrapers/
│       ├── recipeParser.js   # Generic JSON-LD + HTML recipe parser
│       ├── nyt.js            # NYT Cooking scraper
│       └── newdadskitchen.js # newdadskitchen.com scraper
└── src/                  # React frontend (Vite + TypeScript + Tailwind)
    ├── App.tsx
    ├── components/
    │   ├── StaplesList.tsx
    │   ├── PromptedItems.tsx
    │   ├── MealSuggestions.tsx
    │   └── GroceryList.tsx
    ├── hooks/
    │   ├── useGroceryList.ts
    │   └── useLocalStorage.ts
    └── data/defaults.ts  # Default staples + prompted items
```

## Production Build

```bash
npm run build
NODE_ENV=production npm start
```
