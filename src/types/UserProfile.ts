export type DietaryPreference =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'lactose_free'
  | 'halal'
  | 'kosher'
  | 'pescatarian';

export interface UserProfile {
  country: string | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  age: number | null;
  dietaryPreferences: DietaryPreference[];
}
