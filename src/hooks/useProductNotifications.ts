import { useState, useCallback } from 'react';
import { Product } from '../types/Product';
import { getDaysUntilExpiration } from '../utils/storage';

const LAST_CHECKED_KEY = 'notificationsLastChecked';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const isSupported = 'Notification' in window;

export function useProductNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
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
