import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile, DietaryPreference } from '../types/UserProfile';
import { fetchUserProfile, saveUserProfile } from '../utils/userProfileService';
import { PANTRY_PRESET_ITEMS, PRESET_EN_SET } from '../utils/pantryPresets';
import { getPrompt, savePrompt, PROMPT_DEFAULTS } from '../utils/promptSettings';
import './UserSettings.css';

const DIETARY_RESTRICTIONS: DietaryPreference[] = ['gluten_free', 'lactose_free', 'halal', 'kosher'];
const DIETARY_PREFERENCES: DietaryPreference[] = ['vegetarian', 'vegan', 'pescatarian'];

const EMPTY_PROFILE: UserProfile = {
  country: null,
  gender: null,
  age: null,
  dietaryPreferences: [],
  dislikedIngredients: [],
  customPreferences: '',
  pantryStaples: [],
};

type PantryGroup = 'starches' | 'fats' | 'condiments' | 'canned' | 'spices';
const PANTRY_GROUP_ORDER: PantryGroup[] = ['starches', 'fats', 'condiments', 'canned', 'spices'];

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onDietaryPreferencesChange?: (prefs: DietaryPreference[]) => void;
  onDislikedIngredientsChange?: (items: string[]) => void;
  onCustomPreferencesChange?: (value: string) => void;
  onPantryStaplesChange?: (items: string[]) => void;
}

