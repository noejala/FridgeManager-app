import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { getDaysUntilExpiration, isExpired, isExpiringSoon } from '../utils/storage';
import { isOpenableProduct } from '../utils/shelfLife';
import { singularize } from '../utils/mealApi';
import { toEnglishIngredient } from '../utils/ingredientTranslation';
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
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingConsume, setConfirmingConsume] = useState(false);
  const [confirmingOpen, setConfirmingOpen] = useState(false);
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const expired = isExpired(product.expirationDate);
  const expiringSoon = isExpiringSoon(product.expirationDate);
  const isDDM = product.expirationDateType === 'ddm';

  const getStatusClass = () => {
    if (expired) return isDDM ? 'status-expired-ddm' : 'status-expired';
    if (expiringSoon) return 'status-expiring';
    return 'status-ok';
  };

  const showSensoryHint = !!product.isEstimatedExpiration && (expired || expiringSoon);

  const getStatusText = () => {
    if (expired) {
      if (showSensoryHint) return t('productCard.estimatedExpiredCheck');
      return isDDM ? t('productCard.ddmExpired') : t('productCard.expired');
    }
    if (expiringSoon) return showSensoryHint ? t('productCard.estimatedExpiringSoonCheck') : t('productCard.expiresIn', { count: daysUntil });
    if (daysUntil >= 60) return t('productCard.expiresInMonths', { count: Math.round(daysUntil / 30) });
    if (daysUntil >= 14) return t('productCard.expiresInWeeks', { count: Math.round(daysUntil / 7) });
    return t('productCard.expiresIn', { count: daysUntil });
  };

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const ingredientImg = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(singularize(toEnglishIngredient(product.name)))}-Small.png`;
  const [imgHidden, setImgHidden] = useState(false);

  const isConfirming = confirmingDelete || confirmingConsume || confirmingOpen;
  const isExpanded = expanded || isConfirming;

  const cardClass = [
    'product-card',
    getStatusClass(),
    isExpanded ? 'is-expanded' : '',
    confirmingDelete ? 'confirming-delete' : '',
    confirmingConsume ? 'confirming-consume' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass} style={{ '--index': index } as React.CSSProperties}>
      <div className="product-card-toggle" onClick={() => setExpanded(p => !p)}>
        {!imgHidden && (
          <img
            className="product-img"
            src={ingredientImg}
            alt=""
            aria-hidden="true"
            onError={() => setImgHidden(true)}
          />
        )}
        <h3 className="product-name">{product.name}</h3>
        <span className="product-qty-inline">{product.quantity} {product.unit}</span>
        <span className={`product-chevron${isExpanded ? ' open' : ''}`} />
      </div>

      {isExpanded && (
        <div className="product-card-body">
          <div
            className={`status-badge ${getStatusClass()}${showSensoryHint ? ' estimated-hint' : ''}`}
            data-tooltip={showSensoryHint ? t('productCard.estimatedCheckTooltip') : undefined}
          >
            {getStatusText()}
          </div>
          <div className="product-exp">
            <span className="label">{isDDM ? t('productCard.bestBefore') : t('productCard.expires')}</span>
            <span>
              {product.isEstimatedExpiration ? '~' : ''}
              {new Date(product.expirationDate).toLocaleDateString(locale)}
            </span>
          </div>
          <div className="product-card-footer">
            {confirmingDelete ? (
              <div className="product-confirm-row">
                <button className="consume-cancel-btn" onClick={() => setConfirmingDelete(false)}>
                  {t('form.cancel')}
                </button>
                <button className="delete-confirm-btn" onClick={() => onDelete(product.id)}>
                  {t('productCard.delete')}
                </button>
              </div>
            ) : confirmingConsume ? (
              <div className="product-confirm-row">
                <button className="consume-cancel-btn" onClick={() => setConfirmingConsume(false)}>
                  {t('form.cancel')}
                </button>
                <button className="consume-confirm-btn" onClick={() => onConsume(product.id)}>
                  {t('productCard.consumed')}
                </button>
              </div>
            ) : confirmingOpen ? (
              <div className="product-confirm-row">
                <button className="consume-cancel-btn" onClick={() => setConfirmingOpen(false)}>
                  {t('form.cancel')}
                </button>
                <button
                  className="consume-confirm-btn"
                  onClick={() => { onOpenSauce?.(product.id, today); setConfirmingOpen(false); }}
                >
                  {t('productCard.confirmOpen')}
                </button>
              </div>
            ) : (
              <div className="product-actions">
                {isOpenableProduct(product.name, product.category) && !product.openedDate && (
                  <button
                    className="open-sauce-btn"
                    onClick={() => setConfirmingOpen(true)}
                    aria-label={t('productCard.markOpened')}
                    data-tooltip={t('productCard.sauceUnopened')}
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button
                  className="delete-btn"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label={t('productCard.delete')}
                  title={t('productCard.delete')}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
