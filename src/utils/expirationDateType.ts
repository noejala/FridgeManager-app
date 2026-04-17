import { ProductCategory } from '../types/Product';

/**
 * DLC categories: strict use-by date (food safety concern)
 * Everything else: DDM / best-before (quality concern)
 */
const DLC_CATEGORIES: ProductCategory[] = ['Meat', 'Fish', 'Dairy', 'Milk', 'Cream'];

export function getDefaultExpirationDateType(cat: ProductCategory): 'dlc' | 'ddm' {
  return DLC_CATEGORIES.includes(cat) ? 'dlc' : 'ddm';
}
