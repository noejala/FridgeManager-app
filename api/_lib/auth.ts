import type { VercelRequest } from '@vercel/node';

export const supabaseUrl = process.env.VITE_SUPABASE_URL;
export const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

export function bearerToken(req: VercelRequest): string | null {
  return req.headers.authorization?.replace(/^Bearer\s+/i, '') || null;
}

// Resolves the caller's Supabase user id from their session token (null if invalid).
// Only signed-in Freego users may spend AI Gateway credits.
export async function getUserId(token: string | null): Promise<string | null> {
  if (!token || !supabaseUrl || !anonKey) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
  });
  if (!res.ok) return null;
  const user = await res.json() as { id?: string };
  return user.id ?? null;
}
