import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseVoiceTranscript, DraftProduct } from '../utils/voiceParser';
import './VoiceInput.css';

interface VoiceInputProps {
  onDraftReady: (drafts: DraftProduct[]) => void;
  onClose: () => void;
}

type Status = 'idle' | 'recording' | 'parsing' | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecognition = any;

export const VoiceInput = ({ onDraftReady, onClose }: VoiceInputProps) => {
  const { i18n, t } = useTranslation();
  const [status, setStatus] = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef<AnyRecognition>(null);
  const finalTranscriptRef = useRef('');
  const statusRef = useRef<Status>('idle');

  statusRef.current = status;

  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setErrorMsg(t('voice.notSupported'));
      setStatus('error');
      return;
    }

    const recognition: AnyRecognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';

    finalTranscriptRef.current = '';
    setTranscript('');

    recognition.onresult = (event: AnyRecognition) => {
      let interim = '';
      let final = finalTranscriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      finalTranscriptRef.current = final;
      setTranscript(final + interim);
    };

    recognition.onerror = (event: AnyRecognition) => {
      if (event.error === 'not-allowed') {
        setErrorMsg(t('voice.micDenied'));
        setStatus('error');
      } else if (event.error !== 'no-speech') {
        setErrorMsg(t('voice.error'));
        setStatus('error');
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording (browser stopped on a pause)
      if (statusRef.current === 'recording') {
        try { recognition.start(); } catch { /* already stopped */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus('recording');
  };

  const stopAndParse = async () => {
    statusRef.current = 'parsing'; // prevent onend from auto-restarting
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const text = finalTranscriptRef.current.trim() || transcript.trim();
    if (!text) {
      setStatus('idle');
      return;
    }

    setStatus('parsing');
    try {
      const drafts = await parseVoiceTranscript(text, i18n.language);
      onDraftReady(drafts);
    } catch {
      setErrorMsg(t('voice.parseError'));
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      statusRef.current = 'idle'; // prevent onend from auto-restarting on unmount
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleClose = () => {
    statusRef.current = 'idle'; // prevent onend from auto-restarting
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    onClose();
  };

  const isMicDisabled = status === 'parsing' || status === 'error';

  return (
    <div className="voice-input-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="voice-input-modal">
        <button className="voice-close-btn" onClick={handleClose} aria-label="Fermer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="voice-title">{t('voice.title')}</h2>
        <p className="voice-hint">{t('voice.hint')}</p>

        <div className="voice-mic-area">
          {status === 'parsing' ? (
            <div className="voice-spinner" />
          ) : (
            <button
              className={`voice-mic-btn${status === 'recording' ? ' voice-mic-btn--recording' : ''}`}
              onClick={status === 'recording' ? stopAndParse : startRecording}
              disabled={isMicDisabled}
              aria-label={status === 'recording' ? t('voice.tapToStop') : t('voice.tapToStart')}
            >
              {status === 'recording' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              ) : (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3"/>
                  <path d="M5 10a7 7 0 0 0 14 0"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                  <line x1="8" y1="22" x2="16" y2="22"/>
                </svg>
              )}
            </button>
          )}
        </div>

        <p className="voice-status-label">
          {status === 'idle' && t('voice.tapToStart')}
          {status === 'recording' && t('voice.tapToStop')}
          {status === 'parsing' && t('voice.parsing')}
          {status === 'error' && errorMsg}
        </p>

        {transcript && status !== 'parsing' && (
          <div className="voice-transcript">
            <p>{transcript}</p>
          </div>
        )}

        {status === 'error' && (
          <button
            className="voice-retry-btn"
            onClick={() => { setStatus('idle'); setTranscript(''); setErrorMsg(''); }}
          >
            {t('voice.retry')}
          </button>
        )}
      </div>
    </div>
  );
};
