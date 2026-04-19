import { supabase } from '../lib/supabase';
import { MealDetails } from './mealApi';

export interface SavedRecipe {
  id: string;
  recipeData: MealDetails;
  source: 'mistral' | 'gemini' | 'mealdb'; // 'gemini' kept for backward compat with existing saved recipes
  savedAt: string;
}

interface SavedRecipeRow {
  id: string;
  user_id: string;
  recipe_data: MealDetails;
  source: 'mistral' | 'gemini' | 'mealdb'; // 'gemini' kept for backward compat with existing saved recipes
  saved_at: string;
}

function rowToSavedRecipe(row: SavedRecipeRow): SavedRecipe {
  return {
    id: row.id,
    recipeData: row.recipe_data,
    source: row.source,
    savedAt: row.saved_at,
  };
}

export async function fetchSavedRecipes(): Promise<SavedRecipe[]> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('*')
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data as SavedRecipeRow[]).map(rowToSavedRecipe);
}

export async function saveRecipe(meal: MealDetails, source: 'mistral' | 'mealdb'): Promise<SavedRecipe> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('saved_recipes')
    .insert({ user_id: user.id, recipe_data: meal, source })
    .select()
    .single();
  if (error) throw error;
  return rowToSavedRecipe(data as SavedRecipeRow);
}

export async function unsaveRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('saved_recipes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
