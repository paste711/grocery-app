import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not configured. Add it to your .env file. ' +
        'Get a key at https://console.anthropic.com'
    );
  }
  return new Anthropic({ apiKey });
}

const EXTRACTION_PROMPT = `You are a recipe parser. Extract the recipe from the provided content and return ONLY a JSON object with this exact shape:

{
  "title": "Recipe name",
  "description": "One-line description or null",
  "ingredients": [
    { "raw": "original text", "quantity": 1, "unit": "cup", "name": "flour" }
  ]
}

Rules:
- quantity must be a number (use 1 if unknown)
- unit can be null if not specified
- name should be just the ingredient name, without quantity/unit
- If the content is not a recipe, return { "title": null, "description": null, "ingredients": [] }
- Return ONLY the JSON, no markdown, no explanation`;

/**
 * POST /api/extract/image
 * Body: { image: string (base64), mimeType: "image/jpeg"|"image/png"|... }
 * Returns extracted recipe data.
 */
router.post('/image', async (req, res) => {
  const { image, mimeType = 'image/jpeg' } = req.body;
  if (!image) return res.status(400).json({ error: 'image (base64) is required' });

  let client;
  try {
    client = getClient();
  } catch (e) {
    return res.status(503).json({ error: e.message });
  }

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: image,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const recipe = JSON.parse(raw.trim());
    res.json({ ...recipe, source: 'screenshot', id: `screenshot-${Date.now()}` });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * POST /api/extract/text
 * Body: { text: string }
 * Returns extracted recipe data.
 */
router.post('/text', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length < 5) {
    return res.status(400).json({ error: 'text is required' });
  }

  let client;
  try {
    client = getClient();
  } catch (e) {
    return res.status(503).json({ error: e.message });
  }

  try {
    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nRecipe content:\n${text}`,
        },
      ],
    });

    const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : '';
    const recipe = JSON.parse(raw.trim());
    res.json({ ...recipe, source: 'manual', id: `manual-${Date.now()}` });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
