import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import './BarcodeScanner.css';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

type Status = 'requesting' | 'scanning' | 'denied' | 'error';

const HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ]],
]);

export const BarcodeScanner = ({ onDetected, onClose }: Props) => {
  const [status, setStatus] = useState<Status>('requesting');
  const [manualCode, setManualCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const detectedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  const handleRetry = () => {
    detectedRef.current = false;
    setTorchOn(false);
    setStatus('requesting');
    setRetryCount(c => c + 1);
  };

  useEffect(() => {
    if (!videoRef.current) return;
    let active = true;

    const reader = new BrowserMultiFormatReader(HINTS);

    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            advanced: [{ focusMode: 'continuous' }] as any,
          },
        },
        videoRef.current,
        (result) => {
          if (!active || detectedRef.current) return;
          if (result) {
            detectedRef.current = true;
            onDetected(result.getText());
          }
        }
      )
      .then((controls) => {
        if (!active) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus('scanning');

        // Check torch support from the video track
        const stream = videoRef.current?.srcObject as MediaStream | null;
        streamRef.current = stream;
        const track = stream?.getVideoTracks()[0];
        if (track) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const caps = (track.getCapabilities as any)?.();
          if (caps?.torch) setTorchSupported(true);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const name = err instanceof Error ? err.name : '';
        if (name === 'NotAllowedError') {
          setStatus('denied');
        } else {
          setStatus('error');
        }
      });

    return () => {
      active = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
      streamRef.current = null;
    };
  }, [onDetected, retryCount]);

  const toggleTorch = async () => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (track.applyConstraints as any)({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      // torch not supported on this device
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (code) onDetected(code);
  };

  const showFallback = status === 'denied' || status === 'error';

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
              <>
                <div className="scanner-viewfinder">
                  <span className="scanner-corner scanner-corner--tl" />
                  <span className="scanner-corner scanner-corner--tr" />
                  <span className="scanner-corner scanner-corner--bl" />
                  <span className="scanner-corner scanner-corner--br" />
                  <div className="scanner-line" />
                </div>
                <div className="scanner-hint">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3z"/>
                  </svg>
                  Pointez le code-barres vers la caméra
                </div>
                {torchSupported && (
                  <button
                    className={`scanner-torch${torchOn ? ' scanner-torch--on' : ''}`}
                    onClick={toggleTorch}
                    aria-label={torchOn ? 'Éteindre le flash' : 'Allumer le flash'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="12" height="5" rx="2"/>
                      <rect x="9" y="9" width="6" height="10" rx="1"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="8" y1="2" x2="9" y2="4"/>
                      <line x1="16" y1="2" x2="15" y2="4"/>
                      <line x1="5" y1="6" x2="6" y2="6"/>
                      <line x1="19" y1="6" x2="18" y2="6"/>
                    </svg>
                  </button>
                )}
              </>
            )}
            {status === 'requesting' && (
              <div className="scanner-placeholder">
                <div className="scanner-spinner" />
                <p>Accès à la caméra…</p>
              </div>
            )}
          </div>
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
              {status === 'error' && "Impossible d'accéder à la caméra."}
            </p>
            <button className="scanner-retry" onClick={handleRetry}>
              Réessayer
            </button>
            <p className="scanner-fallback-sub">Ou saisissez le code-barres manuellement :</p>
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
