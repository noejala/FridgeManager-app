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
  pantryStaples?: string[],
  servings?: number
): Promise<MealDetails[]> {
  const rateLimitUntil = localStorage.getItem('mistral-ratelimit-until');
  if (rateLimitUntil && Date.now() < Number(rateLimitUntil)) {
    console.warn('[Mistral] rate limit active until', new Date(Number(rateLimitUntil)).toLocaleTimeString());
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);
  const raw = [...productNames].sort().join(',') + '|' + [...dietaryPrefs].sort().join(',') + '|' + language + '|' + today + '|' + (cookingMode ?? 'none') + '|' + (courseSelection ?? 'none') + '|' + (customPreferences ?? '') + '|' + (customModeText ?? '') + '|' + [...(pantryStaples ?? [])].sort().join(',') + '|' + (servings ?? 4) + '|v10';
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
  const productCount = productNames.length;
  const baseCount = productCount <= 2 ? 2 : productCount <= 4 ? 3 : 4;
  const perCourse = isChef ? 1 : Math.max(1, baseCount - 1);
  const recipeCount = isAll ? perCourse * 3 : (isChef ? 2 : baseCount);

  let courseInstruction = '';
  if (isAll) {
    courseInstruction = isFrench
      ? `Génère exactement ${perCourse} entrée${perCourse > 1 ? 's' : ''}, ${perCourse} plat${perCourse > 1 ? 's' : ''} principal${perCourse > 1 ? 'x' : ''} et ${perCourse} dessert${perCourse > 1 ? 's' : ''}. Chaque recette doit inclure un champ "course" avec la valeur "starter", "main" ou "dessert". Rappel : une entrée est une petite portion salée en début de repas (soupe, salade, verrine...) ; un plat principal est copieux et central (viande, poisson, pâtes...) ; un dessert est sucré et en fin de repas (gâteau, mousse, tarte...).`
      : `Generate exactly ${perCourse} starter${perCourse > 1 ? 's' : ''}, ${perCourse} main course${perCourse > 1 ? 's' : ''}, and ${perCourse} dessert${perCourse > 1 ? 's' : ''}. Each recipe must include a "course" field set to "starter", "main", or "dessert". Reminder: a starter is a small savory portion at the start of a meal (soup, salad, verrine...); a main is substantial and central (meat, fish, pasta...); a dessert is sweet and at the end of a meal (cake, mousse, tart...).`;
  } else if (courseSelection === 'starter') {
    courseInstruction = isFrench
      ? 'Toutes les recettes doivent être des entrées. Une entrée est une petite portion servie en début de repas pour ouvrir l\'appétit : soupe, velouté salé, salade composée, verrine salée, tartine légère, carpaccio, ceviche, bouchée apéritive, etc. Une entrée peut contenir des ingrédients sucrés si la recette reste dans une logique salée/apéritive (ex: tartine poulet-pomme, salade de fruits acidulée). En revanche, un plat où le sucré est dominant (bouchées de chocolat, mousse, caramel, fruit sucré seul) est un dessert — jamais une entrée. Si les ingrédients disponibles ne permettent pas de faire N vraies entrées cohérentes, retournes-en moins plutôt que de forcer.'
      : 'All recipes must be starter dishes. A starter is a small portion served at the beginning of a meal: soup, salad, bruschetta, tartare, carpaccio, ceviche, savory verrine, light bite, etc. A starter may include sweet ingredients if the overall dish remains savory/appetizer-oriented (e.g. chicken-apple tartine, acidic fruit salad). However, a dish where sweetness dominates (chocolate bites, mousse, caramel, sweet fruit alone) is a dessert — never a starter. If the available ingredients do not allow for N coherent starters, return fewer rather than forcing.';
  } else if (courseSelection === 'main') {
    courseInstruction = isFrench
      ? 'Toutes les recettes doivent être des plats principaux. Un plat principal est le plat central et copieux du repas : viande, poisson, pâtes, riz, légumineuses, etc. avec leurs accompagnements. Ce n\'est pas une entrée, pas un dessert.'
      : 'All recipes must be main course dishes. A main course is the central and substantial dish of the meal: meat, fish, pasta, rice, legumes, etc. with sides. Not a starter, not a dessert.';
  } else if (courseSelection === 'dessert') {
    courseInstruction = isFrench
      ? 'Toutes les recettes doivent être des desserts. Un dessert est un plat sucré servi en fin de repas : gâteau, tarte, mousse, crème, fruit préparé, glace, etc. Ce n\'est pas une entrée, pas un plat principal.'
      : 'All recipes must be desserts. A dessert is a sweet dish served at the end of a meal: cake, tart, mousse, cream, prepared fruit, ice cream, etc. Not a starter, not a main course.';
  }

  const jsonSchema = isAll
    ? '[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":["step 1","step 2"],"prepTime":"...","difficulty":"...","course":"starter|main|dessert"}]'
    : '[{"name":"...","ingredients":[{"name":"...","quantity":"..."}],"instructions":["step 1","step 2"],"prepTime":"...","difficulty":"..."}]';

  const servingsLabel = servings && servings !== 4
    ? (isFrench ? `Génère des recettes pour ${servings} personne${servings > 1 ? 's' : ''}.` : `Generate recipes for ${servings} serving${servings > 1 ? 's' : ''}.`)
    : '';

  const prompt = `You are a creative chef. I have these ingredients available: ${productNames.join(', ')}.
${dietLabel}
${customLabel}
${servingsLabel}
${modeInstruction}
${courseInstruction}
Suggest between 2 and ${recipeCount} delicious, coherent recipes. Only combine ingredients whose association makes clear culinary sense — avoid experimental or doubtful pairings. When in doubt, choose simple and classic over creative. Only include a recipe if it can be made almost entirely with the ingredients listed above plus the pantry staples — never invent an ingredient the user does not have. If you can only find 2 truly relevant recipes, return 2. For each recipe, use whichever ingredients naturally belong together — use all of them if it makes culinary sense, or just a few. Taste and coherence always come first. The user always has these pantry staples at home: ${pantryStaples && pantryStaples.length > 0 ? pantryStaples.join(', ') : 'salt, pepper, oil, butter'}.
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

export async function fetchProductFunFacts(productName: string, language: string): Promise<string[]> {
  const cacheKey = `funfacts-v2-${productName.toLowerCase()}-${language}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try { return JSON.parse(cached) as string[]; }
    catch { localStorage.removeItem(cacheKey); }
  }

  const isFrench = language.startsWith('fr');
  const langLabel = isFrench ? 'français' : 'English';

  const prompt = `Give me 3 surprising fun facts about ${productName} (the food/ingredient). Each fact must be a single short sentence of max 12 words. Be punchy and direct.
Respond ONLY in ${langLabel}. Return ONLY a valid JSON array of 3 strings, no markdown:
["fact 1","fact 2","fact 3"]`;

  try {
    const res = await fetch('/api/mistral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const facts: string[] = JSON.parse(jsonMatch[0]);
    localStorage.setItem(cacheKey, JSON.stringify(facts));
    return facts;
  } catch {
    return [];
  }
}
