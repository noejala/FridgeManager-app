const STORAGE_KEYS = {
  recipes: 'ai-prompt-recipes',
  funFacts: 'ai-prompt-funfacts',
} as const;

type PromptKey = keyof typeof STORAGE_KEYS;

export const PROMPT_DEFAULTS: Record<PromptKey, string> = {
  recipes: `You are a creative chef. I have these ingredients available: {{ingredients}}.
Suggest {{count}} delicious, coherent recipes. For each recipe, use whichever ingredients naturally belong together — use all of them if it makes culinary sense, or just a few. Never force an ingredient into a recipe just because it's available. Taste and coherence always come first. The user always has these pantry staples at home: {{pantry}}.`,
  funFacts: `Give me 3 surprising fun facts about {{product}} (the food/ingredient). Each fact must be a single short sentence of max 12 words. Be punchy and direct.`,
};

export function getPrompt(key: PromptKey): string {
  return localStorage.getItem(STORAGE_KEYS[key]) ?? PROMPT_DEFAULTS[key];
}

export function savePrompt(key: PromptKey, value: string): void {
  const trimmed = value.trim();
  if (trimmed === PROMPT_DEFAULTS[key].trim()) {
    localStorage.removeItem(STORAGE_KEYS[key]);
  } else {
    localStorage.setItem(STORAGE_KEYS[key], trimmed);
  }
}

export function resetPrompt(key: PromptKey): void {
  localStorage.removeItem(STORAGE_KEYS[key]);
}
