import { MealDetails } from './mealApi';
import { DietaryPreference } from '../types/UserProfile';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
  if (!apiKey) return [];

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
Suggest 10 recipes using mostly these ingredients. Common pantry staples (salt, pepper, oil, flour, garlic, butter) are available.
Respond ONLY in ${langLabel}. Return ONLY a valid JSON array with no markdown or explanation:
[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":"...","prepTime":"...","difficulty":"..."}]
difficulty must be one of: ${difficultyOptions}`;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonText = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
    const raws: GeminiRecipeRaw[] = JSON.parse(jsonText);

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
  } catch {
    return [];
  }
}
