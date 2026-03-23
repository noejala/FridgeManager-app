import { MealDetails } from './mealApi';
import { DietaryPreference } from '../types/UserProfile';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

interface GeminiRecipeRaw {
  name: string;
  ingredients: { name: string; quantity: string }[];
  instructions: string;
  prepTime: string;
  difficulty: string;
}

export async function fetchGeminiRecipes(
  productNames: string[],
  dietaryPrefs: DietaryPreference[],
  language: string
): Promise<MealDetails[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) { console.error('[Gemini] key MISSING'); return []; }

  const rateLimitUntil = localStorage.getItem('gemini-ratelimit-until');
  if (rateLimitUntil && Date.now() < Number(rateLimitUntil)) {
    console.warn('[Gemini] rate limit active until', new Date(Number(rateLimitUntil)).toLocaleTimeString());
    return [];
  }

  console.log('[Gemini] key:', apiKey.slice(0, 10) + '...');
  console.log('[Gemini] making request to:', `${GEMINI_API_URL}?key=${apiKey.slice(0, 10)}...`);

  const today = new Date().toISOString().slice(0, 10);
  const raw = [...productNames].sort().join(',') + '|' + [...dietaryPrefs].sort().join(',') + '|' + language + '|' + today;
  const cacheKey = `gemini-recipes-${hashString(raw).toString(36)}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached) as MealDetails[]; }
    catch { localStorage.removeItem(cacheKey); }
  }

  const isFrench = language.startsWith('fr');
  const langLabel = isFrench ? 'français' : 'English';
  const difficultyOptions = isFrench ? 'Facile, Moyen, Difficile' : 'Easy, Medium, Hard';
  const dietLabel = dietaryPrefs.length > 0
    ? `Dietary restrictions to respect: ${dietaryPrefs.join(', ')}.`
    : '';

  const prompt = `You are a cooking assistant. I have these ingredients in my fridge: ${productNames.join(', ')}.
${dietLabel}
Suggest 5 recipes using mostly these ingredients. Common pantry staples (salt, pepper, oil, flour, garlic, butter) are available.
Respond ONLY in ${langLabel}. Return ONLY a valid JSON array with no markdown or explanation:
[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":"...","prepTime":"...","difficulty":"..."}]
difficulty must be one of: ${difficultyOptions}`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error('[Gemini] API error', res.status, res.statusText, JSON.stringify(err, null, 2));
      if (res.status === 429) {
        localStorage.setItem('gemini-ratelimit-until', String(Date.now() + 5 * 60 * 1000));
      }
      return [];
    }

    const data = await res.json();
    const parts: { text?: string }[] = data.candidates?.[0]?.content?.parts ?? [];
    const text: string = parts.map(p => p.text ?? '').join('');

    // Extract the JSON array from anywhere in the response (handles markdown fences and surrounding text)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Gemini] No JSON array found in response:\n', text);
      return [];
    }

    let raws: GeminiRecipeRaw[];
    try {
      raws = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[Gemini] JSON parse error', e, '\nExtracted:', jsonMatch[0]);
      return [];
    }

    const results: MealDetails[] = raws.map((r, i) => ({
      id: `gemini-${i}`,
      name: r.name,
      thumbnail: '',
      category: r.difficulty || '',
      area: r.prepTime || '',
      instructions: r.instructions,
      ingredients: r.ingredients.map(ing => ({ name: ing.name, measure: ing.quantity })),
    }));

    localStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  } catch (e) {
    console.error('[Gemini] Unexpected error', e);
    return [];
  }
}
