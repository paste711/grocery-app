import express from 'express';
import axios from 'axios';

const router = express.Router();

// Simple in-process cache, TTL 10 min
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;
function cacheGet(key) { const e = cache.get(key); return e && Date.now() - e.ts < CACHE_TTL ? e.data : null; }
function cacheSet(key, data) { cache.set(key, { data, ts: Date.now() }); }

/**
 * GET /api/search/products?q=parmesan+cheese&limit=15
 *
 * Searches for branded grocery products.
 *
 * Primary:   USDA FoodData Central (free gov API, ~1000 req/hr with DEMO_KEY)
 *            Returns real branded items with description, brand, package weight.
 * Fallback:  Open Food Facts (free, no key required, may be rate-limited)
 *
 * When an FOODDATA_API_KEY env var is set, it's used instead of DEMO_KEY
 * for higher rate limits. Get a free key at https://fdc.nal.usda.gov/api-guide.html
 */
router.get('/products', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'q must be at least 2 characters' });
  }
  const limit = Math.min(parseInt(req.query.limit) || 15, 25);
  const cacheKey = `search:${query}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  // Try USDA first
  try {
    const products = await searchUSDA(query, limit);
    if (products.length > 0) {
      const result = { products };
      cacheSet(cacheKey, result);
      return res.json(result);
    }
  } catch (err) {
    console.warn('[search] USDA error:', err.message);
  }

  // Fallback: Open Food Facts
  try {
    const products = await searchOpenFoodFacts(query, limit);
    const result = { products };
    cacheSet(cacheKey, result);
    return res.json(result);
  } catch (err) {
    console.error('[search] Open Food Facts fallback error:', err.message);
    return res.status(502).json({ error: 'Product search temporarily unavailable', products: [] });
  }
});

// ── USDA FoodData Central ──────────────────────────────────────────────
async function searchUSDA(query, limit) {
  const apiKey = process.env.FOODDATA_API_KEY || 'DEMO_KEY';
  const response = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
    params: {
      query,
      api_key: apiKey,
      dataType: 'Branded',   // Real branded grocery products
      pageSize: limit * 2,   // fetch extra to filter empties
      sortBy: 'dataType.keyword',
      sortOrder: 'asc',
    },
    timeout: 8000,
  });

  const foods = response.data?.foods ?? [];
  return foods
    .filter((f) => f.description && f.brandOwner)
    .map((f) => ({
      id: String(f.fdcId),
      upc: f.gtinUpc || null,
      name: titleCase(f.description),
      brand: f.brandOwner ? cleanBrand(f.brandOwner) : null,
      size: f.packageWeight || f.servingSize
        ? formatSize(f.packageWeight, f.servingSize, f.servingSizeUnit)
        : null,
      imageUrl: null, // USDA doesn't provide images
      category: f.foodCategory || null,
    }))
    .filter((p) => p.name.length > 1)
    .slice(0, limit);
}

function formatSize(packageWeight, servingSize, unit) {
  if (packageWeight) return packageWeight;
  if (servingSize && unit) return `${servingSize} ${unit}`;
  return null;
}

function cleanBrand(brand) {
  // USDA often has "BRAND LLC" or "BRAND, INC." — clean up
  return brand
    .replace(/,?\s+(LLC|INC\.?|CORP\.?|CO\.?|LTD\.?)$/i, '')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function titleCase(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Open Food Facts (fallback) ─────────────────────────────────────────
async function searchOpenFoodFacts(query, limit) {
  const response = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
    params: {
      search_terms: query,
      json: 1,
      page_size: limit * 2,
      sort_by: 'popularity_key',
      tagtype_0: 'countries',
      tag_contains_0: 'contains',
      tag_0: 'united-states',
    },
    headers: {
      'User-Agent': 'GroceryPlannerApp/1.0 (https://github.com/grocery-app; hello@example.com)',
      'Accept': 'application/json',
    },
    timeout: 10000,
  });

  const raw = response.data?.products ?? [];
  return raw
    .filter((p) => p.product_name?.trim())
    .map((p) => ({
      id: p.code || p._id || String(Math.random()),
      upc: p.code || null,
      name: p.product_name_en || p.product_name || '',
      brand: p.brands ? p.brands.split(',')[0].trim() : null,
      size: p.quantity || null,
      imageUrl: p.image_front_small_url || null,
      category: extractCategory(p.categories_tags),
    }))
    .filter((p) => p.name.length > 1)
    .sort((a, b) => {
      const score = (x) => (x.brand ? 2 : 0) + (x.size ? 1 : 0) + (x.upc ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit);
}

function extractCategory(tags) {
  if (!Array.isArray(tags)) return null;
  for (const t of tags) {
    const label = t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ');
    if (label.length > 3 && label.length < 40 && !label.includes(':')) {
      return label.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  return null;
}

export default router;
