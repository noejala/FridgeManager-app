import { ProductCategory } from '../types/Product';
import { guessCategory } from './categoryMapping';
import { estimateExpirationDate } from './shelfLife';
import { getDefaultExpirationDateType } from './expirationDateType';
import { supabase } from '../lib/supabase';

export type DraftProduct = {
  _draftId: string;
  name: string;
  category: ProductCategory;
  expirationDate: string | null;
  quantity: number;
  unit: string;
  expirationDateType: 'dlc' | 'ddm';
  isEstimatedExpiration: boolean;
};

interface RawProduct {
  name: string;
  quantity: number | null;
  unit: string | null;
  expirationDate: string | null;
  expirationDateType: 'dlc' | 'ddm' | null;
  category: ProductCategory | null;
}

const VALID_CATEGORIES: ProductCategory[] = [
  'Fruits', 'Vegetables', 'Meat', 'Fish', 'Dairy', 'Cheese', 'Butter',
  'Beverages', 'Sauces', 'Prepared', 'Milk', 'Juice', 'Cream', 'Other',
];

// Default shelf life in days per category — aligned with PRODUCT_SHELF_LIFE in shelfLife.ts
const CATEGORY_DEFAULT_DAYS: Partial<Record<ProductCategory, number>> = {
  Meat: 4,       // chicken 3, beef 5
  Fish: 2,       // salmon 2
  Dairy: 14,     // yogurt 14
  Milk: 7,       // milk 7
  Cream: 10,     // cream 10
  Cheese: 30,    // cheese 30
  Butter: 30,    // butter 30
  Fruits: 7,
  Vegetables: 7,
  Juice: 14,
  Sauces: 180,
  Beverages: 365,
  Other: 14,
};

function categoryFallbackDate(category: ProductCategory): string {
  const days = CATEGORY_DEFAULT_DAYS[category] ?? 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const VALID_UNITS = ['unit', 'kg', 'g', 'L', 'cl', 'ml', 'mL', 'pack'];

// Extraction runs server-side (/api/parse-voice) with a schema-validated output.
export async function parseVoiceTranscript(transcript: string, language: string): Promise<DraftProduct[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('/api/parse-voice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ transcript, language, today }),
  });

  if (!res.ok) throw new Error('voice_parse_failed');

  const { products: raws } = await res.json() as { products: RawProduct[] };

  return raws.map((r, i) => {
    const category: ProductCategory =
      r.category && VALID_CATEGORIES.includes(r.category) ? r.category : guessCategory(r.name);
    const expirationDateType = r.expirationDateType ?? getDefaultExpirationDateType(category);
    const unit = r.unit && VALID_UNITS.includes(r.unit) ? r.unit : 'unit';

    let expirationDate = r.expirationDate;
    let isEstimatedExpiration = false;
    if (!expirationDate) {
      // 1. Try name-based shelf life table
      const estimated = estimateExpirationDate(r.name);
      if (estimated) {
        expirationDate = estimated;
        isEstimatedExpiration = true;
      } else {
        // 2. Fallback: category-based default
        expirationDate = categoryFallbackDate(category);
        isEstimatedExpiration = true;
      }
    }

    return {
      _draftId: `draft-${Date.now()}-${i}`,
      name: r.name,
      category,
      expirationDate,
      quantity: r.quantity ?? 1,
      unit,
      expirationDateType,
      isEstimatedExpiration,
    };
  });
}
