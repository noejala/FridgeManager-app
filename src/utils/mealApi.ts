export function singularize(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ves')) return w.slice(0, -3) + 'f';
  if (w.endsWith('oes')) return w.slice(0, -2);
  if (w.endsWith('ses') || w.endsWith('shes') || w.endsWith('ches') || w.endsWith('xes') || w.endsWith('zes'))
    return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export interface MealDetails {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  area: string;
  instructions: string;
  ingredients: { name: string; measure: string }[];
  course?: 'starter' | 'main' | 'dessert';
}

