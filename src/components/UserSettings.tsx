import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, DietaryPreference } from '../types/UserProfile';
import { fetchUserProfile, saveUserProfile } from '../utils/userProfileService';
import './UserSettings.css';

const DIETARY_OPTIONS: DietaryPreference[] = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'lactose_free',
  'halal',
  'kosher',
  'pescatarian',
];

const EMPTY_PROFILE: UserProfile = {
  country: null,
  gender: null,
  age: null,
  dietaryPreferences: [],
};

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export const UserSettings = ({ darkMode, onToggleDarkMode, onLogout }: Props) => {
  const { t, i18n } = useTranslation();

  const [saved, setSaved] = useState<UserProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasData = (p: UserProfile) =>
    p.country || p.age || p.dietaryPreferences.length > 0;

  useEffect(() => {
    fetchUserProfile().then(data => {
      const profile = data ?? EMPTY_PROFILE;
      setSaved(profile);
      setDraft(profile);
      setEditing(!hasData(profile));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveUserProfile(draft);
    setSaved(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(saved);
    setEditing(false);
  };

  const toggleDietary = (pref: DietaryPreference) => {
    setDraft(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  if (loading) return <div className="settings-loading" />;

  return (
    <div className="settings-page">

      {/* Profile section */}
      <section className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">{t('settings.profile')}</h2>
          {!editing && (
            <button className="settings-edit-btn" onClick={() => setEditing(true)}>
              {t('settings.edit')}
            </button>
          )}
        </div>

        <div className="settings-card">
          {editing ? (
            <>
              <div className="settings-field">
                <label className="settings-label">{t('settings.country')}</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder={t('settings.countryPlaceholder')}
                  value={draft.country ?? ''}
                  onChange={e => setDraft(prev => ({ ...prev, country: e.target.value || null }))}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">{t('settings.age')}</label>
                <input
                  type="number"
                  className="settings-input"
                  placeholder="—"
                  min={1}
                  max={120}
                  value={draft.age ?? ''}
                  onChange={e => setDraft(prev => ({
                    ...prev,
                    age: e.target.value ? parseInt(e.target.value, 10) : null,
                  }))}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">{t('settings.dietaryPreferences')}</label>
                <div className="settings-chips">
                  {DIETARY_OPTIONS.map(pref => (
                    <button
                      key={pref}
                      type="button"
                      className={`settings-chip ${draft.dietaryPreferences.includes(pref) ? 'active' : ''}`}
                      onClick={() => toggleDietary(pref)}
                    >
                      {t(`settings.dietary.${pref}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-save-row">
                {hasData(saved) && (
                  <button className="settings-cancel-btn" onClick={handleCancel}>
                    {t('settings.cancel')}
                  </button>
                )}
                <button
                  className="settings-save-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? t('settings.saving') : t('settings.save')}
                </button>
              </div>
            </>
          ) : (
            <div className="settings-view">
              <div className="settings-view-row">
                <span className="settings-view-label">{t('settings.country')}</span>
                <span className="settings-view-value">{saved.country ?? '—'}</span>
              </div>
              <div className="settings-view-row">
                <span className="settings-view-label">{t('settings.age')}</span>
                <span className="settings-view-value">{saved.age ?? '—'}</span>
              </div>
              {saved.dietaryPreferences.length > 0 && (
                <div className="settings-view-row settings-view-row--chips">
                  <span className="settings-view-label">{t('settings.dietaryPreferences')}</span>
                  <div className="settings-chips settings-chips--readonly">
                    {saved.dietaryPreferences.map(pref => (
                      <span key={pref} className="settings-chip active">
                        {t(`settings.dietary.${pref}`)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* App settings section */}
      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.appSettings')}</h2>

        <div className="settings-card">
          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{t('settings.darkMode')}</span>
            </div>
            <button
              className={`settings-toggle-btn ${darkMode ? 'active' : ''}`}
              onClick={onToggleDarkMode}
              aria-pressed={darkMode}
            >
              <span className="settings-toggle-thumb" />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div className="settings-toggle-info">
              <span className="settings-toggle-label">{t('settings.language')}</span>
              <span className="settings-toggle-sub">
                {i18n.language === 'fr' ? 'Français' : 'English'}
              </span>
            </div>
            <button
              className="settings-lang-btn"
              onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')}
            >
              {i18n.language === 'en' ? 'FR' : 'EN'}
            </button>
          </div>
        </div>
      </section>

      {/* Logout section */}
      <section className="settings-section">
        <div className="settings-card">
          <button className="settings-logout-btn" onClick={onLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t('app.signOut')}
          </button>
        </div>
      </section>

    </div>
  );
};
