import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setupUserIdentity } from '../utils/userProfileService';
import './UsernameSetup.css';

interface Props {
  onComplete: (displayName: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function UsernameSetup({ onComplete, darkMode, onToggleDarkMode }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!USERNAME_REGEX.test(trimmed)) {
      setError(t('auth.usernameInvalid'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await setupUserIdentity(trimmed);
      onComplete(trimmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('USERNAME_TAKEN')) setError(t('auth.usernameTaken'));
      else if (msg.includes('USERNAME_INVALID')) setError(t('auth.usernameInvalid'));
      else setError(t('auth.anErrorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-setup-container">
      <div className="username-setup-card">
        <button
          className="username-setup-theme"
          onClick={onToggleDarkMode}
          title={darkMode ? t('app.lightMode') : t('app.darkMode')}
        >
          {darkMode ? '☀' : '☾'}
        </button>

        <h1 className="username-setup-title">Fridge <span>Manager</span></h1>
        <h2 className="username-setup-heading">{t('auth.usernameSetupTitle')}</h2>
        <p className="username-setup-subtitle">{t('auth.usernameSetupSubtitle')}</p>

        <form className="username-setup-form" onSubmit={handleSubmit}>
          <div className="username-setup-field">
            <label htmlFor="username-input">{t('auth.username')}</label>
            <div className="username-setup-input-row">
              <span className="username-setup-at">@</span>
              <input
                id="username-input"
                type="text"
                value={value}
                onChange={e => { setValue(e.target.value); setError(null); }}
                placeholder={t('auth.usernamePlaceholder')}
                maxLength={20}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
              />
            </div>
            <span className="username-setup-hint">{t('auth.usernameHint')}</span>
          </div>

          {error && <p className="username-setup-error">{error}</p>}

          <button
            type="submit"
            className="username-setup-submit"
            disabled={loading || value.trim().length < 3}
          >
            {loading ? t('auth.pleaseWait') : t('auth.usernameSetupConfirm')}
          </button>
        </form>
      </div>
    </div>
  );
}
