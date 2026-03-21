import { MealDetails } from './mealApi';

const BASE_URL = 'https://api.spoonacular.com';
const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY as string | undefined;

interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
}

interface SpoonacularIngredient {
  name: string;
  amount: number;
  unit: string;
}

interface SpoonacularDetails {
  id: number;
  title: string;
  image: string;
  dishTypes: string[];
  cuisines: string[];
  analyzedInstructions: { steps: { step: string }[] }[];
  extendedIngredients: SpoonacularIngredient[];
}

function mapCategory(dishTypes: string[]): string {
  const types = dishTypes.map(t => t.toLowerCase());
  if (types.some(t => t.includes('dessert'))) return 'Dessert';
  if (types.some(t => t.includes('appetizer') || t.includes('starter') || t.includes('snack'))) return 'Starter';
  return 'Main Course';
}

export async function searchSpoonacularByIngredients(
  ingredients: string[]
): Promise<Pick<MealDetails, 'id' | 'name' | 'thumbnail'>[]> {
  if (!API_KEY) return [];
  const url = `${BASE_URL}/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients.join(','))}&number=20&ranking=2&ignorePantry=true&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: SpoonacularSearchResult[] = await res.json();
  return data.map(r => ({ id: `spoon-${r.id}`, name: r.title, thumbnail: r.image }));
}

export async function getSpoonacularRecipeDetails(id: string): Promise<MealDetails | null> {
  if (!API_KEY) return null;
  const numericId = id.replace('spoon-', '');
  const res = await fetch(`${BASE_URL}/recipes/${numericId}/information?apiKey=${API_KEY}`);
  if (!res.ok) return null;
  const d: SpoonacularDetails = await res.json();

  const instructions = d.analyzedInstructions
    .flatMap(b => b.steps.map(s => s.step))
    .join('\n\n');

  const ingredients = d.extendedIngredients.map(ing => ({
    name: ing.name,
    measure: `${ing.amount} ${ing.unit}`.trim(),
  }));

  return {
    id: `spoon-${d.id}`,
    name: d.title,
    thumbnail: d.image,
    category: mapCategory(d.dishTypes),
    area: d.cuisines[0] || '',
    instructions,
    ingredients,
  };
}