export const UserSettings = ({ darkMode, onToggleDarkMode, onLogout, onDietaryPreferencesChange, onDislikedIngredientsChange, onCustomPreferencesChange, onPantryStaplesChange }: Props) => {
  const { t, i18n } = useTranslation();
  const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true';

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
  const [pantryInput, setPantryInput] = useState('');
  const [pantryDraft, setPantryDraft] = useState<string[]>([]);
  const [pantrySaving, setPantrySaving] = useState(false);
  const [pantrySaved, setPantrySaved] = useState(false);

  const [recipesPromptDraft, setRecipesPromptDraft] = useState(() => getPrompt('recipes'));
  const [funFactsPromptDraft, setFunFactsPromptDraft] = useState(() => getPrompt('funFacts'));
  const [savedRecipesPrompt, setSavedRecipesPrompt] = useState(() => getPrompt('recipes'));
  const [savedFunFactsPrompt, setSavedFunFactsPrompt] = useState(() => getPrompt('funFacts'));
  const [promptSaved, setPromptSaved] = useState(false);

  const promptsDirty = recipesPromptDraft !== savedRecipesPrompt || funFactsPromptDraft !== savedFunFactsPrompt;

  const handleSavePrompts = () => {
    savePrompt('recipes', recipesPromptDraft);
    savePrompt('funFacts', funFactsPromptDraft);
    setSavedRecipesPrompt(recipesPromptDraft);
    setSavedFunFactsPrompt(funFactsPromptDraft);
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const handleResetPrompts = () => {
    setRecipesPromptDraft(PROMPT_DEFAULTS.recipes);
    setFunFactsPromptDraft(PROMPT_DEFAULTS.funFacts);
  };

  const hasProfileData = (p: UserProfile) => p.country || p.age;

  useEffect(() => {
    fetchUserProfile().then(data => {
      const p = data ?? EMPTY_PROFILE;
      setProfile(p);
      setDraft(p);
      setPantryDraft(p.pantryStaples);
      setNutritionDraft({
        dietaryPreferences: p.dietaryPreferences,
        dislikedIngredients: p.dislikedIngredients,
        customPreferences: p.customPreferences,
      });
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

  const nutritionDirty =
    JSON.stringify([...nutritionDraft.dietaryPreferences].sort()) !== JSON.stringify([...profile.dietaryPreferences].sort()) ||
    JSON.stringify([...nutritionDraft.dislikedIngredients].sort()) !== JSON.stringify([...profile.dislikedIngredients].sort()) ||
    nutritionDraft.customPreferences !== profile.customPreferences;

  const handlePantryTogglePreset = (en: string) => {
    setPantryDraft(prev =>
      prev.includes(en) ? prev.filter(s => s !== en) : [...prev, en]
    );
  };

  const handleAddPantryCustom = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || pantryDraft.includes(trimmed)) return;
    setPantryDraft(prev => [...prev, trimmed]);
    setPantryInput('');
  };

  const handleRemovePantryCustom = (item: string) => {
    setPantryDraft(prev => prev.filter(s => s !== item));
  };

  const handleSavePantry = async () => {
    setPantrySaving(true);
    const updated = { ...profile, pantryStaples: pantryDraft };
    await saveUserProfile(updated);
    setProfile(updated);
    setDraft(updated);
    onPantryStaplesChange?.(pantryDraft);
    setPantrySaving(false);
    setPantrySaved(true);
    setTimeout(() => setPantrySaved(false), 2000);
  };

  const pantryDirty = JSON.stringify([...pantryDraft].sort()) !== JSON.stringify([...profile.pantryStaples].sort());

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
            <span className={`settings-field-hint${nutritionSaved ? ' settings-field-hint--saved' : ''}`}>
              {nutritionSaved ? t('settings.saved') : ''}
            </span>
            <button
              className="settings-save-btn"
              onClick={handleSaveNutrition}
              disabled={nutritionSaving || !nutritionDirty}
            >
              {nutritionSaving ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </section>

      {/* Placard de base */}
      <section className="settings-section">
        <h2 className="settings-section-title">{t('settings.pantryStaples')}</h2>
        <div className="settings-card">
          <p className="settings-pantry-hint">{t('settings.pantryStaplesHint')}</p>

          {PANTRY_GROUP_ORDER.map(group => {
            const items = PANTRY_PRESET_ITEMS.filter(i => i.group === group);
            return (
              <div key={group} className="settings-field">
                <label className="settings-label">{t(`pantryOnboarding.groups.${group}`)}</label>
                <div className="settings-chips">
                  {items.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      className={`settings-chip${pantryDraft.includes(item.en) ? ' active' : ''}`}
                      onClick={(e) => { handlePantryTogglePreset(item.en); (e.currentTarget as HTMLButtonElement).blur(); }}
                    >
                      {t(`pantryOnboarding.items.${item.key}`)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom items (not in preset) */}
          {pantryDraft.filter(s => !PRESET_EN_SET.has(s)).length > 0 && (
            <div className="settings-chips settings-chips--disliked">
              {pantryDraft.filter(s => !PRESET_EN_SET.has(s)).map(item => (
                <span key={item} className="settings-chip settings-chip--disliked">
                  {item}
                  <button
                    type="button"
                    className="settings-chip-remove"
                    onClick={() => handleRemovePantryCustom(item)}
                  >×</button>
                </span>
              ))}
            </div>
          )}

          <div className="settings-disliked-input-row">
            <input
              type="text"
              className="settings-input settings-disliked-input"
              placeholder={t('settings.pantryAddPlaceholder')}
              value={pantryInput}
              onChange={e => setPantryInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPantryCustom(pantryInput); } }}
            />
            <button
              type="button"
              className="settings-disliked-add-btn"
              onClick={() => handleAddPantryCustom(pantryInput)}
              disabled={!pantryInput.trim()}
            >+</button>
          </div>

          <div className="settings-save-row">
            <span className={`settings-field-hint${pantrySaved ? ' settings-field-hint--saved' : ''}`}>
              {pantrySaved ? t('settings.saved') : ''}
            </span>
            <button
              className="settings-save-btn"
              onClick={handleSavePantry}
              disabled={pantrySaving || !pantryDirty}
            >
              {pantrySaving ? t('settings.saving') : t('settings.save')}
            </button>
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

      {/* AI Prompts */}
      {aiEnabled && (
        <section className="settings-section">
          <h2 className="settings-section-title">{t('settings.promptsSection')}</h2>
          <div className="settings-card">
            <p className="settings-pantry-hint">{t('settings.promptsHint')}</p>

            <div className="settings-field">
              <label className="settings-label">{t('settings.recipePromptLabel')}</label>
              <span className="settings-field-hint settings-field-hint--mono">{t('settings.recipePromptPlaceholders')}</span>
              <textarea
                className="settings-input settings-prompt-textarea"
                value={recipesPromptDraft}
                rows={5}
                onChange={e => setRecipesPromptDraft(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">{t('settings.funFactsPromptLabel')}</label>
              <span className="settings-field-hint settings-field-hint--mono">{t('settings.funFactsPromptPlaceholders')}</span>
              <textarea
                className="settings-input settings-prompt-textarea"
                value={funFactsPromptDraft}
                rows={3}
                onChange={e => setFunFactsPromptDraft(e.target.value)}
                spellCheck={false}
              />
            </div>

            <div className="settings-save-row">
              <span className={`settings-field-hint${promptSaved ? ' settings-field-hint--saved' : ''}`}>
                {promptSaved ? t('settings.saved') : ''}
              </span>
              <button
                className="settings-reset-btn"
                onClick={handleResetPrompts}
                disabled={recipesPromptDraft === PROMPT_DEFAULTS.recipes && funFactsPromptDraft === PROMPT_DEFAULTS.funFacts}
              >
                {t('settings.promptReset')}
              </button>
              <button
                className="settings-save-btn"
                onClick={handleSavePrompts}
                disabled={!promptsDirty}
              >
                {t('settings.save')}
              </button>
            </div>
          </div>
        </section>
      )}

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
