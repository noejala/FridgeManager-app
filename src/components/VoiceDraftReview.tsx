import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DraftProduct } from '../utils/voiceParser';
import { ProductCategory } from '../types/Product';
import { AppDropdown } from './AppDropdown';
import { DatePicker } from './DatePicker';
import './VoiceDraftReview.css';

const CATEGORIES: ProductCategory[] = [
  'Fruits', 'Vegetables', 'Meat', 'Fish', 'Dairy', 'Cheese', 'Butter',
  'Milk', 'Cream', 'Juice', 'Beverages', 'Sauces', 'Prepared', 'Other',
];

const UNITS = ['unit', 'kg', 'g', 'L', 'cl', 'ml', 'pack'];

interface VoiceDraftReviewProps {
  drafts: DraftProduct[];
  onConfirm: (products: Array<Omit<DraftProduct, '_draftId'>>) => Promise<void>;
  onCancel: () => void;
}

export const VoiceDraftReview = ({ drafts: initialDrafts, onConfirm, onCancel }: VoiceDraftReviewProps) => {
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<DraftProduct[]>(initialDrafts);
  const [isAdding, setIsAdding] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const update = (id: string, patch: Partial<DraftProduct>) => {
    setDrafts(prev => prev.map(d => d._draftId === id ? { ...d, ...patch } : d));
  };

  const remove = (id: string) => {
    setDrafts(prev => prev.filter(d => d._draftId !== id));
  };

  const validCount = drafts.filter(d => d.name.trim() && d.expirationDate).length;

  const handleConfirm = async () => {
    const valid = drafts.filter(d => d.name.trim() && d.expirationDate);
    if (!valid.length) return;
    setIsAdding(true);
    await onConfirm(valid.map(({ _draftId, ...rest }) => rest));
  };

  return (
    <div className="voice-review-overlay">
      <div className="voice-review-modal">
        <div className="voice-review-header">
          <h2 className="voice-review-title">
            {t('voice.reviewTitle', { count: drafts.length })}
          </h2>
          <button className="voice-review-close" onClick={onCancel} disabled={isAdding}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className="voice-review-subtitle">{t('voice.reviewSubtitle')}</p>

        <div className="voice-review-list">
          {drafts.map(draft => (
            <div key={draft._draftId} className="voice-draft-row">
              <div className="voice-draft-row-top">
                <input
                  className="voice-draft-name"
                  type="text"
                  value={draft.name}
                  onChange={e => update(draft._draftId, { name: e.target.value })}
                  placeholder={t('form.productName')}
                  disabled={isAdding}
                />
                <button
                  className="voice-draft-delete"
                  onClick={() => remove(draft._draftId)}
                  disabled={isAdding}
                  aria-label="Supprimer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>

              <div className="voice-draft-row-bottom">
                <AppDropdown
                  className="voice-draft-category"
                  value={draft.category}
                  options={CATEGORIES.map(cat => ({ value: cat, label: t(`categories.${cat}`) }))}
                  onChange={v => update(draft._draftId, { category: v as ProductCategory })}
                />

                <input
                  className="voice-draft-qty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={draft.quantity}
                  onChange={e => update(draft._draftId, { quantity: Number(e.target.value) || 1 })}
                  disabled={isAdding}
                />

                <AppDropdown
                  className="voice-draft-unit"
                  value={draft.unit}
                  options={UNITS.map(u => ({ value: u, label: u }))}
                  onChange={v => update(draft._draftId, { unit: v })}
                />

                <DatePicker
                  className={`voice-draft-date${!draft.expirationDate ? ' voice-draft-date--required' : ''}`}
                  value={draft.expirationDate ?? ''}
                  min={today}
                  alwaysCalendar
                  onChange={v => update(draft._draftId, {
                    expirationDate: v || null,
                    isEstimatedExpiration: false,
                  })}
                />
              </div>

              {draft.isEstimatedExpiration && draft.expirationDate && (
                <span className="voice-draft-estimated">{t('productCard.estimated')}</span>
              )}
              {!draft.expirationDate && (
                <span className="voice-draft-date-hint">{t('voice.dateRequired')}</span>
              )}
            </div>
          ))}

          {drafts.length === 0 && (
            <p className="voice-review-empty">{t('voice.reviewEmpty')}</p>
          )}
        </div>

        <div className="voice-review-footer">
          <button className="voice-review-cancel" onClick={onCancel} disabled={isAdding}>
            {t('form.cancel')}
          </button>
          <button
            className="voice-review-confirm"
            onClick={handleConfirm}
            disabled={isAdding || validCount === 0}
          >
            {isAdding
              ? t('form.adding')
              : t('voice.addToFridge', { count: validCount })}
          </button>
        </div>
      </div>
    </div>
  );
};
