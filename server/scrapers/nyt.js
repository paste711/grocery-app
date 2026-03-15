import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseRecipePage } from './recipeParser.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const NYT_BASE = 'https://cooking.nytimes.com';

/**
 * Fetch a list of featured recipe previews from NYT Cooking.
 * Returns basic card info (title, url, image). Ingredients are
 * fetched on-demand when the user adds a recipe to their list.
 */
export async function fetchNYTFeatured() {
  const res = await axios.get(`${NYT_BASE}/topics/weeknight`, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html',
    },
    timeout: 12000,
  });

  const $ = cheerio.load(res.data);
  const recipes = [];

  // NYT Cooking renders cards with these selectors (may change with site updates)
  $('article, [data-testid="recipe-card"], .card').each((_, el) => {
    const link = $(el).find('a[href^="/recipes/"]').first();
    const href = link.attr('href');
    if (!href) return;

    const url = `${NYT_BASE}${href}`;
    if (recipes.some((r) => r.url === url)) return; // dedupe

    const title =
      $(el).find('h3, h2, [class*="title"]').first().text().trim() ||
      link.text().trim();
    const imageEl = $(el).find('img').first();
    const imageUrl =
      imageEl.attr('src') || imageEl.attr('data-src') || null;
    const description =
      $(el).find('[class*="description"], [class*="summary"], [class*="byline"], p').first().text().trim() || null;

    if (title) {
      recipes.push({ id: slugify(url), title, url, imageUrl, description, source: 'nyt' });
    }
  });

  // Fallback: grab any recipe links if the card approach yielded nothing
  if (recipes.length === 0) {
    $('a[href^="/recipes/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const url = `${NYT_BASE}${href}`;
      if (recipes.some((r) => r.url === url)) return;
      const title = $(el).text().trim();
      if (title.length > 5) {
        recipes.push({ id: slugify(url), title, url, imageUrl: null, source: 'nyt' });
      }
    });
  }

  return recipes.slice(0, 12);
}

/**
 * Fetch full recipe data including ingredients for a single NYT recipe URL.
 */
export async function fetchNYTRecipe(url) {
  const data = await parseRecipePage(url);
  return { ...data, source: 'nyt', id: slugify(url) };
}

function slugify(url) {
  return url.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
