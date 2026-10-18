import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText, Output } from 'ai';
import type { GatewayProviderOptions } from '@ai-sdk/gateway';
import { z } from 'zod';
import { bearerToken, getUserId } from './_lib/auth';

// Small, fast models are plenty for extracting a grocery list from a sentence.
const MODELS = ['google/gemma-4-31b-it', 'anthropic/claude-haiku-5.5'];

const CATEGORIES = ['Fruits', 'Vegetables', 'Meat', 'Fish', 'Dairy', 'Cheese', 'Butter',
  'Beverages', 'Sauces', 'Prepared', 'Milk', 'Juice', 'Cream', 'Other'] as const;

const requestSchema = z.object({
  transcript: z.string().trim().min(1).max(2000),
  language: z.string().max(10).default('en'),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const productSchema = z.object({
  name: z.string(),
  quantity: z.number().nullable(),
  unit: z.enum(['unit', 'kg', 'g', 'L', 'cl', 'ml', 'pack']).nullable(),
  expirationDate: z.string().nullable().describe('YYYY-MM-DD'),
  expirationDateType: z.enum(['dlc', 'ddm']).nullable(),
  category: z.enum(CATEGORIES).nullable(),
});

function buildPrompt(transcript: string, language: string, today: string) {
  return language.startsWith('fr')
    ? `Tu es un assistant qui extrait des informations sur des produits alimentaires depuis un texte dicté.
Aujourd'hui nous sommes le ${today}.

Texte dicté : "${transcript}"

Extrais TOUS les produits alimentaires mentionnés. Pour chaque produit :
- name : nom du produit (normalise les hésitations, garde la dernière formulation)
- quantity : quantité numérique, null si non précisée
- unit : unité, null si non précisée
- expirationDate : date de péremption YYYY-MM-DD, null si non précisée — résous les dates relatives à partir d'aujourd'hui ("vendredi" = prochain vendredi, "dans 3 jours", "mardi prochain", "la semaine prochaine"…)
- expirationDateType : 'dlc' si "à consommer avant" / "date limite de consommation", 'ddm' si "meilleur avant" / "de préférence avant", null sinon
- category : la catégorie la plus adaptée`
    : `You are an assistant that extracts food product information from a dictated text.
Today is ${today}.

Dictated text: "${transcript}"

Extract ALL food products mentioned. For each product:
- name: product name (normalize hesitations, keep the last formulation)
- quantity: numeric quantity, null if not mentioned
- unit: unit, null if not mentioned
- expirationDate: expiration date YYYY-MM-DD, null if not mentioned — resolve relative dates from today ("next Friday", "in 3 days", "Tuesday", "next week"…)
- expirationDateType: 'dlc' for "use by" / "expiry date", 'ddm' for "best before", null otherwise
- category: the best matching category`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getUserId(bearerToken(req));
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const { transcript, language, today } = parsed.data;

  try {
    const [primary, ...fallbacks] = MODELS;
    const { output } = await generateText({
      model: primary,
      output: Output.array({ element: productSchema, maxItems: 40 }),
      prompt: buildPrompt(transcript, language, today),
      maxOutputTokens: 3000,
      providerOptions: {
        gateway: { models: fallbacks, user: userId, tags: ['voice'] } satisfies GatewayProviderOptions,
      },
    });
    return res.status(200).json({ products: output });
  } catch (error) {
    console.error('[parse-voice] failed', error);
    return res.status(503).json({ error: 'ai_unavailable' });
  }
}
