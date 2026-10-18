import { z } from 'zod';

// Request body sent by the client — validated and size-capped so the endpoint
// can't be used as a free general-purpose LLM proxy.
const shortText = z.string().trim().max(80);
export const recipeRequestSchema = z.object({
  productNames: z.array(shortText).max(80),
  expiringNames: z.array(shortText).max(80).default([]),
  dietaryPrefs: z.array(shortText).max(20).default([]),
  language: z.string().max(10).default('en'),
  cookingMode: z.enum(['quick', 'empty_fridge', 'expiring', 'chef', 'custom']).optional(),
  courseSelection: z.enum(['starter', 'main', 'dessert', 'all']).optional(),
  customPreferences: z.string().max(500).optional(),
  customModeText: z.string().max(300).optional(),
  pantryStaples: z.array(shortText).max(60).default([]),
  servings: z.number().int().min(1).max(20).default(4),
  kitchenEquipment: z.array(shortText).max(30).default([]),
});
export type RecipeRequest = z.infer<typeof recipeRequestSchema>;

export const recipeSchema = z.object({
  name: z.string().describe('Short recipe name'),
  course: z.enum(['starter', 'main', 'dessert']),
  prepTime: z.string().describe('e.g. "25 min" or "1 h 10 min"'),
  difficulty: z.string(),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.string() })),
  instructions: z.array(z.string()).describe('One step per string, no numbering'),
});
export type Recipe = z.infer<typeof recipeSchema>;

export function recipeCount(req: RecipeRequest) {
  const isChef = req.cookingMode === 'chef';
  const n = req.productNames.length;
  const baseCount = n <= 2 ? 2 : n <= 4 ? 3 : 4;
  const perCourse = isChef ? 1 : Math.max(1, baseCount - 1);
  return req.courseSelection === 'all' ? perCourse * 3 : (isChef ? 2 : baseCount);
}

