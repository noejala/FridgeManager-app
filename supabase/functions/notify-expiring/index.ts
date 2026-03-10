import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

webpush.setVapidDetails('mailto:noreply@fridgemanager.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

async function fetchJson(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  return res.json();
}

Deno.serve(async () => {
  const today = new Date().toISOString().split('T')[0];
  const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  // Fetch products expiring within 3 days or already expired
  const products = await fetchJson(
    `products?select=name,expiration_date,user_id&expiration_date=lte.${in3days}`
  );

  // Group by user
  const byUser: Record<string, { name: string; expiration_date: string }[]> = {};
  for (const p of products) {
    if (!byUser[p.user_id]) byUser[p.user_id] = [];
    byUser[p.user_id].push(p);
  }

  const subscriptions = await fetchJson('push_subscriptions?select=user_id,subscription');

  let sent = 0;
  for (const sub of subscriptions) {
    const userProducts = byUser[sub.user_id];
    if (!userProducts || userProducts.length === 0) continue;

    const expired = userProducts.filter(p => p.expiration_date < today);
    const expiringSoon = userProducts.filter(p => p.expiration_date >= today);

    let title = '';
    let body = '';

    if (expired.length > 0 && expiringSoon.length > 0) {
      title = `🚨 ${expired.length} expiré(s), ⏰ ${expiringSoon.length} bientôt`;
      body = [...expired, ...expiringSoon].map(p => p.name).join(', ');
    } else if (expired.length > 0) {
      title = `🚨 ${expired.length} produit(s) expiré(s)`;
      body = expired.map(p => p.name).join(', ');
    } else {
      title = `⏰ ${expiringSoon.length} produit(s) bientôt périmé(s)`;
      body = expiringSoon.map(p => p.name).join(', ');
    }

    try {
      await webpush.sendNotification(
        JSON.parse(sub.subscription),
        JSON.stringify({ title, body, tag: 'fridge-daily', url: '/' })
      );
      sent++;
    } catch (err) {
      // Subscription expired — remove it
      if ((err as { statusCode?: number }).statusCode === 410) {
        await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${sub.user_id}`, {
          method: 'DELETE',
          headers,
        });
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
