import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch a recipe page and extract structured data.
 * Tries JSON-LD first, then falls back to common HTML patterns.
 */
export async function parseRecipePage(url) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000,
  });
  const $ = cheerio.load(res.data);

  // Try all JSON-LD blocks on the page
  const jsonLdBlocks = $('script[type="application/ld+json"]').toArray();
  for (const el of jsonLdBlocks) {
    try {
      const raw = JSON.parse($(el).html() || '{}');
      const schemas = Array.isArray(raw) ? raw : [raw];
      for (const schema of schemas) {
        const type = schema['@type'];
        const isRecipe =
          type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
        if (isRecipe) {
          return extractFromSchema(schema, url);
        }
        // Sometimes wrapped in @graph
        if (schema['@graph']) {
          for (const node of schema['@graph']) {
            const nodeType = node['@type'];
            if (
              nodeType === 'Recipe' ||
              (Array.isArray(nodeType) && nodeType.includes('Recipe'))
            ) {
              return extractFromSchema(node, url);
            }
          }
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  // Fallback: grab title + first image
  const title = $('h1').first().text().trim() || $('title').text().trim();
  const imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('img').first().attr('src') ||
    null;

  return { title, url, imageUrl, ingredients: [] };
}

function extractFromSchema(schema, url) {
  const imageRaw = schema.image;
  let imageUrl = null;
  if (typeof imageRaw === 'string') imageUrl = imageRaw;
  else if (Array.isArray(imageRaw)) imageUrl = imageRaw[0]?.url || imageRaw[0];
  else if (imageRaw?.url) imageUrl = imageRaw.url;

  const rawIngredients = schema.recipeIngredient || [];

  return {
    title: schema.name || 'Untitled Recipe',
    url,
    imageUrl,
    description: schema.description || null,
    ingredients: rawIngredients.map((text) => parseIngredientText(text)),
  };
}

/**
 * Best-effort parse of an ingredient string like "2 cups all-purpose flour"
 * into { quantity, unit, name }.
 */
export function parseIngredientText(text) {
  text = text.trim();
  // Match optional leading number/fraction, optional unit word
  const match = text.match(
    /^([\d¼½¾⅓⅔⅛⅜⅝⅞/. -]+)?\s*([a-zA-Z]+\.?)?\s+(.+)$/
  );
  if (match) {
    return {
      raw: text,
      quantity: normalizeQuantity(match[1]),
      unit: match[2] || null,
      name: match[3]?.trim() || text,
    };
  }
  return { raw: text, quantity: 1, unit: null, name: text };
}

function normalizeQuantity(str) {
  if (!str) return 1;
  str = str
    .trim()
    .replace('¼', '0.25')
    .replace('½', '0.5')
    .replace('¾', '0.75')
    .replace('⅓', '0.33')
    .replace('⅔', '0.67')
    .replace('⅛', '0.125');
  const num = parseFloat(str);
  return isNaN(num) ? 1 : num;
}
