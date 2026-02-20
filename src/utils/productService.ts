import { supabase } from '../lib/supabase';
import { Product } from '../types/Product';

interface ProductRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  expiration_date: string;
  quantity: number;
  unit: string;
  added_date: string;
  is_estimated_expiration: boolean | null;
  fridge_zone: string | null;
  created_at: string;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    expirationDate: row.expiration_date,
    quantity: row.quantity,
    unit: row.unit,
    addedDate: row.added_date,
    isEstimatedExpiration: row.is_estimated_expiration ?? undefined,
    fridgeZone: row.fridge_zone ?? undefined,
  };
}

function productToInsert(product: Omit<Product, 'id'>, userId: string) {
  return {
    user_id: userId,
    name: product.name,
    category: product.category,
    expiration_date: product.expirationDate,
    quantity: product.quantity,
    unit: product.unit,
    added_date: product.addedDate,
    is_estimated_expiration: product.isEstimatedExpiration ?? null,
    fridge_zone: product.fridgeZone ?? null,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ProductRow[]).map(rowToProduct);
}

export async function insertProduct(
  product: Omit<Product, 'id'>,
  userId: string
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(productToInsert(product, userId))
    .select()
    .single();

  if (error) throw error;
  return rowToProduct(data as ProductRow);
}

export async function updateProduct(product: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name: product.name,
      category: product.category,
      expiration_date: product.expirationDate,
      quantity: product.quantity,
      unit: product.unit,
      added_date: product.addedDate,
      is_estimated_expiration: product.isEstimatedExpiration ?? null,
      fridge_zone: product.fridgeZone ?? null,
    })
    .eq('id', product.id);

  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
