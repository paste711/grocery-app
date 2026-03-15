import express from 'express';
import axios from 'axios';

const router = express.Router();

const INSTACART_API_BASE = 'https://connect.instacart.com';

/**
 * POST /api/instacart/create-cart
 * Body: { title: string, items: Array<{ name, quantity, unit? }> }
 *
 * Calls the Instacart Connect API to create a shoppable cart link.
 * Returns { url } — the Instacart link users can click to fill their cart.
 */
router.post('/create-cart', async (req, res) => {
  const apiKey = process.env.INSTACART_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error:
        'INSTACART_API_KEY not configured. Add it to your .env file. ' +
        'Get a key at https://www.instacart.com/partner',
    });
  }

  const { title = 'Weekly Groceries', items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must be a non-empty array' });
  }

  const lineItems = items.map((item) => ({
    name: item.name,
    quantity: item.quantity || 1,
    unit: item.unit || 'each',
  }));

  try {
    const response = await axios.post(
      `${INSTACART_API_BASE}/idp/v1/products/products_link`,
      {
        title,
        link_type: 'shoppable',
        line_items: lineItems,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );

    // The API returns { products_link_url: "https://..." }
    const cartUrl =
      response.data?.products_link_url ||
      response.data?.url ||
      response.data?.link;

    if (!cartUrl) {
      return res.status(502).json({
        error: 'Instacart returned no cart URL',
        raw: response.data,
      });
    }

    res.json({ url: cartUrl });
  } catch (err) {
    const status = err.response?.status || 500;
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message;
    res.status(status).json({ error: message, details: err.response?.data });
  }
});

export default router;
