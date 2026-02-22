import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './Auth.css';

interface AuthProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Auth({ darkMode, onToggleDarkMode }: AuthProps) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          setError(t('auth.passwordsNoMatch'));
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg(t('auth.accountCreated'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-controls">
          <button
            className="auth-theme-toggle"
            onClick={onToggleDarkMode}
            title={darkMode ? t('app.lightMode') : t('app.darkMode')}
          >
            {darkMode ? '☀' : '☾'}
          </button>
          <button
            className="auth-theme-toggle"
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
            title="Switch language"
          >
            {i18n.language === 'en' ? 'FR' : 'EN'}
          </button>
        </div>
        <h1 className="auth-title">Fridge <span>Manager</span></h1>
        <p className="auth-subtitle">
          {mode === 'login' ? t('auth.signInToAccount') : t('auth.createNewAccount')}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="auth-email">{t('auth.email')}</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">{t('auth.password')}</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">{t('auth.confirmPassword')}</label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}
          {successMsg && <p className="auth-success">{successMsg}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t('auth.pleaseWait') : mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'login' ? t('auth.noAccount') : t('auth.alreadyAccount')}
          {' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMsg(null); setConfirmPassword(''); }}
          >
            {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}
