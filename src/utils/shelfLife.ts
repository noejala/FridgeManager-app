// Days a product lasts after opening
const SHELF_LIFE_AFTER_OPENING: Record<string, number> = {
  // Dairy & drinks
  lait: 4, milk: 4,
  'lait végétal': 5, 'oat milk': 5, 'almond milk': 5, 'soy milk': 5,
  'crème liquide': 3, 'heavy cream': 3, 'whipping cream': 3,
  'lait de coco': 4, 'coconut milk': 4,
  jus: 5, juice: 5,
  // Sauces & condiments
  mayo: 30, mayonnaise: 30,
  ketchup: 30,
  moutarde: 60, mustard: 60,
  soja: 90, soy: 90, worcestershire: 180,
  pesto: 7,
  bolognaise: 4, bolognese: 4,
  tomate: 5, 'tomato sauce': 5, 'sauce tomate': 5,
  vinaigrette: 21,
  sriracha: 180, tabasco: 180, harissa: 30,
  houmous: 7, hummus: 7,
  salsa: 10,
  tahini: 60,
  tapenade: 14,
  confiture: 30, jam: 30,
  miel: 365, honey: 365,
  sirop: 365, syrup: 365,
};

const OPENABLE_DAIRY_KEYWORDS = ['lait', 'milk', 'crème liquide', 'heavy cream', 'whipping cream', 'lait de coco', 'coconut milk', 'jus', 'juice'];

export function isOpenableProduct(name: string, category: string): boolean {
  if (category === 'Sauces') return true;
  const lower = name.toLowerCase().trim();
  return OPENABLE_DAIRY_KEYWORDS.some(k => lower.includes(k));
}

export function estimateExpirationFromOpenDate(name: string, openedDate: string): string {
  const lowerName = name.toLowerCase().trim();
  let days = 14; // default
  for (const [keyword, d] of Object.entries(SHELF_LIFE_AFTER_OPENING)) {
    if (lowerName.includes(keyword)) {
      days = d;
      break;
    }
  }
  const date = new Date(openedDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

const PRODUCT_SHELF_LIFE: Record<string, number> = {
  banana: 5,
  apple: 21,
  milk: 7,
  cheese: 30,
  yogurt: 14,
  chicken: 3,
  beef: 5,
  salmon: 2,
  bread: 5,
  eggs: 28,
  butter: 30,
  cream: 10,
  ham: 7,
  lettuce: 5,
  tomato: 7,
  carrot: 21,
  orange: 14,
  lemon: 21,
  strawberry: 3,
};

export function isProductRecognized(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return Object.keys(PRODUCT_SHELF_LIFE).some(k => lower.includes(k));
}

export function estimateExpirationDate(name: string, purchaseDate?: string): string | null {
  const lowerName = name.toLowerCase().trim();

  let days: number | undefined;
  for (const [keyword, d] of Object.entries(PRODUCT_SHELF_LIFE)) {
    if (lowerName.includes(keyword)) {
      days = d;
      break;
    }
  }

  if (days === undefined) return null;

  const date = purchaseDate ? new Date(purchaseDate) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
