import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import './DuplicateModal.css';

interface DuplicateModalProps {
  existing: Product;
  incoming: Omit<Product, 'id' | 'addedDate'>;
  onCancel: () => void;
  onGroup: () => Promise<void>;
  onReplace: () => Promise<void>;
  onAddSeparately: () => Promise<void>;
}

export const DuplicateModal = ({ existing, incoming, onCancel, onGroup, onReplace, onAddSeparately }: DuplicateModalProps) => {
  const { t, i18n } = useTranslation();
  const [loadingAction, setLoadingAction] = useState<'group' | 'replace' | 'separate' | null>(null);
  const isLoading = loadingAction !== null;

  const handleAction = async (action: 'group' | 'replace' | 'separate', fn: () => Promise<void>) => {
    setLoadingAction(action);
    try {
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale);
  const unitMismatch = existing.unit !== incoming.unit;
  const dateMismatch = existing.expirationDate !== incoming.expirationDate;
  const laterDate = existing.expirationDate >= incoming.expirationDate
    ? existing.expirationDate
    : incoming.expirationDate;

  return (
    <div className="dup-overlay" onClick={isLoading ? undefined : onCancel}>
      <div className="dup-modal" onClick={e => e.stopPropagation()}>
        <div className="dup-header">
          <div className="dup-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="dup-title">
            {t('duplicate.title', { name: existing.name })}
          </h3>
        </div>

        <div className="dup-comparison">
          <div className="dup-product">
            <span className="dup-label">{t('duplicate.existing')}</span>
            <span className="dup-qty">{existing.quantity} {existing.unit}</span>
            <span className={`dup-date${dateMismatch ? ' dup-date--mismatch' : ''}`}>{t('duplicate.expires')} {formatDate(existing.expirationDate)}</span>
          </div>
          <div className="dup-separator">+</div>
          <div className="dup-product dup-product--new">
            <span className="dup-label">{t('duplicate.new')}</span>
            <span className={`dup-qty${unitMismatch ? ' dup-qty--mismatch' : ''}`}>
              {incoming.quantity} {incoming.unit}
            </span>
            <span className={`dup-date${dateMismatch ? ' dup-date--mismatch' : ''}`}>{t('duplicate.expires')} {formatDate(incoming.expirationDate)}</span>
          </div>
        </div>

        {dateMismatch && !unitMismatch && (
          <div className="dup-unit-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {t('duplicate.dateMismatch', { date: formatDate(laterDate) })}
          </div>
        )}

        {unitMismatch && (
          <div className="dup-unit-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {t('duplicate.unitMismatch', { a: existing.unit, b: incoming.unit })}
          </div>
        )}

        <div className="dup-actions">
          <button
            className="dup-group"
            onClick={() => handleAction('group', onGroup)}
            disabled={unitMismatch || isLoading}
            title={unitMismatch ? t('duplicate.groupDisabled') : undefined}
          >
            <span className="dup-action-label">
              {loadingAction === 'group' ? '…' : t('duplicate.group')}
            </span>
            <span className="dup-action-desc">
              {unitMismatch ? '—' : `${existing.quantity + incoming.quantity} ${existing.unit} · ${formatDate(laterDate)}`}
            </span>
          </button>
          <button
            className="dup-replace"
            onClick={() => handleAction('replace', onReplace)}
            disabled={isLoading}
          >
            <span className="dup-action-label">
              {loadingAction === 'replace' ? '…' : t('duplicate.replace')}
            </span>
            <span className="dup-action-desc">
              {incoming.quantity} {incoming.unit} · {formatDate(incoming.expirationDate)}
            </span>
          </button>
          <button
            className={`dup-separate${unitMismatch ? ' dup-separate--prominent' : ''}`}
            onClick={() => handleAction('separate', onAddSeparately)}
            disabled={isLoading}
          >
            <span className="dup-action-label">
              {loadingAction === 'separate' ? '…' : t('duplicate.addSeparately')}
            </span>
            <span className="dup-action-desc">{t('duplicate.addSeparatelyDesc')}</span>
          </button>
        </div>

        <button className="dup-cancel" onClick={onCancel} disabled={isLoading}>
          {t('form.cancel')}
        </button>
      </div>
    </div>
  );
};
