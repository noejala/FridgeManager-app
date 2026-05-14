import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, DietaryPreference } from '../types/UserProfile';
import { fetchUserProfile, saveUserProfile, changeUsername } from '../utils/userProfileService';
import { EQUIPMENT_ICONS } from './KitchenEquipmentIcons';
import './UserSettings.css';

const DIETARY_RESTRICTIONS: DietaryPreference[] = ['gluten_free', 'lactose_free', 'halal', 'kosher'];
const DIETARY_PREFERENCES: DietaryPreference[] = ['vegetarian', 'vegan', 'pescatarian'];
const KITCHEN_EQUIPMENT = ['oven', 'microwave', 'stovetop', 'air_fryer', 'blender', 'slow_cooker', 'deep_fryer', 'steamer', 'barbecue'] as const;

const EMPTY_PROFILE: UserProfile = {
  displayName: null,
  firstName: null,
  country: null,
  gender: null,
  age: null,
  dietaryPreferences: [],
  dislikedIngredients: [],
  customPreferences: '',
  pantryStaples: [],
  kitchenEquipment: [],
  usernameChangedAt: null,
};

const USERNAME_COOLDOWN_DAYS = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,20}$/;

function canChangeUsername(changedAt: string | null): boolean {
  if (!changedAt) return true;
  return (Date.now() - new Date(changedAt).getTime()) >= USERNAME_COOLDOWN_DAYS * 86400_000;
}

function nextUsernameChangeDate(changedAt: string | null): Date | null {
  if (!changedAt) return null;
  const d = new Date(changedAt);
  d.setDate(d.getDate() + USERNAME_COOLDOWN_DAYS);
  return d;
}

type SettingsTab = 'profile' | 'preferences' | 'kitchen';

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onDietaryPreferencesChange?: (prefs: DietaryPreference[]) => void;
  onDislikedIngredientsChange?: (items: string[]) => void;
  onCustomPreferencesChange?: (value: string) => void;
  onKitchenEquipmentChange?: (equipment: string[]) => void;
}

