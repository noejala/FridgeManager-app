import { useState, useEffect } from 'react';

const VISIT_COUNT_KEY = 'pwa-visit-count';
const MODAL_DISMISSED_KEY = 'pwa-modal-dismissed';
const BANNER_DISMISSED_KEY = 'pwa-banner-dismissed';

function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function isIOSDevice(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function useInstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const standalone = isStandaloneMode();
  const mobile = isMobileDevice();
  const ios = isIOSDevice();

  useEffect(() => {
    if (!mobile || standalone) return;

    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0') + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    const modalPermanentlyDismissed = localStorage.getItem(MODAL_DISMISSED_KEY) === 'true';
    const bannerDismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';

    if (!modalPermanentlyDismissed) {
      setShowModal(true);
    } else if (!bannerDismissed && count >= 3) {
      setShowBanner(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismissModal = () => {
    setShowModal(false);
  };

  const neverShowModal = () => {
    localStorage.setItem(MODAL_DISMISSED_KEY, 'true');
    setShowModal(false);
  };

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setShowBanner(false);
  };

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      dismissModal();
      dismissBanner();
    }
  };

  return { ios, deferredPrompt, showModal, showBanner, dismissModal, neverShowModal, dismissBanner, triggerInstall };
}
