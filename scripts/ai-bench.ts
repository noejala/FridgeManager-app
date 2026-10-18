// Compare AI Gateway models on the real recipe prompt.
// Usage: node --env-file=.env.local scripts/ai-bench.ts [model ...]
// Prints time-to-first-recipe, total time, recipe count and cost per model, and writes
// every generated recipe to scripts/ai-bench-output.json for a quality read-through.
import { writeFileSync } from 'node:fs';
import { streamText, Output } from 'ai';
import { recipeRequestSchema, recipeSchema, buildRecipePrompt, recipeCount } from '../api/_lib/recipePrompt.ts';

const MODELS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : [
  'google/gemma-4-31b-it',
  'mistral/mistral-small',
  'anthropic/claude-haiku-5.5',
  'google/gemini-3.1-flash-lite',
];

const FRIDGES = [
  { label: 'quick-main FR', req: { productNames: ['chicken', 'zucchini', 'tomato', 'onion', 'cream', 'rice'], language: 'fr', cookingMode: 'quick', courseSelection: 'main', expiringNames: ['zucchini'] } },
  { label: 'empty-fridge EN', req: { productNames: ['eggs', 'cheese', 'spinach', 'mushrooms', 'ham', 'milk', 'potatoes'], language: 'en', cookingMode: 'empty_fridge', courseSelection: 'main' } },
  { label: 'full menu FR', req: { productNames: ['salmon', 'avocado', 'lemon', 'apples', 'butter', 'eggs', 'flour', 'carrots'], language: 'fr', cookingMode: 'quick', courseSelection: 'all' } },
  { label: 'tiny fridge FR', req: { productNames: ['yogurt', 'banana'], language: 'fr', cookingMode: 'quick', courseSelection: 'dessert' } },
] as const;

const pricing: Record<string, { input: number; output: number }> = {};
const catalog = await fetch('https://ai-gateway.vercel.sh/v1/models').then(r => r.json()) as { data: { id: string; pricing?: { input: string; output: string } }[] };
for (const m of catalog.data) {
  if (m.pricing) pricing[m.id] = { input: Number(m.pricing.input), output: Number(m.pricing.output) };
}

const results: unknown[] = [];
for (const model of MODELS) {
  for (const fridge of FRIDGES) {
    const req = recipeRequestSchema.parse(fridge.req);
    const t0 = performance.now();
    let firstMs: number | null = null;
    const recipes: unknown[] = [];
    try {
      const result = streamText({
        model,
        output: Output.array({ element: recipeSchema, maxItems: recipeCount(req) }),
        prompt: buildRecipePrompt(req),
        maxOutputTokens: 6000,
      });
      for await (const recipe of result.elementStream) {
        firstMs ??= performance.now() - t0;
        recipes.push(recipe);
      }
      const usage = await result.usage;
      const p = pricing[model];
      const cost = p ? (usage.inputTokens ?? 0) * p.input + (usage.outputTokens ?? 0) * p.output : NaN;
      const totalMs = performance.now() - t0;
      console.log(`${model.padEnd(30)} ${fridge.label.padEnd(16)} first ${(firstMs! / 1000).toFixed(1)}s  total ${(totalMs / 1000).toFixed(1)}s  ${recipes.length} recipes  ${(cost * 100).toFixed(3)}¢`);
      results.push({ model, fridge: fridge.label, firstMs, totalMs, cost, usage, recipes });
    } catch (e) {
      console.log(`${model.padEnd(30)} ${fridge.label.padEnd(16)} FAILED: ${(e as Error).message.slice(0, 120)}`);
      results.push({ model, fridge: fridge.label, error: (e as Error).message, recipes });
    }
  }
}

writeFileSync(new URL('./ai-bench-output.json', import.meta.url), JSON.stringify(results, null, 2));
console.log('\nFull output: scripts/ai-bench-output.json');
