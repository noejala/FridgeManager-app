import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PANTRY_PRESET_ITEMS, PRESET_EN_SET } from '../utils/pantryPresets';
import './PantryOnboarding.css';

interface Props {
  onConfirm: (staples: string[]) => void;
  onSkip: () => void;
}

type Group = 'starches' | 'fats' | 'condiments' | 'canned' | 'spices';

const GROUP_ORDER: Group[] = ['starches', 'fats', 'condiments', 'canned', 'spices'];

export const PantryOnboarding = ({ onConfirm, onSkip }: Props) => {
  const { t } = useTranslation();

  const [selected, setSelected] = useState<Set<string>>(
    new Set(['salt', 'pepper', 'olive oil', 'butter'])
  );
  const [customInput, setCustomInput] = useState('');
  const [customItems, setCustomItems] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => { document.documentElement.style.overflow = ''; };
  }, []);

  const toggle = (en: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(en)) next.delete(en);
      else next.add(en);
      return next;
    });
  };

  const allPresetKeys = PANTRY_PRESET_ITEMS.map(i => i.en);
  const allSelected = allPresetKeys.every(k => selected.has(k));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allPresetKeys));
    }
  };

  const handleAddCustom = () => {
    const val = customInput.trim().toLowerCase();
    if (!val || customItems.includes(val) || PRESET_EN_SET.has(val)) return;
    setCustomItems(prev => [...prev, val]);
    setCustomInput('');
  };

  const handleRemoveCustom = (item: string) => {
    setCustomItems(prev => prev.filter(i => i !== item));
  };

  const handleConfirm = () => {
    onConfirm([...selected, ...customItems]);
  };

  const grouped = GROUP_ORDER.reduce<Record<Group, typeof PANTRY_PRESET_ITEMS>>(
    (acc, g) => ({ ...acc, [g]: PANTRY_PRESET_ITEMS.filter(i => i.group === g) }),
    {} as Record<Group, typeof PANTRY_PRESET_ITEMS>
  );

  const totalSelected = selected.size + customItems.length;

  return (
    <div className="pantry-onboarding-overlay">
      <div className="pantry-onboarding-modal">
        <div className="pantry-onboarding-header">
          <div>
            <h2 className="pantry-onboarding-title">{t('pantryOnboarding.title')}</h2>
            <p className="pantry-onboarding-subtitle">{t('pantryOnboarding.subtitle')}</p>
          </div>
          <button className="pantry-onboarding-close" type="button" onClick={onSkip} aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="pantry-onboarding-select-all-row">
          <span className="pantry-onboarding-count">
            {totalSelected > 0 ? `${totalSelected} sélectionné${totalSelected > 1 ? 's' : ''}` : 'Aucun sélectionné'}
          </span>
          <button type="button" className="pantry-onboarding-toggle-all" onClick={toggleAll}>
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>

        <div className="pantry-onboarding-groups">
          {GROUP_ORDER.map(group => (
            <div key={group} className="pantry-onboarding-group">
              <span className="pantry-onboarding-group-label">{t(`pantryOnboarding.groups.${group}`)}</span>
              <div className="pantry-onboarding-chips">
                {grouped[group].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    className={`pantry-chip${selected.has(item.en) ? ' active' : ''}`}
                    onClick={() => toggle(item.en)}
                  >
                    {t(`pantryOnboarding.items.${item.key}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {customItems.length > 0 && (
          <div className="pantry-onboarding-custom-tags">
            {customItems.map(item => (
              <span key={item} className="pantry-custom-tag">
                {item}
                <button type="button" onClick={() => handleRemoveCustom(item)}>×</button>
              </span>
            ))}
          </div>
        )}

        <div className="pantry-onboarding-add-row">
          <input
            type="text"
            className="pantry-onboarding-input"
            placeholder={t('pantryOnboarding.addPlaceholder')}
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
          />
          <button
            type="button"
            className="pantry-onboarding-add-btn"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
          >+</button>
        </div>

        <div className="pantry-onboarding-actions">
          <button type="button" className="pantry-onboarding-skip" onClick={onSkip}>
            {t('pantryOnboarding.skip')}
          </button>
          <button type="button" className="pantry-onboarding-confirm" onClick={handleConfirm}>
            {t('pantryOnboarding.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
