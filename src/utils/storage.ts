import { Product } from '../types/Product';

const STORAGE_KEY = 'fridge-products';

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
  }
};

export const loadProducts = (): Product[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    return [];
  }
};

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(expirationDate);
  expiration.setHours(0, 0, 0, 0);
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpired = (expirationDate: string): boolean => {
  return getDaysUntilExpiration(expirationDate) < 0;
};

export const isExpiringSoon = (expirationDate: string, days: number = 3): boolean => {
  const daysUntil = getDaysUntilExpiration(expirationDate);
  return daysUntil >= 0 && daysUntil <= days;
};

