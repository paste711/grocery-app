import { useState, useRef } from 'react';
import type { RecipeDetail } from '../types';

interface Props {
  onImport: (recipe: RecipeDetail) => void;
}

type Mode = 'url' | 'screenshot' | 'text';

export function RecipeImport({ onImport }: Props) {
  const [mode, setMode] = useState<Mode>('url');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // URL mode
  const [url, setUrl] = useState('');

  // Screenshot mode
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text mode
  const [recipeText, setRecipeText] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      setPreviewSrc(dataUrl);
      setImageData({ base64, mimeType });
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleUrlImport() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/recipes/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const recipe: RecipeDetail = {
        ...data,
        id: url.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
        source: 'nyt',
        imageUrl: data.imageUrl || null,
      };
      onImport(recipe);
      setSuccess(`"${recipe.title}" added — ${recipe.ingredients.length} ingredients`);
      setUrl('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageImport() {
    if (!imageData) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/extract/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.title) throw new Error('No recipe found in image');
      const recipe: RecipeDetail = {
        id: data.id || `screenshot-${Date.now()}`,
        title: data.title,
        url: '',
        imageUrl: previewSrc,
        source: 'nyt',
        description: data.description || null,
        ingredients: data.ingredients || [],
      };
      onImport(recipe);
      setSuccess(`"${recipe.title}" added — ${recipe.ingredients.length} ingredients`);
      setPreviewSrc(null);
      setImageData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to extract recipe');
    } finally {
      setLoading(false);
    }
  }

  async function handleTextImport() {
    if (!recipeText.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/extract/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: recipeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.title) throw new Error('No recipe found in text');
      const recipe: RecipeDetail = {
        id: data.id || `text-${Date.now()}`,
        title: data.title,
        url: '',
        imageUrl: null,
        source: 'nyt',
        description: data.description || null,
        ingredients: data.ingredients || [],
      };
      onImport(recipe);
      setSuccess(`"${recipe.title}" added — ${recipe.ingredients.length} ingredients`);
      setRecipeText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to extract recipe');
    } finally {
      setLoading(false);
    }
  }

  const modes: { id: Mode; label: string; icon: string }[] = [
    { id: 'url', label: 'URL', icon: '🔗' },
    { id: 'screenshot', label: 'Screenshot', icon: '📷' },
    { id: 'text', label: 'Type / Paste', icon: '✏️' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        <span>➕</span> Import a Recipe
      </h3>

      {/* Mode tabs */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 divide-x divide-gray-200">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setError(null); setSuccess(null); }}
            className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
              mode === m.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* URL mode */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-1.5 text-sm min-w-0"
            placeholder="Paste recipe URL (NYT Cooking, any site…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
          />
          <button
            onClick={handleUrlImport}
            disabled={!url.trim() || loading}
            className="bg-blue-600 text-white rounded px-3 py-1.5 text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? '…' : 'Add to cart'}
          </button>
        </div>
      )}

      {/* Screenshot mode */}
      {mode === 'screenshot' && (
        <div className="space-y-2">
          <label
            className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 bg-gray-50 hover:bg-blue-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewSrc ? (
              <img src={previewSrc} alt="Recipe screenshot" className="h-full w-full object-contain rounded-lg p-1" />
            ) : (
              <>
                <span className="text-3xl">📷</span>
                <span className="text-sm text-gray-500 mt-1">Click to upload screenshot</span>
                <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
              </>
            )}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {previewSrc && (
            <button
              onClick={handleImageImport}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Extracting recipe with AI…' : '📷 Extract & Add to Cart'}
            </button>
          )}
        </div>
      )}

      {/* Text mode */}
      {mode === 'text' && (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded px-3 py-2 text-sm h-32 resize-none"
            placeholder={`Paste or type a recipe…\n\nExample:\nChicken Stir Fry\n- 2 chicken breasts\n- 3 cloves garlic\n- 2 tbsp soy sauce\n- 1 cup broccoli`}
            value={recipeText}
            onChange={(e) => setRecipeText(e.target.value)}
          />
          <button
            onClick={handleTextImport}
            disabled={!recipeText.trim() || loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Parsing recipe with AI…' : '✏️ Parse & Add to Cart'}
          </button>
        </div>
      )}

      {/* Feedback */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-700 bg-green-50 rounded p-2">✓ {success}</p>
      )}
    </div>
  );
}
