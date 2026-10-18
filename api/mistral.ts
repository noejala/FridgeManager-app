import type { VercelRequest, VercelResponse } from '@vercel/node';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
// The recipe prompt is ~3-4k chars even with a full fridge; anything far bigger is abuse.
const MAX_PROMPT_CHARS = 12000;

// Only signed-in Freego users may spend the Mistral key: the bearer token must be
// a live Supabase session for this project.
async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !anonKey) return false;

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  });
  return res.ok;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!(await isAuthenticated(req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Mistral API key not configured' });
  }

  const { prompt } = req.body as { prompt?: string };
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return res.status(413).json({ error: 'Prompt too long' });
  }

  const mistralRes = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const data = await mistralRes.json();

  if (!mistralRes.ok) {
    return res.status(mistralRes.status).json(data);
  }

  return res.status(200).json(data);
}
