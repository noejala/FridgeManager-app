export interface Product {
  id: string;
  name: string;
  category: string;
  expirationDate: string; // Format: YYYY-MM-DD
  quantity: number;
  unit: string; // 'unité', 'kg', 'L', etc.
  addedDate: string; // Format: YYYY-MM-DD
  isEstimatedExpiration?: boolean;
  expirationDateType?: 'dlc' | 'ddm'; // DLC = date limite (safety), DDM = de préférence avant (quality)
  fridgeZone?: string;
  consumedAt?: string; // ISO timestamp, set when product is marked as consumed
  openedDate?: string; // YYYY-MM-DD, set when a sauce/condiment is opened
  imageUrl?: string; // product photo from Open Food Facts, stored as URL
}

export type ProductCategory =
  | 'Fruits'
  | 'Vegetables'
  | 'Meat'
  | 'Fish'
  | 'Dairy'
  | 'Cheese'
  | 'Butter'
  | 'Beverages'
  | 'Sauces'
  | 'Prepared'
  | 'Milk'
  | 'Juice'
  | 'Cream'
  | 'Other';

