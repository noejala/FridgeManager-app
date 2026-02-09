export interface Product {
  id: string;
  name: string;
  category: string;
  expirationDate: string; // Format: YYYY-MM-DD
  quantity: number;
  unit: string; // 'unité', 'kg', 'L', etc.
  addedDate: string; // Format: YYYY-MM-DD
  isEstimatedExpiration?: boolean;
}

export type ProductCategory = 
  | 'Fruits'
  | 'Vegetables'
  | 'Meat'
  | 'Fish'
  | 'Dairy'
  | 'Beverages'
  | 'Frozen'
  | 'Other';

