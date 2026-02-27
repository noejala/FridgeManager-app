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
