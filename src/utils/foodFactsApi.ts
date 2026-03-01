import { ProductCategory } from '../types/Product';

export interface FoodFactsResult {
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
}

// Maps Open Food Facts category tags to our ProductCategory
const CATEGORY_TAG_MAP: { tag: string; category: ProductCategory }[] = [
  // Dairy
  { tag: 'en:dairy', category: 'Dairy' },
  { tag: 'en:milks', category: 'Dairy' },
  { tag: 'en:cheeses', category: 'Dairy' },
  { tag: 'en:yogurts', category: 'Dairy' },
  { tag: 'en:butters', category: 'Dairy' },
  { tag: 'en:creams', category: 'Dairy' },
  { tag: 'en:eggs', category: 'Dairy' },
  // Fruits
  { tag: 'en:fruits', category: 'Fruits' },
  { tag: 'en:fresh-fruits', category: 'Fruits' },
  // Vegetables
  { tag: 'en:vegetables', category: 'Vegetables' },
  { tag: 'en:fresh-vegetables', category: 'Vegetables' },
  // Meat
  { tag: 'en:meats', category: 'Meat' },
  { tag: 'en:poultry', category: 'Meat' },
  { tag: 'en:charcuterie', category: 'Meat' },
  // Fish
  { tag: 'en:fish-and-seafood', category: 'Fish' },
  { tag: 'en:seafood', category: 'Fish' },
  { tag: 'en:fishes', category: 'Fish' },
  // Beverages
  { tag: 'en:beverages', category: 'Beverages' },
  { tag: 'en:waters', category: 'Beverages' },
  { tag: 'en:beers', category: 'Beverages' },
  { tag: 'en:wines', category: 'Beverages' },
  { tag: 'en:fruit-juices', category: 'Beverages' },
  { tag: 'en:sodas', category: 'Beverages' },
  // Frozen
  { tag: 'en:frozen-foods', category: 'Frozen' },
];

// Normalizes unit strings from the API to our unit values
const UNIT_MAP: Record<string, string> = {
  g: 'g',
  gr: 'g',
  kg: 'kg',
  l: 'L',
  L: 'L',
  liter: 'L',
  litre: 'L',
  liters: 'L',
  litres: 'L',
  ml: 'mL',
  mL: 'mL',
  cl: 'mL',
};

function mapCategory(tags: string[]): ProductCategory {
  for (const { tag, category } of CATEGORY_TAG_MAP) {
    if (tags.includes(tag)) return category;
  }
  return 'Other';
}

// Parses quantity strings like "400 g", "1 L", "75 cl", "6x50 cl"
function parseQuantity(raw: string): { quantity: number; unit: string } | null {
  // Handle multi-pack format like "6x50 cl" — use the total or just the single unit
  const multiMatch = raw.match(/(\d+)\s*[xX×]\s*([\d.,]+)\s*([a-zA-Z]+)/);
  if (multiMatch) {
    const count = parseFloat(multiMatch[1]);
    const amount = parseFloat(multiMatch[2].replace(',', '.'));
    const rawUnit = multiMatch[3].toLowerCase();
    const unit = UNIT_MAP[rawUnit] ?? rawUnit;
    // Return total quantity (e.g. 6×50 cl = 300 mL)
    const totalAmount = count * amount;
    const normalized = unit === 'mL' ? totalAmount : totalAmount;
    return { quantity: normalized, unit };
  }

  const match = raw.match(/([\d.,]+)\s*([a-zA-Z]+)/);
  if (!match) return null;

  const amount = parseFloat(match[1].replace(',', '.'));
  const rawUnit = match[2].toLowerCase();

  if (isNaN(amount)) return null;

  // Special case: cl → convert to mL
  if (rawUnit === 'cl') return { quantity: amount * 10, unit: 'mL' };

  const unit = UNIT_MAP[rawUnit] ?? 'unit';
  return { quantity: amount, unit };
}

export async function lookupBarcode(barcode: string): Promise<FoodFactsResult | null> {
  const fields = 'product_name,product_name_fr,categories_tags,quantity';
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.status !== 1 || !data.product) return null;

  const { product } = data;

  // Prefer French name, fall back to generic product name
  const name: string = product.product_name_fr || product.product_name || '';
  if (!name.trim()) return null;

  const category = mapCategory(product.categories_tags ?? []);
  const parsed = product.quantity ? parseQuantity(product.quantity) : null;

  return {
    name: name.trim(),
    category,
    quantity: parsed?.quantity ?? 1,
    unit: parsed?.unit ?? 'unit',
  };
}
