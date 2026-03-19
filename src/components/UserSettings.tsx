import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, DietaryPreference } from '../types/UserProfile';
import { fetchUserProfile, saveUserProfile } from '../utils/userProfileService';
import './UserSettings.css';

const DIETARY_RESTRICTIONS: DietaryPreference[] = ['gluten_free', 'lactose_free', 'halal', 'kosher'];
const DIETARY_PREFERENCES: DietaryPreference[] = ['vegetarian', 'vegan', 'pescatarian'];

const EMPTY_PROFILE: UserProfile = {
  country: null,
  gender: null,
  age: null,
  dietaryPreferences: [],
  dislikedIngredients: [],
};

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onDietaryPreferencesChange?: (prefs: DietaryPreference[]) => void;
  onDislikedIngredientsChange?: (items: string[]) => void;
}

export const UserSettings = ({ darkMode, onToggleDarkMode, onLogout, onDietaryPreferencesChange, onDislikedIngredientsChange }: Props) => {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dislikedInput, setDislikedInput] = useState('');

  const hasProfileData = (p: UserProfile) => p.country || p.age;

  useEffect(() => {
    fetchUserProfile().then(data => {
      const p = data ?? EMPTY_PROFILE;
      setProfile(p);
      setDraft(p);
      setEditing(!hasProfileData(p));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveUserProfile(draft);
    setProfile(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const handleAddDisliked = async (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || profile.dislikedIngredients.includes(trimmed)) return;
    const updated = { ...profile, dislikedIngredients: [...profile.dislikedIngredients, trimmed] };
    setProfile(updated);
    setDraft(updated);
    setDislikedInput('');
    onDislikedIngredientsChange?.(updated.dislikedIngredients);
    await saveUserProfile(updated);
  };

  const handleRemoveDisliked = async (item: string) => {
    const updated = { ...profile, dislikedIngredients: profile.dislikedIngredients.filter(i => i !== item) };
    setProfile(updated);
    setDraft(updated);
    onDislikedIngredientsChange?.(updated.dislikedIngredients);
    await saveUserProfile(updated);
  };

  const handleDietaryToggle = async (pref: DietaryPreference) => {
    const newPrefs = profile.dietaryPreferences.includes(pref)
      ? profile.dietaryPreferences.filter(p => p !== pref)
      : [...profile.dietaryPreferences, pref];
    const updated = { ...profile, dietaryPreferences: newPrefs };
    setProfile(updated);
    setDraft(updated);
    onDietaryPreferencesChange?.(newPrefs);
    await saveUserProfile(updated);
  };

  if (loading) return <div className="settings-loading" />;

  return (
    <div className="settings-page">

      {/* Mon profil */}
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

              <div className="settings-save-row">
                {hasProfileData(profile) && (
                  <button className="settings-cancel-btn" onClick={handleCancel}>
                    {t('settings.cancel')}
                  </button>
                )}
                <button className="settings-save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? t('settings.saving') : t('settings.save')}
                </button>
              </div>
            </>
          ) : (
            <div className="settings-view">
              <div className="settings-view-row">
                <span className="settings-view-label">{t('settings.country')}</span>
                <span className="settings-view-value">{profile.country ?? '—'}</span>
              </div>
              <div className="settings-view-row">
                <span className="settings-view-label">{t('settings.age')}</span>
                <span className="settings-view-value">{profile.age ?? '—'}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Préférences nutritionnelles */}
      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.nutritionalPreferences')}</h2>

        <div className="settings-card">
          <div className="settings-field">
            <label className="settings-label">{t('settings.dietaryRestrictions')}</label>
            <div className="settings-chips">
              {DIETARY_RESTRICTIONS.map(pref => (
                <button
                  key={pref}
                  type="button"
                  className={`settings-chip ${profile.dietaryPreferences.includes(pref) ? 'active' : ''}`}
                  onClick={() => handleDietaryToggle(pref)}
                >
                  {t(`settings.dietary.${pref}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.dietaryPreferences')}</label>
            <div className="settings-chips">
              {DIETARY_PREFERENCES.map(pref => (
                <button
                  key={pref}
                  type="button"
                  className={`settings-chip ${profile.dietaryPreferences.includes(pref) ? 'active' : ''}`}
                  onClick={() => handleDietaryToggle(pref)}
                >
                  {t(`settings.dietary.${pref}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">{t('settings.dislikedIngredients')}</label>
            <div className="settings-disliked-input-row">
              <input
                type="text"
                className="settings-input settings-disliked-input"
                placeholder={t('settings.dislikedPlaceholder')}
                value={dislikedInput}
                onChange={e => setDislikedInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDisliked(dislikedInput); } }}
              />
              <button
                type="button"
                className="settings-disliked-add-btn"
                onClick={() => handleAddDisliked(dislikedInput)}
                disabled={!dislikedInput.trim()}
              >+</button>
            </div>
            {profile.dislikedIngredients.length > 0 && (
              <div className="settings-chips settings-chips--disliked">
                {profile.dislikedIngredients.map(item => (
                  <span key={item} className="settings-chip settings-chip--disliked">
                    {item}
                    <button
                      type="button"
                      className="settings-chip-remove"
                      onClick={() => handleRemoveDisliked(item)}
                    >×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Préférences app */}
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

      {/* Logout */}
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
