import { supabase } from '../lib/supabase';
import { UserProfile, DietaryPreference } from '../types/UserProfile';

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .maybeSingle();

  if (error || !data) return null;

  return {
    country: data.country ?? null,
    gender: data.gender ?? null,
    age: data.age ?? null,
    dietaryPreferences: (data.dietary_preferences ?? []) as DietaryPreference[],
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('user_profiles').upsert({
    user_id: user.id,
    country: profile.country,
    gender: profile.gender,
    age: profile.age,
    dietary_preferences: profile.dietaryPreferences,
    updated_at: new Date().toISOString(),
  });
}
