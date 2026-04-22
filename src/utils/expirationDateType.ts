import { ProductCategory } from '../types/Product';

/**
 * DLC categories: strict use-by date (food safety concern)
 * Everything else: DDM / best-before (quality concern)
 */
const DLC_CATEGORIES: ProductCategory[] = ['Meat', 'Fish', 'Dairy', 'Milk', 'Cream'];
// Cheese and Butter are DDM — safe to consume past date, quality concern only

export function getDefaultExpirationDateType(cat: ProductCategory): 'dlc' | 'ddm' {
  return DLC_CATEGORIES.includes(cat) ? 'dlc' : 'ddm';
}