export function buildRecipePrompt(req: RecipeRequest): string {
  const isFrench = req.language.startsWith('fr');
  const langLabel = isFrench ? 'français' : 'English';
  const difficultyOptions = isFrench ? 'Facile, Moyen, Difficile' : 'Easy, Medium, Hard';
  const isChef = req.cookingMode === 'chef';
  const isAll = req.courseSelection === 'all';
  const n = req.productNames.length;
  const perCourse = isChef ? 1 : Math.max(1, (n <= 2 ? 2 : n <= 4 ? 3 : 4) - 1);
  const count = recipeCount(req);

  const dietLabel = req.dietaryPrefs.length > 0
    ? `Dietary restrictions to respect: ${req.dietaryPrefs.join(', ')}.`
    : '';
  const customLabel = req.customPreferences?.trim()
    ? `Also take into account these personal preferences: ${req.customPreferences.trim()}`
    : '';
  const equipmentLabel = req.kitchenEquipment.length > 0
    ? (isFrench
        ? `Équipements disponibles : ${req.kitchenEquipment.join(', ')}. Propose uniquement des recettes réalisables avec ces équipements. N'impose pas d'équipement non listé.`
        : `Available kitchen equipment: ${req.kitchenEquipment.join(', ')}. Only suggest recipes that can be made with this equipment. Do not require equipment not listed.`)
    : '';
  const servingsLabel = req.servings !== 4
    ? (isFrench ? `Génère des recettes pour ${req.servings} personne${req.servings > 1 ? 's' : ''}.` : `Generate recipes for ${req.servings} serving${req.servings > 1 ? 's' : ''}.`)
    : '';

  let modeInstruction = '';
  if (req.cookingMode === 'quick') {
    modeInstruction = isFrench
      ? 'Concentre-toi sur des recettes simples et rapides, prêtes en moins de 30 minutes, avec des techniques accessibles à tous.'
      : 'Focus on simple, quick recipes ready in under 30 minutes with accessible cooking techniques.';
  } else if (req.cookingMode === 'empty_fridge') {
    modeInstruction = isFrench
      ? "L'objectif est de vider le frigo : essaie d'utiliser le maximum d'ingrédients disponibles dans chaque recette pour minimiser le gaspillage."
      : 'The goal is to empty the fridge: try to use as many of the listed ingredients as possible in each recipe to minimize waste.';
  } else if (req.cookingMode === 'expiring') {
    const expiringList = req.expiringNames.length > 0 ? req.expiringNames.join(', ') : req.productNames.slice(0, 3).join(', ');
    modeInstruction = isFrench
      ? `Ces ingrédients expirent bientôt : ${expiringList}. Donne-leur la priorité absolue dans les recettes.`
      : `These ingredients are expiring soon: ${expiringList}. Prioritize using them prominently in the recipes.`;
  } else if (isChef) {
    modeInstruction = isFrench
      ? "Propose des recettes élaborées et techniques, dignes d'un chef. Techniques raffinées, dressage soigné et saveurs complexes sont les bienvenus. La difficulté est un atout. Donne à chaque recette un nom court et élégant (3 mots maximum), pas une liste d'ingrédients."
      : 'Suggest elaborate, chef-level recipes with refined techniques, sophisticated plating, and complex flavors. Difficulty is a feature. Give each recipe a short, elegant name (3 words max) — not a list of ingredients.';
  } else if (req.cookingMode === 'custom' && req.customModeText) {
    modeInstruction = isFrench
      ? `Respecte impérativement ce contexte ou cette envie : ${req.customModeText}`
      : `Strictly respect this context or preference: ${req.customModeText}`;
  }

  let courseInstruction = '';
  if (isAll) {
    courseInstruction = isFrench
      ? `Génère exactement ${perCourse} entrée${perCourse > 1 ? 's' : ''}, ${perCourse} plat${perCourse > 1 ? 's' : ''} principal${perCourse > 1 ? 'x' : ''} et ${perCourse} dessert${perCourse > 1 ? 's' : ''}, dans cet ordre. Rappel : une entrée est une petite portion salée en début de repas (soupe, salade, verrine...) ; un plat principal est copieux et central (viande, poisson, pâtes...) ; un dessert est sucré et en fin de repas (gâteau, mousse, tarte...).`
      : `Generate exactly ${perCourse} starter${perCourse > 1 ? 's' : ''}, ${perCourse} main course${perCourse > 1 ? 's' : ''}, and ${perCourse} dessert${perCourse > 1 ? 's' : ''}, in that order. Reminder: a starter is a small savory portion at the start of a meal (soup, salad, verrine...); a main is substantial and central (meat, fish, pasta...); a dessert is sweet and at the end of a meal (cake, mousse, tart...).`;
  } else if (req.courseSelection === 'starter') {
    courseInstruction = isFrench
      ? "Toutes les recettes doivent être des entrées (course = starter). Une entrée est une petite portion servie en début de repas pour ouvrir l'appétit : soupe, velouté salé, salade composée, verrine salée, tartine légère, carpaccio, ceviche, bouchée apéritive, etc. Un plat où le sucré est dominant est un dessert — jamais une entrée. Si les ingrédients ne permettent pas de faire N vraies entrées cohérentes, retournes-en moins plutôt que de forcer."
      : 'All recipes must be starters (course = starter): a small portion served at the beginning of a meal — soup, salad, bruschetta, tartare, carpaccio, ceviche, savory verrine, light bite, etc. A dish where sweetness dominates is a dessert — never a starter. If the ingredients do not allow N coherent starters, return fewer rather than forcing.';
  } else if (req.courseSelection === 'main') {
    courseInstruction = isFrench
      ? 'Toutes les recettes doivent être des plats principaux (course = main) : le plat central et copieux du repas — viande, poisson, pâtes, riz, légumineuses, etc. avec leurs accompagnements. Pas une entrée, pas un dessert.'
      : 'All recipes must be main courses (course = main): the central, substantial dish of the meal — meat, fish, pasta, rice, legumes, etc. with sides. Not a starter, not a dessert.';
  } else if (req.courseSelection === 'dessert') {
    courseInstruction = isFrench
      ? 'Toutes les recettes doivent être des desserts (course = dessert) : un plat sucré servi en fin de repas — gâteau, tarte, mousse, crème, fruit préparé, glace, etc.'
      : 'All recipes must be desserts (course = dessert): a sweet dish served at the end of a meal — cake, tart, mousse, cream, prepared fruit, ice cream, etc.';
  }

  const staples = req.pantryStaples.length > 0 ? req.pantryStaples.join(', ') : 'salt, pepper, oil, butter';

  return [
    `You are a creative chef. I have these ingredients available: ${req.productNames.join(', ')}.`,
    dietLabel, customLabel, equipmentLabel, servingsLabel, modeInstruction, courseInstruction,
    `Suggest between 2 and ${count} delicious, coherent recipes, simplest first. Only combine ingredients whose association makes clear culinary sense — avoid experimental or doubtful pairings. When in doubt, choose simple and classic over creative. Only include a recipe if it can be made almost entirely with the ingredients listed above plus the pantry staples — never invent an ingredient the user does not have. If you can only find 2 truly relevant recipes, return 2. For each recipe, use whichever ingredients naturally belong together. Taste and coherence always come first. The user always has these pantry staples at home: ${staples}.`,
    `Write everything in ${langLabel}. difficulty must be one of: ${difficultyOptions}.`,
  ].filter(Boolean).join('\n');
}
