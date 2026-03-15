import express from 'express';
import { fetchNYTFeatured, fetchNYTRecipe } from '../scrapers/nyt.js';
import {
  fetchNewDadsKitchenFeatured,
  fetchNewDadsKitchenRecipe,
} from '../scrapers/newdadskitchen.js';
import { parseRecipePage } from '../scrapers/recipeParser.js';

const router = express.Router();

// Simple in-memory cache (TTL: 1 hour)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

function cached(key, fn) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return Promise.resolve(entry.data);
  return fn().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

/**
 * GET /api/recipes/featured
 * Returns recipe cards from all sources.
 */
router.get('/featured', async (_req, res) => {
  try {
    const [nyt, ndk] = await Promise.allSettled([
      cached('nyt-featured', fetchNYTFeatured),
      cached('ndk-featured', fetchNewDadsKitchenFeatured),
    ]);

    res.json({
      nyt: nyt.status === 'fulfilled' ? nyt.value : [],
      newdadskitchen: ndk.status === 'fulfilled' ? ndk.value : [],
      errors: {
        nyt: nyt.status === 'rejected' ? nyt.reason?.message : null,
        newdadskitchen: ndk.status === 'rejected' ? ndk.reason?.message : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/recipes/fetch
 * Body: { url: string }
 * Fetches a single recipe page and returns structured data with ingredients.
 */
router.post('/fetch', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const cacheKey = `recipe:${url}`;
    let data;

    if (url.includes('cooking.nytimes.com')) {
      data = await cached(cacheKey, () => fetchNYTRecipe(url));
    } else if (url.includes('newdadskitchen.com')) {
      data = await cached(cacheKey, () => fetchNewDadsKitchenRecipe(url));
    } else {
      // Generic fallback for any recipe URL
      data = await cached(cacheKey, () => parseRecipePage(url));
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
