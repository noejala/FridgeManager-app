const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export function singularize(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ves')) return w.slice(0, -3) + 'f';
  if (w.endsWith('oes')) return w.slice(0, -2);
  if (w.endsWith('ses') || w.endsWith('shes') || w.endsWith('ches') || w.endsWith('xes') || w.endsWith('zes'))
    return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

interface MealSummary {
  id: string;
  name: string;
  thumbnail: string;
}

export interface MealDetails {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  area: string;
  instructions: string;
  ingredients: { name: string; measure: string }[];
}

interface ApiMealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

interface ApiMealDetails extends ApiMealSummary {
  strCategory: string;
  strArea: string;
  strInstructions: string;
  [key: string]: string | null;
}

export async function searchByIngredient(ingredient: string): Promise<MealSummary[]> {
  const normalized = singularize(ingredient);
  const res = await fetch(`${BASE_URL}/filter.php?i=${encodeURIComponent(normalized)}`);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.meals) return [];
  return (data.meals as ApiMealSummary[]).map((m) => ({
    id: m.idMeal,
    name: m.strMeal,
    thumbnail: m.strMealThumb,
  }));
}

export async function getMealDetails(id: string): Promise<MealDetails | null> {
  const res = await fetch(`${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.meals || data.meals.length === 0) return null;

  const m = data.meals[0] as ApiMealDetails;
  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = m[`strIngredient${i}`];
    const measure = m[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({ name: name.trim(), measure: (measure || '').trim() });
    }
  }

  return {
    id: m.idMeal,
    name: m.strMeal,
    thumbnail: m.strMealThumb,
    category: m.strCategory || '',
    area: m.strArea || '',
    instructions: m.strInstructions || '',
    ingredients,
  };
}
