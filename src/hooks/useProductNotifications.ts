import { useState, useCallback } from 'react';
import { Product } from '../types/Product';
import { getDaysUntilExpiration } from '../utils/storage';
import { supabase } from '../lib/supabase';

const LAST_CHECKED_KEY = 'notificationsLastChecked';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const isSupported = 'Notification' in window;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function savePushSubscription(subscription: PushSubscription) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, subscription: JSON.stringify(subscription) },
    { onConflict: 'user_id' }
  );
}

async function subscribeToPush(): Promise<void> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
    });
  }
  await savePushSubscription(subscription);
}

export function useProductNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      subscribeToPush().catch(console.error);
    }
    return result;
  }, []);

  const checkAndNotify = useCallback((products: Product[], t: TFunction) => {
    if (!isSupported || Notification.permission !== 'granted') return;

    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(LAST_CHECKED_KEY) === today) return;
    localStorage.setItem(LAST_CHECKED_KEY, today);

    const expired = products.filter(p => getDaysUntilExpiration(p.expirationDate) < 0);
    const expiringSoon = products.filter(p => {
      const days = getDaysUntilExpiration(p.expirationDate);
      return days >= 0 && days <= 3;
    });

    if (expired.length > 0) {
      new Notification(t('notifications.expiredTitle', { count: expired.length }), {
        body: expired.map(p => p.name).join(', '),
        icon: '/favicon.ico',
        tag: 'fridge-expired',
      });
    }

    if (expiringSoon.length > 0) {
      new Notification(t('notifications.expiringSoonTitle', { count: expiringSoon.length }), {
        body: expiringSoon
          .map(p => {
            const days = getDaysUntilExpiration(p.expirationDate);
            const label = days === 0 ? t('notifications.today') : `${days}j`;
            return `${p.name} (${label})`;
          })
          .join(', '),
        icon: '/favicon.ico',
        tag: 'fridge-expiring-soon',
      });
    }
  }, []);

  return { permission, requestPermission, checkAndNotify };
}
