import { MealDetails } from './mealApi';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const CACHE_KEY = 'mealdb_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  meals: MealDetails[];
  ts: number;
}

type ApiMeal = Record<string, string | null>;

function parseMeal(m: ApiMeal): MealDetails {
  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = m[`strIngredient${i}`];
    const measure = m[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), measure: (measure || '').trim() });
    }
  }
  return {
    id: m.idMeal!,
    name: m.strMeal!,
    thumbnail: m.strMealThumb ?? '',
    category: m.strCategory ?? '',
    area: m.strArea ?? '',
    instructions: m.strInstructions ?? '',
    ingredients,
  };
}

async function fetchByLetter(letter: string): Promise<MealDetails[]> {
  try {
    const res = await fetch(`${BASE_URL}/search.php?f=${letter}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.meals ? (data.meals as ApiMeal[]).map(parseMeal) : [];
  } catch {
    return [];
  }
}

export async function getAllMeals(): Promise<MealDetails[]> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts < CACHE_TTL_MS) return entry.meals;
    }
  } catch {}

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const results = await Promise.all(letters.map(fetchByLetter));

  const seen = new Set<string>();
  const meals = results.flat().filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ meals, ts: Date.now() }));
  } catch {}

  return meals;
}
