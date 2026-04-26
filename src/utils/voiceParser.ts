import { ProductCategory } from '../types/Product';
import { guessCategory } from './categoryMapping';
import { estimateExpirationDate } from './shelfLife';
import { getDefaultExpirationDateType } from './expirationDateType';

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

interface MistralRawProduct {
  name: string;
  quantity: number | null;
  unit: string | null;
  expirationDate: string | null;
  expirationDateType: 'dlc' | 'ddm' | null;
  category: ProductCategory | null;
}

const VALID_CATEGORIES: ProductCategory[] = [
  'Fruits', 'Vegetables', 'Meat', 'Fish', 'Dairy', 'Cheese', 'Butter',
  'Beverages', 'Frozen', 'Sauces', 'Milk', 'Juice', 'Cream', 'Other',
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
  Frozen: 180,
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

export async function parseVoiceTranscript(transcript: string, language: string): Promise<DraftProduct[]> {
  const today = new Date().toISOString().slice(0, 10);
  const isFrench = language.startsWith('fr');
  const categoryList = VALID_CATEGORIES.join(', ');

  const prompt = isFrench
    ? `Tu es un assistant qui extrait des informations sur des produits alimentaires depuis un texte dicté.
Aujourd'hui nous sommes le ${today}.

Texte dicté : "${transcript}"

Extrais TOUS les produits alimentaires mentionnés. Pour chaque produit, retourne :
- name : nom du produit (string, normalise les hésitations, garde la dernière formulation)
- quantity : quantité numérique (number ou null si non précisé)
- unit : l'une de ces valeurs : unit, kg, g, L, cl, ml, pack (string ou null)
- expirationDate : date de péremption au format YYYY-MM-DD (string ou null — résous les dates relatives à partir d'aujourd'hui : "vendredi" = prochain vendredi, "dans 3 jours", "mardi prochain", "la semaine prochaine", etc.)
- expirationDateType : 'dlc' si "à consommer avant" ou "date limite de consommation", 'ddm' si "meilleur avant" ou "de préférence avant" (null si non précisé)
- category : l'une de ces valeurs exactes : ${categoryList}

Retourne UNIQUEMENT un tableau JSON valide sans markdown ni explication :
[{"name":"...","quantity":1,"unit":"unit","expirationDate":"2026-05-01","expirationDateType":"ddm","category":"Dairy"}]`
    : `You are an assistant that extracts food product information from a dictated text.
Today is ${today}.

Dictated text: "${transcript}"

Extract ALL food products mentioned. For each product, return:
- name: product name (string, normalize hesitations, keep the last formulation)
- quantity: numeric quantity (number or null if not mentioned)
- unit: one of these values: unit, kg, g, L, cl, ml, pack (string or null)
- expirationDate: expiration date in YYYY-MM-DD format (string or null — resolve relative dates from today: "next Friday", "in 3 days", "Tuesday", "next week", etc.)
- expirationDateType: 'dlc' if "use by" or "expiry date", 'ddm' if "best before" (null if not specified)
- category: one of these exact values: ${categoryList}

Return ONLY a valid JSON array with no markdown or explanation:
[{"name":"...","quantity":1,"unit":"unit","expirationDate":"2026-05-01","expirationDateType":"ddm","category":"Dairy"}]`;

  const res = await fetch('/api/mistral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) throw new Error('voice_parse_failed');

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('voice_parse_no_json');

  const raws: MistralRawProduct[] = JSON.parse(jsonMatch[0]);

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
