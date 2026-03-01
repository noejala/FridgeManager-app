import { useEffect, useRef, useState } from 'react';
import './BarcodeScanner.css';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

type Status = 'requesting' | 'scanning' | 'unsupported' | 'denied' | 'error';

type BarcodeDetectorInstance = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};

function createBarcodeDetector(): BarcodeDetectorInstance | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BD = (window as any).BarcodeDetector;
  if (!BD) return null;
  try {
    return new BD({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
  } catch {
    return null;
  }
}

export const BarcodeScanner = ({ onDetected, onClose }: Props) => {
  const [status, setStatus] = useState<Status>('requesting');
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    const detector = createBarcodeDetector();
    if (!detector) {
      setStatus('unsupported');
      return;
    }

    let active = true;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('scanning');

        intervalRef.current = setInterval(async () => {
          if (detectedRef.current || !videoRef.current) return;
          if (videoRef.current.readyState < 2) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0 && !detectedRef.current) {
              detectedRef.current = true;
              onDetected(results[0].rawValue);
            }
          } catch {
            // detect() peut échouer sur certaines frames, on ignore
          }
        }, 400);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      });

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onDetected]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code) onDetected(code);
  };

  const showFallback = status === 'unsupported' || status === 'denied' || status === 'error';

  return (
    <div className="scanner-overlay" onClick={onClose}>
      <div className="scanner-modal" onClick={e => e.stopPropagation()}>
        <div className="scanner-header">
          <h3 className="scanner-title">Scanner un produit</h3>
          <button className="scanner-close" onClick={onClose} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!showFallback && (
          <div className="scanner-viewport">
            <video ref={videoRef} className="scanner-video" autoPlay playsInline muted />
            {status === 'scanning' && (
              <div className="scanner-viewfinder">
                <span className="scanner-corner scanner-corner--tl" />
                <span className="scanner-corner scanner-corner--tr" />
                <span className="scanner-corner scanner-corner--bl" />
                <span className="scanner-corner scanner-corner--br" />
                <div className="scanner-line" />
              </div>
            )}
            {status === 'requesting' && (
              <div className="scanner-placeholder">
                <div className="scanner-spinner" />
                <p>Accès à la caméra…</p>
              </div>
            )}
          </div>
        )}

        {status === 'scanning' && (
          <p className="scanner-hint">Pointez le code-barres vers la caméra</p>
        )}

        {showFallback && (
          <div className="scanner-fallback">
            <div className="scanner-fallback-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/>
                <rect x="3" y="16" width="5" height="5" rx="1"/>
                <path d="M16 16h2v2h-2zM18 18h2v2h-2zM16 20h2"/><path d="M20 16v2"/>
                <path d="M8 4h1M4 8v1M8 16v1M4 12h1M12 4v5M12 12v1M12 16v4M16 12h4"/>
              </svg>
            </div>
            <p className="scanner-fallback-msg">
              {status === 'denied' && 'Accès à la caméra refusé.'}
              {status === 'unsupported' && 'Scan non supporté sur ce navigateur.'}
              {status === 'error' && "Impossible d'accéder à la caméra."}
            </p>
            <p className="scanner-fallback-sub">Saisissez le code-barres manuellement :</p>
            <form onSubmit={handleManualSubmit} className="scanner-manual-form">
              <input
                type="text"
                inputMode="numeric"
                className="scanner-manual-input"
                placeholder="ex. 3017620422003"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="scanner-manual-submit"
                disabled={!manualCode.trim()}
              >
                Rechercher
              </button>
            </form>
          </div>
        )}

        <button className="scanner-cancel" onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
};