export const UserSettings = ({ darkMode, onToggleDarkMode, onLogout, onDietaryPreferencesChange, onDislikedIngredientsChange, onCustomPreferencesChange, onKitchenEquipmentChange }: Props) => {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<UserProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dislikedInput, setDislikedInput] = useState('');
  const [nutritionDraft, setNutritionDraft] = useState<{
    dietaryPreferences: DietaryPreference[];
    dislikedIngredients: string[];
    customPreferences: string;
  }>({ dietaryPreferences: [], dislikedIngredients: [], customPreferences: '' });
  const [nutritionSaving, setNutritionSaving] = useState(false);
  const [nutritionSaved, setNutritionSaved] = useState(false);
  const [equipmentDraft, setEquipmentDraft] = useState<string[]>([]);
  const [equipmentSaving, setEquipmentSaving] = useState(false);
  const [equipmentSaved, setEquipmentSaved] = useState(false);
  const [usernameError, setUsernameError] = useState<'taken' | 'invalid' | 'error' | null>(null);

  const hasProfileData = (p: UserProfile) => p.country || p.age;

  useEffect(() => {
    fetchUserProfile().then(data => {
      const p = data ?? EMPTY_PROFILE;
      setProfile(p);
      setDraft(p);
      setNutritionDraft({
        dietaryPreferences: p.dietaryPreferences,
        dislikedIngredients: p.dislikedIngredients,
        customPreferences: p.customPreferences,
      });
      setEquipmentDraft(p.kitchenEquipment);
      setEditing(!hasProfileData(p));
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setUsernameError(null);

    let finalDraft = { ...draft };

    if (draft.displayName !== profile.displayName && draft.displayName) {
      if (!USERNAME_REGEX.test(draft.displayName)) {
        setUsernameError('invalid');
        setSaving(false);
        return;
      }
      const result = await changeUsername(draft.displayName);
      if (result !== 'ok') {
        setUsernameError(result);
        setSaving(false);
        return;
      }
      finalDraft = { ...finalDraft, usernameChangedAt: new Date().toISOString() };
    }

    await saveUserProfile(finalDraft);
    setProfile(finalDraft);
    setDraft(finalDraft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
    setUsernameError(null);
  };

  const handleDietaryToggle = (pref: DietaryPreference) => {
    setNutritionDraft(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter(p => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  const handleAddDisliked = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || nutritionDraft.dislikedIngredients.includes(trimmed)) return;
    setNutritionDraft(prev => ({ ...prev, dislikedIngredients: [...prev.dislikedIngredients, trimmed] }));
    setDislikedInput('');
  };

  const handleRemoveDisliked = (item: string) => {
    setNutritionDraft(prev => ({ ...prev, dislikedIngredients: prev.dislikedIngredients.filter(i => i !== item) }));
  };

  const handleEquipmentToggle = (item: string) => {
    setEquipmentDraft(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    );
  };

  const handleSaveNutrition = async () => {
    setNutritionSaving(true);
    const updated = { ...profile, ...nutritionDraft };
    await saveUserProfile(updated);
    setProfile(updated);
    setDraft(updated);
    onDietaryPreferencesChange?.(nutritionDraft.dietaryPreferences);
    onDislikedIngredientsChange?.(nutritionDraft.dislikedIngredients);
    onCustomPreferencesChange?.(nutritionDraft.customPreferences);
    setNutritionSaving(false);
    setNutritionSaved(true);
    setTimeout(() => setNutritionSaved(false), 2000);
  };

  const handleSaveEquipment = async () => {
    setEquipmentSaving(true);
    const updated = { ...profile, kitchenEquipment: equipmentDraft };
    await saveUserProfile(updated);
    setProfile(updated);
    setDraft(updated);
    onKitchenEquipmentChange?.(equipmentDraft);
    setEquipmentSaving(false);
    setEquipmentSaved(true);
    setTimeout(() => setEquipmentSaved(false), 2000);
  };

  const nutritionDirty =
    JSON.stringify([...nutritionDraft.dietaryPreferences].sort()) !== JSON.stringify([...profile.dietaryPreferences].sort()) ||
    JSON.stringify([...nutritionDraft.dislikedIngredients].sort()) !== JSON.stringify([...profile.dislikedIngredients].sort()) ||
    nutritionDraft.customPreferences !== profile.customPreferences;

  const equipmentDirty =
    JSON.stringify([...equipmentDraft].sort()) !== JSON.stringify([...profile.kitchenEquipment].sort());

  if (loading) return <div className="settings-loading" />;

  const TABS: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: t('settings.tabs.profile') },
    { id: 'preferences', label: t('settings.tabs.preferences') },
    { id: 'kitchen', label: t('settings.tabs.kitchen') },
  ];

  return (
    <div className="settings-page">

      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings-tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mon profil */}
      {activeTab === 'profile' && (
        <>
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
                  {profile.displayName && (
                    <div className="settings-field">
                      <label className="settings-label">{t('auth.username')}</label>
                      <div className={`settings-username-wrapper${!canChangeUsername(profile.usernameChangedAt) ? ' disabled' : ''}`}>
                        <span className="settings-username-at">@</span>
                        <input
                          type="text"
                          className="settings-input settings-input--username"
                          value={draft.displayName ?? ''}
                          onChange={e => { setDraft(prev => ({ ...prev, displayName: e.target.value || null })); setUsernameError(null); }}
                          disabled={!canChangeUsername(profile.usernameChangedAt)}
                          maxLength={20}
                          autoComplete="off"
                        />
                      </div>
                      {!canChangeUsername(profile.usernameChangedAt) && (
                        <span className="settings-field-hint">
                          {t('settings.usernameAvailableOn', {
                            date: nextUsernameChangeDate(profile.usernameChangedAt)?.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
                          })}
                        </span>
                      )}
                      {usernameError && (
                        <span className="settings-field-hint settings-field-hint--error">{t(`settings.usernameError.${usernameError}`)}</span>
                      )}
                    </div>
                  )}

                  <div className="settings-field">
                    <label className="settings-label">{t('settings.firstName')}</label>
                    <input
                      type="text"
                      className="settings-input"
                      placeholder={t('settings.firstNamePlaceholder')}
                      value={draft.firstName ?? ''}
                      onChange={e => setDraft(prev => ({ ...prev, firstName: e.target.value || null }))}
                    />
                  </div>

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
                  {profile.displayName && (
                    <div className="settings-view-row">
                      <span className="settings-view-label">{t('auth.username')}</span>
                      <span className="settings-view-value">@{profile.displayName}</span>
                    </div>
                  )}
                  <div className="settings-view-row">
                    <span className="settings-view-label">{t('settings.firstName')}</span>
                    <span className="settings-view-value">{profile.firstName ?? '—'}</span>
                  </div>
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
                <div className="settings-lang-segmented">
                  {(['en', 'fr'] as const).map(lang => (
                    <button
                      key={lang}
                      className={`settings-lang-seg-btn${i18n.language === lang ? ' active' : ''}`}
                      onClick={() => i18n.changeLanguage(lang)}
                      disabled={i18n.language === lang}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

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
        </>
      )}

      {/* Préférences nutritionnelles */}
      {activeTab === 'preferences' && (
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
                    className={`settings-chip ${nutritionDraft.dietaryPreferences.includes(pref) ? 'active' : ''}`}
                    onClick={(e) => { handleDietaryToggle(pref); (e.currentTarget as HTMLButtonElement).blur(); }}
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
                    className={`settings-chip ${nutritionDraft.dietaryPreferences.includes(pref) ? 'active' : ''}`}
                    onClick={(e) => { handleDietaryToggle(pref); (e.currentTarget as HTMLButtonElement).blur(); }}
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
              {nutritionDraft.dislikedIngredients.length > 0 && (
                <div className="settings-chips settings-chips--disliked">
                  {nutritionDraft.dislikedIngredients.map(item => (
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

            <div className="settings-field">
              <label className="settings-label">{t('settings.customPreferences')}</label>
              <textarea
                className="settings-input settings-custom-prefs-textarea"
                placeholder={t('settings.customPreferencesPlaceholder')}
                value={nutritionDraft.customPreferences}
                rows={3}
                onChange={e => setNutritionDraft(prev => ({ ...prev, customPreferences: e.target.value }))}
              />
              <span className="settings-field-hint">{t('settings.customPreferencesHint')}</span>
            </div>

            <div className="settings-save-row">
              <button
                className={`settings-save-btn${nutritionSaved ? ' saved' : ''}`}
                onClick={handleSaveNutrition}
                disabled={nutritionSaving || (!nutritionDirty && !nutritionSaved)}
              >
                {nutritionSaving ? t('settings.saving') : nutritionSaved ? t('settings.saved') : t('settings.save')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Ma cuisine */}
      {activeTab === 'kitchen' && (
        <section className="settings-section">
          <h2 className="settings-section-title">{t('settings.tabs.kitchen')}</h2>
          <p className="settings-section-hint">{t('settings.kitchenEquipmentHint')}</p>

          <div className="equipment-grid">
            {KITCHEN_EQUIPMENT.map(item => {
              const Icon = EQUIPMENT_ICONS[item];
              return (
                <button
                  key={item}
                  type="button"
                  className={`equipment-card${equipmentDraft.includes(item) ? ' active' : ''}`}
                  onClick={(e) => { handleEquipmentToggle(item); (e.currentTarget as HTMLButtonElement).blur(); }}
                >
                  {Icon && <Icon size={42} className="equipment-card-icon" />}
                  <span className="equipment-card-label">{t(`settings.equipment.${item}`)}</span>
                </button>
              );
            })}
          </div>

          <div className="settings-save-row">
            <button
              className={`settings-save-btn${equipmentSaved ? ' saved' : ''}`}
              onClick={handleSaveEquipment}
              disabled={equipmentSaving || (!equipmentDirty && !equipmentSaved)}
            >
              {equipmentSaving ? t('settings.saving') : equipmentSaved ? t('settings.saved') : t('settings.save')}
            </button>
          </div>
        </section>
      )}

    </div>
  );
};
