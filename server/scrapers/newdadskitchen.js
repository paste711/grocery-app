import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseRecipePage } from './recipeParser.js';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const BASE = 'https://newdadskitchen.com';

/**
 * Fetch recent recipe cards from newdadskitchen.com.
 */
export async function fetchNewDadsKitchenFeatured() {
  // Try /recipes/ index page first, fall back to homepage
  const urls = [`${BASE}/recipes/`, `${BASE}/`];
  let $;

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 12000,
      });
      $ = cheerio.load(res.data);
      break;
    } catch {
      // try next
    }
  }

  if (!$) return [];

  const recipes = [];

  // Generic recipe card selectors that work on most WordPress recipe sites
  const cardSelectors = [
    'article',
    '.recipe-card',
    '.post',
    '.entry',
    '[class*="recipe"]',
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const link = $(el)
        .find(`a[href*="${BASE}/recipe"], a[href*="${BASE}/"]:not([href="${BASE}/"])`)
        .first();
      const href = link.attr('href');
      if (!href || !href.startsWith(BASE)) return;
      if (recipes.some((r) => r.url === href)) return;

      const title =
        $(el).find('h1, h2, h3, h4, [class*="title"]').first().text().trim() ||
        link.text().trim();
      const img = $(el).find('img').first();
      const imageUrl =
        img.attr('src') ||
        img.attr('data-src') ||
        img.attr('data-lazy-src') ||
        null;

      if (title && title.length > 3) {
        recipes.push({
          id: slugify(href),
          title,
          url: href,
          imageUrl,
          source: 'newdadskitchen',
        });
      }
    });
    if (recipes.length > 0) break;
  }

  // If nothing found with cards, grab all internal recipe links
  if (recipes.length === 0) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!href.startsWith(BASE) || href === BASE + '/') return;
      if (!/\/[a-z0-9-]+\/?$/.test(href)) return;
      if (recipes.some((r) => r.url === href)) return;

      const title = $(el).text().trim();
      if (title.length > 5) {
        recipes.push({
          id: slugify(href),
          title,
          url: href,
          imageUrl: null,
          source: 'newdadskitchen',
        });
      }
    });
  }

  return recipes.slice(0, 12);
}

/**
 * Fetch full recipe data including ingredients for a single URL.
 */
export async function fetchNewDadsKitchenRecipe(url) {
  const data = await parseRecipePage(url);
  return { ...data, source: 'newdadskitchen', id: slugify(url) };
}

function slugify(url) {
  return url.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
