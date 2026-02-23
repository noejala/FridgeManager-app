import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import './DuplicateModal.css';

interface DuplicateModalProps {
  existing: Product;
  incoming: Omit<Product, 'id' | 'addedDate'>;
  onCancel: () => void;
  onGroup: () => Promise<void>;
  onReplace: () => Promise<void>;
}

export const DuplicateModal = ({ existing, incoming, onCancel, onGroup, onReplace }: DuplicateModalProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale);
  const laterDate = existing.expirationDate >= incoming.expirationDate
    ? existing.expirationDate
    : incoming.expirationDate;

  return (
    <div className="dup-overlay" onClick={onCancel}>
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
            <span className="dup-date">{t('duplicate.expires')} {formatDate(existing.expirationDate)}</span>
          </div>
          <div className="dup-separator">+</div>
          <div className="dup-product dup-product--new">
            <span className="dup-label">{t('duplicate.new')}</span>
            <span className="dup-qty">{incoming.quantity} {incoming.unit}</span>
            <span className="dup-date">{t('duplicate.expires')} {formatDate(incoming.expirationDate)}</span>
          </div>
        </div>

        <div className="dup-actions">
          <button className="dup-cancel" onClick={onCancel}>
            {t('form.cancel')}
          </button>
          <button className="dup-group" onClick={onGroup}>
            <span className="dup-action-label">{t('duplicate.group')}</span>
            <span className="dup-action-desc">
              {existing.quantity + incoming.quantity} {existing.unit} · {formatDate(laterDate)}
            </span>
          </button>
          <button className="dup-replace" onClick={onReplace}>
            <span className="dup-action-label">{t('duplicate.replace')}</span>
            <span className="dup-action-desc">
              {incoming.quantity} {incoming.unit} · {formatDate(incoming.expirationDate)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
