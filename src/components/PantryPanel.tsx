import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PANTRY_PRESET_ITEMS, PRESET_EN_SET } from '../utils/pantryPresets';
import './PantryPanel.css';

const PANTRY_GROUP_ORDER = ['starches', 'fats', 'condiments', 'canned', 'spices'] as const;

interface Props {
  fridgeId: string;
  staples: string[];
  onSave: (fridgeId: string, staples: string[]) => Promise<void>;
  onClose: () => void;
  copySource?: { name: string; emoji: string; staples: string[] };
}

export function PantryPanel({ fridgeId, staples, onSave, onClose, copySource }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string[]>(staples);
  const [customInput, setCustomInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const draftRef = useRef(draft);
  // Holds a pending copy so Copy → Save survives any intermediate draft state resets
  const pendingCopyRef = useRef<string[] | null>(null);

  useEffect(() => {
    pendingCopyRef.current = null;
    setDraft(staples);
  }, [fridgeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync only when no pending copy; pendingCopyRef takes precedence
  if (pendingCopyRef.current === null) draftRef.current = draft;

  // Single source of truth for display and dirty check
  const effectiveDraft = pendingCopyRef.current ?? draft;

  const toggle = (en: string) => {
    if (pendingCopyRef.current !== null) {
      const base = pendingCopyRef.current;
      pendingCopyRef.current = null;
      const next = base.includes(en) ? base.filter(s => s !== en) : [...base, en];
      draftRef.current = next;
      setDraft(next);
    } else {
      setDraft(prev => prev.includes(en) ? prev.filter(s => s !== en) : [...prev, en]);
    }
  };

  const addCustom = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    const base = pendingCopyRef.current ?? draft;
    if (!trimmed || base.includes(trimmed)) return;
    const next = [...base, trimmed];
    pendingCopyRef.current = null;
    draftRef.current = next;
    setDraft(next);
    setCustomInput('');
  };

  const removeCustom = (item: string) => {
    if (pendingCopyRef.current !== null) {
      const next = pendingCopyRef.current.filter(s => s !== item);
      pendingCopyRef.current = null;
      draftRef.current = next;
      setDraft(next);
    } else {
      setDraft(prev => prev.filter(s => s !== item));
    }
  };

  const doSave = async (toSave: string[]) => {
    pendingCopyRef.current = null;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(fridgeId, toSave);
      draftRef.current = toSave;
      setDraft(toSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('PantryPanel save failed:', err);
      setSaveError(t('settings.pantrySaveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => doSave(pendingCopyRef.current ?? draftRef.current);

  const dirty = JSON.stringify([...effectiveDraft].sort()) !== JSON.stringify([...staples].sort());

  return (
    <div className="pantry-panel">
      <div className="pantry-panel-header">
        <h3 className="pantry-panel-title">{t('settings.pantryStaples')}</h3>
        <button className="pantry-panel-close" onClick={onClose} aria-label="Fermer">×</button>
      </div>
      {copySource && (
        <div className="pantry-copy-banner">
          <span className="pantry-copy-banner-text">
            {t('settings.pantryCopyFrom', { emoji: copySource.emoji, name: copySource.name })}
          </span>
          <button
            className="pantry-copy-banner-btn"
            onClick={(e) => {
              e.stopPropagation();
              pendingCopyRef.current = copySource.staples;
              setDraft(copySource.staples);
            }}
            type="button"
          >
            {t('settings.pantryCopyBtn')}
          </button>
        </div>
      )}
      <p className="pantry-panel-hint">{t('settings.pantryStaplesHint')}</p>

      {PANTRY_GROUP_ORDER.map(group => {
        const items = PANTRY_PRESET_ITEMS.filter(i => i.group === group);
        return (
          <div key={group} className="pantry-group">
            <label className="pantry-group-label">{t(`pantryOnboarding.groups.${group}`)}</label>
            <div className="pantry-chips">
              {items.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`pantry-chip${effectiveDraft.includes(item.en) ? ' active' : ''}`}
                  onClick={() => toggle(item.en)}
                >
                  {t(`pantryOnboarding.items.${item.key}`)}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {effectiveDraft.filter(s => !PRESET_EN_SET.has(s)).length > 0 && (
        <div className="pantry-chips pantry-chips--custom">
          {effectiveDraft.filter(s => !PRESET_EN_SET.has(s)).map(item => (
            <span key={item} className="pantry-chip pantry-chip--custom">
              {item}
              <button type="button" className="pantry-chip-remove" onClick={() => removeCustom(item)}>×</button>
            </span>
          ))}
        </div>
      )}

      <div className="pantry-input-row">
        <input
          type="text"
          className="pantry-input"
          placeholder={t('settings.pantryAddPlaceholder')}
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(customInput); } }}
        />
        <button
          type="button"
          className="pantry-input-add"
          onClick={() => addCustom(customInput)}
          disabled={!customInput.trim()}
        >+</button>
      </div>

      {saveError && <p className="pantry-save-error">{saveError}</p>}
      <div className="pantry-save-row">
        <button
          className={`pantry-save-btn${saved ? ' saved' : ''}`}
          onClick={handleSave}
          disabled={saving || (!dirty && !saved)}
        >
          {saving ? t('settings.saving') : saved ? t('settings.saved') : t('settings.save')}
        </button>
      </div>
    </div>
  );
}
