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

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

export const UserSettings = ({ darkMode, onToggleDarkMode, onLogout }: Props) => {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<UserProfile>({
    country: null,
    gender: null,
    age: null,
    dietaryPreferences: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchUserProfile().then(data => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveUserProfile(profile);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toggleDietary = (pref: DietaryPreference) => {
    setProfile(prev => ({
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
        <h2 className="settings-section-title">{t('settings.profile')}</h2>

        <div className="settings-card">
          <div className="settings-field">
            <label className="settings-label">{t('settings.country')}</label>
            <input
              type="text"
              className="settings-input"
              placeholder={t('settings.countryPlaceholder')}
              value={profile.country ?? ''}
              onChange={e => setProfile(prev => ({ ...prev, country: e.target.value || null }))}
            />
          </div>

          <div className="settings-field-row">
            <div className="settings-field">
              <label className="settings-label">{t('settings.gender')}</label>
              <select
                className="settings-input"
                value={profile.gender ?? ''}
                onChange={e => setProfile(prev => ({
                  ...prev,
                  gender: (e.target.value || null) as UserProfile['gender'],
                }))}
              >
                <option value="">—</option>
                <option value="male">{t('settings.genders.male')}</option>
                <option value="female">{t('settings.genders.female')}</option>
                <option value="other">{t('settings.genders.other')}</option>
                <option value="prefer_not_to_say">{t('settings.genders.prefer_not_to_say')}</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">{t('settings.age')}</label>
              <input
                type="number"
                className="settings-input"
                placeholder="—"
                min={1}
                max={120}
                value={profile.age ?? ''}
                onChange={e => setProfile(prev => ({
                  ...prev,
                  age: e.target.value ? parseInt(e.target.value, 10) : null,
                }))}
              />
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.dietaryPreferences')}</label>
            <div className="settings-chips">
              {DIETARY_OPTIONS.map(pref => (
                <button
                  key={pref}
                  type="button"
                  className={`settings-chip ${profile.dietaryPreferences.includes(pref) ? 'active' : ''}`}
                  onClick={() => toggleDietary(pref)}
                >
                  {t(`settings.dietary.${pref}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-save-row">
            <button
              className="settings-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? `✓ ${t('settings.saved')}` : saving ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
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
