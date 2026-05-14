import { supabase } from '../lib/supabase';
import { UserProfile, DietaryPreference } from '../types/UserProfile';

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .maybeSingle();

  if (error || !data) return null;

  return {
    displayName: data.display_name ?? null,
    firstName: data.first_name ?? null,
    country: data.country ?? null,
    gender: data.gender ?? null,
    age: data.age ?? null,
    dietaryPreferences: (data.dietary_preferences ?? []) as DietaryPreference[],
    dislikedIngredients: (data.disliked_ingredients ?? []) as string[],
    customPreferences: (data.custom_preferences ?? '') as string,
    pantryStaples: (data.pantry_staples ?? []) as string[],
    kitchenEquipment: (data.kitchen_equipment ?? []) as string[],
    usernameChangedAt: data.username_changed_at ?? null,
  };
}

export async function changeUsername(newName: string): Promise<'ok' | 'taken' | 'error'> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'error';

  const { error } = await supabase
    .from('user_profiles')
    .update({
      display_name: newName.trim().toLowerCase(),
      username_changed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    if (error.code === '23505') return 'taken';
    return 'error';
  }
  return 'ok';
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    first_name: profile.firstName,
    country: profile.country,
    gender: profile.gender,
    age: profile.age,
    dietary_preferences: profile.dietaryPreferences,
    disliked_ingredients: profile.dislikedIngredients,
    custom_preferences: profile.customPreferences,
    pantry_staples: profile.pantryStaples,
    kitchen_equipment: profile.kitchenEquipment,
    updated_at: new Date().toISOString(),
  });
}

export async function setupUserIdentity(displayName: string): Promise<string> {
  const { data, error } = await supabase.rpc('setup_user_identity', { p_display_name: displayName });
  if (error) throw error;
  return data as string;
}
