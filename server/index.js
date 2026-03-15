import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import recipesRouter from './routes/recipes.js';
import instacartRouter from './routes/instacart.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/recipes', recipesRouter);
app.use('/api/instacart', instacartRouter);

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) =>
    res.sendFile(join(distPath, 'index.html'))
  );
}

app.listen(PORT, () => {
  console.log(`Grocery server running on http://localhost:${PORT}`);
  if (!process.env.INSTACART_API_KEY) {
    console.warn(
      '[warn] INSTACART_API_KEY not set — Instacart cart creation will return an error. ' +
        'Add it to .env to enable cart creation.'
    );
  }
});
