export interface Product {
  id: string;
  name: string;
  category: string;
  expirationDate: string; // Format: YYYY-MM-DD
  quantity: number;
  unit: string; // 'unité', 'kg', 'L', etc.
  addedDate: string; // Format: YYYY-MM-DD
  isEstimatedExpiration?: boolean;
  fridgeZone?: string;
  consumedAt?: string; // ISO timestamp, set when product is marked as consumed
  openedDate?: string; // YYYY-MM-DD, set when a sauce/condiment is opened
}

export type ProductCategory =
  | 'Fruits'
  | 'Vegetables'
  | 'Meat'
  | 'Fish'
  | 'Dairy'
  | 'Beverages'
  | 'Frozen'
  | 'Sauces'
  | 'Other';

