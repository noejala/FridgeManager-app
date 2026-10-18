import { MealDetails } from './mealApi';
import { DietaryPreference } from '../types/UserProfile';
import { supabase } from '../lib/supabase';

export type CookingMode = 'quick' | 'empty_fridge' | 'expiring' | 'chef' | 'custom';
export type CourseSelection = 'starter' | 'main' | 'dessert' | 'all';

export interface AiRecipeParams {
  productNames: string[];
  expiringNames: string[];
  dietaryPrefs: DietaryPreference[];
  language: string;
  cookingMode?: CookingMode;
  courseSelection?: CourseSelection;
  customPreferences?: string;
  customModeText?: string;
  pantryStaples: string[];
  servings: number;
  kitchenEquipment: string[];
}

// Thrown so the UI can tell "AI is down" from "you've hit today's limit".
export class AiRecipeError extends Error {
  constructor(public reason: 'ai_unavailable' | 'ai_quota') {
    super(reason);
  }
}

interface AiRecipe {
  name: string;
  course: 'starter' | 'main' | 'dessert';
  prepTime: string;
  difficulty: string;
  ingredients: { name: string; quantity: string }[];
  instructions: string[];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function toMeal(r: AiRecipe, i: number): MealDetails {
  return {
    id: `ai-${i}`,
    name: r.name,
    thumbnail: '',
    category: r.difficulty,
    area: r.prepTime,
    instructions: r.instructions.join('\n'),
    ingredients: r.ingredients.map(ing => ({ name: ing.name, measure: ing.quantity })),
    course: r.course,
  };
}

// Streams AI recipes from /api/recipes: `onRecipe` fires as soon as each recipe is
// generated. Same-day identical requests are served from a localStorage cache.
export async function fetchAiRecipes(
  params: AiRecipeParams,
  onRecipe?: (meal: MealDetails) => void,
): Promise<MealDetails[]> {
  const sorted = (a: string[]) => [...a].sort().join(',');
  const raw = [sorted(params.productNames), sorted(params.dietaryPrefs), params.language,
    new Date().toISOString().slice(0, 10), params.cookingMode ?? 'none', params.courseSelection ?? 'none',
    params.customPreferences ?? '', params.customModeText ?? '', sorted(params.pantryStaples),
    params.servings, sorted(params.kitchenEquipment), 'v11'].join('|');
  const cacheKey = `ai-recipes-${hashString(raw).toString(36)}`;

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const meals = JSON.parse(cached) as MealDetails[];
      meals.forEach(m => onRecipe?.(m));
      return meals;
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok || !res.body) {
    console.error('[AI recipes] API error', res.status);
    throw new AiRecipeError(res.status === 429 ? 'ai_quota' : 'ai_unavailable');
  }

  // NDJSON: one complete recipe per line.
  const meals: MealDetails[] = [];
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    const lines = buffer.split('\n');
    buffer = done ? '' : lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const meal = toMeal(JSON.parse(line) as AiRecipe, meals.length);
        meals.push(meal);
        onRecipe?.(meal);
      } catch (e) {
        console.error('[AI recipes] bad line', e);
      }
    }
    if (done) break;
  }

  if (meals.length === 0) throw new AiRecipeError('ai_unavailable');
  localStorage.setItem(cacheKey, JSON.stringify(meals));
  return meals;
}
