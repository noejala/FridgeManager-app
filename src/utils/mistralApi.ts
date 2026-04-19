import { MealDetails } from './mealApi';
import { DietaryPreference } from '../types/UserProfile';

export type CookingMode = 'quick' | 'empty_fridge' | 'expiring' | 'chef' | 'custom';
export type CourseSelection = 'starter' | 'main' | 'dessert' | 'all';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

interface MistralRecipeRaw {
  name: string;
  ingredients: { name: string; quantity: string }[];
  instructions: string | string[];
  prepTime: string;
  difficulty: string;
  course?: 'starter' | 'main' | 'dessert';
}

export async function fetchAiRecipes(
  productNames: string[],
  dietaryPrefs: DietaryPreference[],
  language: string,
  cookingMode?: CookingMode,
  expiringNames?: string[],
  courseSelection?: CourseSelection,
  customPreferences?: string,
  customModeText?: string,
  pantryStaples?: string[]
): Promise<MealDetails[]> {
  const rateLimitUntil = localStorage.getItem('mistral-ratelimit-until');
  if (rateLimitUntil && Date.now() < Number(rateLimitUntil)) {
    console.warn('[Mistral] rate limit active until', new Date(Number(rateLimitUntil)).toLocaleTimeString());
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const raw = [...productNames].sort().join(',') + '|' + [...dietaryPrefs].sort().join(',') + '|' + language + '|' + today + '|' + (cookingMode ?? 'none') + '|' + (courseSelection ?? 'none') + '|' + (customPreferences ?? '') + '|' + (customModeText ?? '') + '|' + [...(pantryStaples ?? [])].sort().join(',') + '|v10';
  const cacheKey = `mistral-recipes-${hashString(raw).toString(36)}`;

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
  const customLabel = customPreferences?.trim()
    ? `Also take into account these personal preferences: ${customPreferences.trim()}`
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
  } else if (cookingMode === 'chef') {
    modeInstruction = isFrench
      ? "Propose des recettes élaborées et techniques, dignes d'un chef. Techniques raffinées, dressage soigné et saveurs complexes sont les bienvenus. La difficulté est un atout. Donne à chaque recette un nom court et élégant (3 mots maximum), pas une liste d'ingrédients."
      : 'Suggest elaborate, chef-level recipes with refined techniques, sophisticated plating, and complex flavors. Difficulty is a feature. Give each recipe a short, elegant name (3 words max) — not a list of ingredients.';
  } else if (cookingMode === 'custom' && customModeText) {
    modeInstruction = isFrench
      ? `Respecte impérativement ce contexte ou cette envie : ${customModeText}`
      : `Strictly respect this context or preference: ${customModeText}`;
  }

  const isChef = cookingMode === 'chef';
  const isAll = courseSelection === 'all';
  const perCourse = isChef ? 1 : 2;
  const recipeCount = isAll ? perCourse * 3 : (isChef ? 2 : 4);

  let courseInstruction = '';
  if (isAll) {
    courseInstruction = isFrench
      ? `Génère exactement ${perCourse} entrée${perCourse > 1 ? 's' : ''}, ${perCourse} plat${perCourse > 1 ? 's' : ''} principal${perCourse > 1 ? 'x' : ''} et ${perCourse} dessert${perCourse > 1 ? 's' : ''}. Chaque recette doit inclure un champ "course" avec la valeur "starter", "main" ou "dessert".`
      : `Generate exactly ${perCourse} starter${perCourse > 1 ? 's' : ''}, ${perCourse} main course${perCourse > 1 ? 's' : ''}, and ${perCourse} dessert${perCourse > 1 ? 's' : ''}. Each recipe must include a "course" field set to "starter", "main", or "dessert".`;
  } else if (courseSelection === 'starter') {
    courseInstruction = isFrench ? 'Toutes les recettes doivent être des entrées.' : 'All recipes must be starter dishes.';
  } else if (courseSelection === 'main') {
    courseInstruction = isFrench ? 'Toutes les recettes doivent être des plats principaux.' : 'All recipes must be main course dishes.';
  } else if (courseSelection === 'dessert') {
    courseInstruction = isFrench ? 'Toutes les recettes doivent être des desserts.' : 'All recipes must be desserts.';
  }

  const jsonSchema = isAll
    ? '[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":["step 1","step 2"],"prepTime":"...","difficulty":"...","course":"starter|main|dessert"}]'
    : '[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":["step 1","step 2"],"prepTime":"...","difficulty":"..."}]';

  const prompt = `You are a creative chef. I have these ingredients available: ${productNames.join(', ')}.
${dietLabel}
${customLabel}
${modeInstruction}
${courseInstruction}
Suggest ${recipeCount} delicious, coherent recipes. For each recipe, use whichever ingredients naturally belong together — use all of them if it makes culinary sense, or just a few. Never force an ingredient into a recipe just because it's available. Taste and coherence always come first. The user always has these pantry staples at home: ${pantryStaples && pantryStaples.length > 0 ? pantryStaples.join(', ') : 'salt, pepper, oil, butter'}.
Respond ONLY in ${langLabel}. Return ONLY a valid JSON array with no markdown or explanation:
${jsonSchema}
"instructions" must be a JSON array of strings, one string per step (no numbering in the text).
difficulty must be one of: ${difficultyOptions}`;

  try {
    const res = await fetch('/api/mistral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.error('[Mistral] API error', res.status, res.statusText, JSON.stringify(err, null, 2));
      if (res.status === 429) {
        localStorage.setItem('mistral-ratelimit-until', String(Date.now() + 5 * 60 * 1000));
      }
      if (res.status === 503) {
        throw new Error('ai_unavailable');
      }
      return [];
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';

    // Extract the JSON array from anywhere in the response (handles markdown fences and surrounding text)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[Mistral] No JSON array found in response:\n', text);
      return [];
    }

    let raws: MistralRecipeRaw[];
    try {
      raws = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[Mistral] JSON parse error', e, '\nExtracted:', jsonMatch[0]);
      return [];
    }

    const results: MealDetails[] = raws.map((r, i) => ({
      id: `mistral-${i}`,
      name: r.name,
      thumbnail: '',
      category: r.difficulty || '',
      area: r.prepTime || '',
      instructions: Array.isArray(r.instructions) ? r.instructions.join('\n') : r.instructions,
      ingredients: r.ingredients.map(ing => ({ name: ing.name, measure: ing.quantity })),
      ...(r.course ? { course: r.course } : courseSelection && courseSelection !== 'all' ? { course: courseSelection as 'starter' | 'main' | 'dessert' } : {}),
    }));

    localStorage.setItem(cacheKey, JSON.stringify(results));
    return results;
  } catch (e) {
    if (e instanceof Error && e.message === 'ai_unavailable') {
      throw e;
    }
    console.error('[Mistral] Unexpected error', e);
    return [];
  }
}
