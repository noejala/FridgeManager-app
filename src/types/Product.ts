export interface Product {
  id: string;
  name: string;
  category: string;
  expirationDate: string; // Format: YYYY-MM-DD
  quantity: number;
  unit: string; // 'unité', 'kg', 'L', etc.
  addedDate: string; // Format: YYYY-MM-DD
}

export type ProductCategory = 
  | 'Fruits'
  | 'Légumes'
  | 'Viande'
  | 'Poisson'
  | 'Produits laitiers'
  | 'Boissons'
  | 'Surgelés'
  | 'Autre';

