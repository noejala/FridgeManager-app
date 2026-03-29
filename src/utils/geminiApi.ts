import { MealDetails } from './mealApi';
import { DietaryPreference } from '../types/UserProfile';

export type CookingMode = 'quick' | 'empty_fridge' | 'expiring' | 'seasonal' | 'chef';

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
  instructions: string | string[];
  prepTime: string;
  difficulty: string;
}

export async function fetchGeminiRecipes(
  productNames: string[],
  dietaryPrefs: DietaryPreference[],
  language: string,
  cookingMode?: CookingMode,
  expiringNames?: string[]
): Promise<MealDetails[]> {
  const rateLimitUntil = localStorage.getItem('gemini-ratelimit-until');
  if (rateLimitUntil && Date.now() < Number(rateLimitUntil)) {
    console.warn('[Gemini] rate limit active until', new Date(Number(rateLimitUntil)).toLocaleTimeString());
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const raw = [...productNames].sort().join(',') + '|' + [...dietaryPrefs].sort().join(',') + '|' + language + '|' + today + '|' + (cookingMode ?? 'none') + '|v8';
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

  let modeInstruction = '';
  if (cookingMode === 'quick') {
    modeInstruction = isFrench
      ? 'Concentre-toi sur des recettes simples et rapides, prêtes en moins de 30 minutes, avec des techniques accessibles à tous.'
      : 'Focus on simple, quick recipes ready in under 30 minutes with accessible cooking techniques.';
  } else if (cookingMode === 'empty_fridge') {
    modeInstruction = isFrench
      ? "L'objectif est de vider le frigo : essaie d'utiliser le maximum d'ingrédients disponibles dans chaque recette pour minimiser le gaspillage."
      : 'The goal is to empty the fridge: try to use as many of the listed ingredients as possible in each recipe to minimize waste.';
  } else if (cookingMode === 'expiring') {
    const expiringList = expiringNames && expiringNames.length > 0
      ? expiringNames.join(', ')
      : productNames.slice(0, 3).join(', ');
    modeInstruction = isFrench
      ? `Ces ingrédients expirent bientôt : ${expiringList}. Donne-leur la priorité absolue dans les recettes.`
      : `These ingredients are expiring soon: ${expiringList}. Prioritize using them prominently in the recipes.`;
  } else if (cookingMode === 'seasonal') {
    const month = new Date().toLocaleString(isFrench ? 'fr-FR' : 'en-US', { month: 'long' });
    modeInstruction = isFrench
      ? `Nous sommes en ${month}. Propose des recettes qui mettent en valeur les saveurs et produits de saison du moment.`
      : `It is currently ${month}. Suggest recipes that celebrate the flavors and seasonal produce of the moment.`;
  } else if (cookingMode === 'chef') {
    modeInstruction = isFrench
      ? "Propose des recettes élaborées et techniques, dignes d'un chef. Techniques raffinées, dressage soigné et saveurs complexes sont les bienvenus. La difficulté est un atout. Donne à chaque recette un nom court et élégant (3 mots maximum), pas une liste d'ingrédients."
      : 'Suggest elaborate, chef-level recipes with refined techniques, sophisticated plating, and complex flavors. Difficulty is a feature. Give each recipe a short, elegant name (3 words max) — not a list of ingredients.';
  }

  const recipeCount = cookingMode === 'chef' ? 2 : 5;

  const prompt = `You are a creative chef. I have these ingredients available: ${productNames.join(', ')}.
${dietLabel}
${modeInstruction}
Suggest ${recipeCount} delicious, coherent recipes. For each recipe, use whichever ingredients naturally belong together — use all of them if it makes culinary sense, or just a few. Never force an ingredient into a recipe just because it's available. Taste and coherence always come first. Common pantry staples (salt, pepper, oil, flour, garlic, butter, onion) are available.
Respond ONLY in ${langLabel}. Return ONLY a valid JSON array with no markdown or explanation:
[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":["step 1","step 2","step 3"],"prepTime":"...","difficulty":"..."}]
"instructions" must be a JSON array of strings, one string per step (no numbering in the text).
difficulty must be one of: ${difficultyOptions}`;

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
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
      instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : r.instructions,
      ingredients: r.ingredients.map(ing => ({ name: ing.name, measure: ing.quantity })),
    }));

    localStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  } catch (e) {
    console.error('[Gemini] Unexpected error', e);
    return [];
  }
}
