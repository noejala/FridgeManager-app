import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { getDaysUntilExpiration, isExpired, isExpiringSoon } from '../utils/storage';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
  onEdit: (product: Product) => void;
  onOpenSauce?: (id: string, openedDate: string) => void;
  index?: number;
}

export const ProductCard = ({ product, onDelete, onConsume, onEdit, onOpenSauce, index = 0 }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().split('T')[0];
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingConsume, setConfirmingConsume] = useState(false);
  const [confirmingOpen, setConfirmingOpen] = useState(false);
  const [openDateInput, setOpenDateInput] = useState(today);
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const expired = isExpired(product.expirationDate);
  const expiringSoon = isExpiringSoon(product.expirationDate);

  const getStatusClass = () => {
    if (expired) return 'status-expired';
    if (expiringSoon) return 'status-expiring';
    return 'status-ok';
  };

  const getStatusText = () => {
    if (expired) return t('productCard.expired');
    return t('productCard.expiresIn', { count: daysUntil });
  };

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const cardClass = [
    'product-card',
    getStatusClass(),
    confirmingDelete ? 'confirming-delete' : '',
    confirmingConsume ? 'confirming-consume' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass} style={{ '--index': index } as React.CSSProperties}>
      <div className="product-header">
        <h3>{product.name}</h3>
        <div className="product-actions">
          {confirmingDelete ? (
            <>
              <button className="delete-cancel-btn" onClick={() => setConfirmingDelete(false)}>
                {t('form.cancel')}
              </button>
              <button className="delete-confirm-btn" onClick={() => onDelete(product.id)}>
                {t('productCard.delete')}
              </button>
            </>
          ) : confirmingConsume ? (
            <>
              <button className="consume-cancel-btn" onClick={() => setConfirmingConsume(false)}>
                {t('form.cancel')}
              </button>
              <button className="consume-confirm-btn" onClick={() => onConsume(product.id)}>
                {t('productCard.consumed')}
              </button>
            </>
          ) : confirmingOpen ? (
            <>
              <input
                className="open-date-input"
                type="date"
                value={openDateInput}
                max={today}
                onChange={(e) => setOpenDateInput(e.target.value)}
              />
              <button className="consume-cancel-btn" onClick={() => setConfirmingOpen(false)}>
                {t('form.cancel')}
              </button>
              <button
                className="consume-confirm-btn"
                onClick={() => { onOpenSauce?.(product.id, openDateInput); setConfirmingOpen(false); }}
              >
                {t('productCard.confirmOpen')}
              </button>
            </>
          ) : (
            <>
              {product.category === 'Sauces' && !product.openedDate && (
                <button
                  className="open-sauce-btn"
                  onClick={() => setConfirmingOpen(true)}
                  aria-label={t('productCard.markOpened')}
                  title={t('productCard.markOpened')}
                >
                  🔓
                </button>
              )}
              <button
                className="consume-btn"
                onClick={() => setConfirmingConsume(true)}
                aria-label={t('productCard.consume')}
                title={t('productCard.consume')}
              >
                ✓
              </button>
              <button
                className="edit-btn"
                onClick={() => onEdit(product)}
                aria-label={t('productCard.edit')}
                title={t('productCard.edit')}
              >
                ✏️
              </button>
              <button
                className="delete-btn"
                onClick={() => setConfirmingDelete(true)}
                aria-label={t('productCard.delete')}
                title={t('productCard.delete')}
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>
      <div className="product-info">
        <span className="category">{t(`categories.${product.category}`)}</span>
        {product.fridgeZone && (
          <span className="fridge-zone-badge" data-tooltip={t(`zoneExplanations.${product.fridgeZone}`)}>{t(`zones.${product.fridgeZone}`)}</span>
        )}
        <span className="quantity">
          {product.quantity} {product.unit}
        </span>
      </div>
      <div className="product-dates">
        <div className="date-info">
          <span className="label">{t('productCard.added')}</span>
          <span>{new Date(product.addedDate).toLocaleDateString(locale)}</span>
        </div>
        {product.openedDate && (
          <div className="date-info">
            <span className="label">{t('productCard.opened')}</span>
            <span>{new Date(product.openedDate).toLocaleDateString(locale)}</span>
          </div>
        )}
        <div className="date-info">
          <span className="label">{t('productCard.expires')}</span>
          <span>
            {product.isEstimatedExpiration ? '~' : ''}
            {new Date(product.expirationDate).toLocaleDateString(locale)}
            {product.isEstimatedExpiration ? ` ${t('productCard.estimated')}` : ''}
          </span>
        </div>
      </div>
      <div className={`status-badge ${getStatusClass()}`}>
        {getStatusText()}
      </div>
    </div>
  );
};
