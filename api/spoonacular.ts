import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Spoonacular API key not configured' });
  }

  const query = req.query.query as string | undefined;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  const url = `https://api.spoonacular.com/food/ingredients/search?query=${encodeURIComponent(query)}&number=1&apiKey=${apiKey}`;
  const spoonRes = await fetch(url);
  const data = await spoonRes.json() as { results?: { image?: string }[] };

  if (!spoonRes.ok) {
    return res.status(spoonRes.status).json(data);
  }

  const image = data.results?.[0]?.image;
  if (!image) {
    return res.status(404).json({ error: 'No image found' });
  }

  return res.status(200).json({
    imageUrl: `https://spoonacular.com/cdn/ingredients_100x100/${image}`,
  });
}
