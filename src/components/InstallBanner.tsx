import { useTranslation } from 'react-i18next';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import './InstallBanner.css';

export function InstallBanner() {
  const { t } = useTranslation();
  const { ios, deferredPrompt, showModal, showBanner, dismissModal, neverShowModal, dismissBanner, triggerInstall } = useInstallPrompt();

  if (showModal) {
    return (
      <div className="install-overlay" onClick={dismissModal}>
        <div className="install-modal" onClick={e => e.stopPropagation()}>
          <button className="install-close" onClick={dismissModal} aria-label="Fermer">×</button>
          <div className="install-icon">📱</div>
          <h2 className="install-title">{t('install.modalTitle')}</h2>
          <p className="install-desc">{t('install.modalDesc')}</p>

          {ios ? (
            <div className="install-steps">
              <div className="install-step">
                <span className="install-step-num">1</span>
                <span dangerouslySetInnerHTML={{ __html: t('install.iosStep1') }} />
              </div>
              <div className="install-step">
                <span className="install-step-num">2</span>
                <span dangerouslySetInnerHTML={{ __html: t('install.iosStep2') }} />
              </div>
              <div className="install-step">
                <span className="install-step-num">3</span>
                <span>{t('install.iosStep3')}</span>
              </div>
            </div>
          ) : deferredPrompt ? (
            <button className="install-btn" onClick={triggerInstall}>
              {t('install.installBtn')}
            </button>
          ) : (
            <div className="install-steps">
              <div className="install-step">
                <span className="install-step-num">1</span>
                <span>{t('install.androidStep1')}</span>
              </div>
              <div className="install-step">
                <span className="install-step-num">2</span>
                <span>{t('install.androidStep2')}</span>
              </div>
            </div>
          )}

          <div className="install-footer">
            <button className="install-later" onClick={dismissModal}>{t('install.later')}</button>
            <button className="install-never" onClick={neverShowModal}>{t('install.never')}</button>
          </div>
        </div>
      </div>
    );
  }

  if (showBanner) {
    return (
      <div className="install-banner">
        <span className="install-banner-text">
          {ios
            ? t('install.bannerIos')
            : deferredPrompt
              ? t('install.bannerAndroid')
              : t('install.bannerAndroidManual')}
        </span>
        {deferredPrompt && !ios && (
          <button className="install-banner-btn" onClick={triggerInstall}>
            {t('install.installBtn')}
          </button>
        )}
        <button className="install-banner-close" onClick={dismissBanner} aria-label="Fermer">×</button>
      </div>
    );
  }

  return null;
}
