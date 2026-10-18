import type { VercelRequest, VercelResponse } from '@vercel/node';
import { streamText, Output } from 'ai';
import type { GatewayProviderOptions } from '@ai-sdk/gateway';
import { recipeRequestSchema, recipeSchema, buildRecipePrompt, recipeCount } from './_lib/recipePrompt';
import { supabaseUrl, anonKey, bearerToken, getUserId } from './_lib/auth';

// Primary model + ordered fallbacks, tried by the AI Gateway when a model errors
// or is unavailable. Override with AI_RECIPE_MODELS="model1,model2,..." in Vercel.
const DEFAULT_MODELS = ['google/gemma-4-31b-it', 'mistral/mistral-small', 'anthropic/claude-haiku-5.5'];
const MODELS = (process.env.AI_RECIPE_MODELS?.split(',').map(s => s.trim()).filter(Boolean)) || DEFAULT_MODELS;

// Counts this generation against the user's daily quota (see consume_ai_quota RPC).
async function consumeQuota(token: string): Promise<boolean> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey!, 'Content-Type': 'application/json' },
    body: '{}',
  });
  return res.ok && (await res.json()) === true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = bearerToken(req);
  const userId = await getUserId(token);
  if (!token || !userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = recipeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const params = parsed.data;
  if (params.productNames.length === 0) {
    return res.status(400).json({ error: 'No products' });
  }

  if (!(await consumeQuota(token))) {
    return res.status(429).json({ error: 'quota_exceeded' });
  }

  const [primary, ...fallbacks] = MODELS;
  const { elementStream } = streamText({
    model: primary,
    output: Output.array({ element: recipeSchema, maxItems: recipeCount(params) }),
    prompt: buildRecipePrompt(params),
    maxOutputTokens: 6000,
    providerOptions: {
      gateway: { models: fallbacks, user: userId, tags: ['recipes'] } satisfies GatewayProviderOptions,
    },
    onError({ error }) {
      console.error('[recipes] generation error', error);
    },
  });

  // One complete, schema-validated recipe per NDJSON line, as soon as it's generated,
  // so the first recipe shows up in a couple of seconds instead of after the whole batch.
  let sent = 0;
  try {
    for await (const recipe of elementStream) {
      if (sent === 0) {
        res.status(200);
        res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
      }
      res.write(JSON.stringify(recipe) + '\n');
      sent++;
    }
  } catch (error) {
    console.error('[recipes] stream failed after', sent, 'recipes', error);
  }

  if (sent === 0) {
    return res.status(503).json({ error: 'ai_unavailable' });
  }
  res.end();
}
