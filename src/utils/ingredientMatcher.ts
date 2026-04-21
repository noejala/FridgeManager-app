import { Product } from '../types/Product';
import { singularize } from './mealApi';

function norm(s: string): string {
  return s.toLowerCase().trim();
}

// Words too generic to use for matching
const STOP_WORDS = new Set(['fresh', 'dried', 'ground', 'whole', 'chopped', 'sliced', 'diced',
  'de', 'du', 'la', 'le', 'les', 'en', 'au', 'aux']);

function keywords(s: string): string[] {
  return norm(s)
    .split(/[\s,]+/)
    .map(singularize)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function matchIngredientToProduct(ingredientName: string, products: Product[]): Product | null {
  const ing = norm(ingredientName);
  const ingS = singularize(ing);

  // 1. Exact match
  for (const p of products) {
    const prod = norm(p.name);
    if (ing === prod || ingS === singularize(prod)) return p;
  }

  // 2. One contains the other
  for (const p of products) {
    const prod = norm(p.name);
    const prodS = singularize(prod);
    if (prod.includes(ing) || ing.includes(prod) || prodS.includes(ingS) || ingS.includes(prodS)) return p;
  }

  // 3. Keyword overlap (any significant word in common)
  const ingKw = keywords(ingredientName);
  if (ingKw.length === 0) return null;

  for (const p of products) {
    const prodKw = keywords(p.name);
    if (ingKw.some(iw => prodKw.some(pw => pw.includes(iw) || iw.includes(pw)))) return p;
  }

  return null;
}

export interface IngredientMatch {
  ingredient: { name: string; measure: string };
  product: Product;
}

export function matchRecipeIngredients(
  ingredients: { name: string; measure: string }[],
  products: Product[]
): IngredientMatch[] {
  const matched: IngredientMatch[] = [];
  const usedIds = new Set<string>();

  for (const ing of ingredients) {
    const available = products.filter(p => !usedIds.has(p.id));
    const product = matchIngredientToProduct(ing.name, available);
    if (product) {
      matched.push({ ingredient: ing, product });
      usedIds.add(product.id);
    }
  }

  return matched;
}
