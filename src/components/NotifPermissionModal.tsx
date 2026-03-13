import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './InstallBanner.css';

const DISMISSED_KEY = 'notif-permission-dismissed';
const SNOOZED_KEY = 'notif-permission-snoozed-until';
const SNOOZE_DAYS = 7;

function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isSnoozed(): boolean {
  const until = localStorage.getItem(SNOOZED_KEY);
  if (!until) return false;
  return Date.now() < parseInt(until, 10);
}

interface Props {
  permission: NotificationPermission;
  onRequest: () => Promise<NotificationPermission>;
}

export function NotifPermissionModal({ permission, onRequest }: Props) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true' || isSnoozed()
  );

  if (!isStandaloneMode() || permission !== 'default' || dismissed) return null;

  const handleAllow = async () => {
    await onRequest();
    setDismissed(true);
  };

  const handleLater = () => {
    const until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZED_KEY, String(until));
    setDismissed(true);
  };

  const handleNever = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="install-overlay" onClick={handleLater}>
      <div className="install-modal" onClick={e => e.stopPropagation()}>
        <button className="install-close" onClick={handleLater} aria-label="Fermer">×</button>
        <div className="install-icon">🔔</div>
        <h2 className="install-title">{t('notifications.permModalTitle')}</h2>
        <p className="install-desc">{t('notifications.permModalDesc')}</p>
        <button className="install-btn" onClick={handleAllow}>
          {t('notifications.permAllow')}
        </button>
        <div className="install-footer">
          <button className="install-later" onClick={handleLater}>{t('notifications.permLater')}</button>
          <button className="install-never" onClick={handleNever}>{t('notifications.permNever')}</button>
        </div>
      </div>
    </div>
  );
}
