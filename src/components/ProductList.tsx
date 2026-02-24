import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { ProductCard } from './ProductCard';
import { isExpired, isExpiringSoon } from '../utils/storage';
import './ProductList.css';

interface ProductListProps {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onClearAll: () => Promise<void>;
}

export const ProductList = ({ products, onDelete, onEdit, onClearAll }: ProductListProps) => {
  const { t } = useTranslation();
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleConfirmClear = async () => {
    setClearing(true);
    await onClearAll();
    setClearing(false);
    setShowClearModal(false);
  };

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <svg className="empty-fridge-icon" width="56" height="76" viewBox="0 0 56 76" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="50" height="70" rx="5" />
          <line x1="3" y1="22" x2="53" y2="22" />
          <line x1="19" y1="13" x2="37" y2="13" strokeWidth="2" />
          <line x1="19" y1="42" x2="37" y2="42" strokeWidth="2" />
          <line x1="19" y1="55" x2="30" y2="55" strokeDasharray="2 3" />
          <line x1="19" y1="62" x2="26" y2="62" strokeDasharray="2 3" />
        </svg>
        <h3>{t('productList.nothingHereYet')}</h3>
        <p>{t('productList.startAdding')}</p>
      </div>
    );
  }

  const sortedProducts = [...products].sort((a, b) => {
    const aExpired = isExpired(a.expirationDate);
    const bExpired = isExpired(b.expirationDate);
    const aExpiringSoon = isExpiringSoon(a.expirationDate);
    const bExpiringSoon = isExpiringSoon(b.expirationDate);

    if (aExpired && !bExpired) return -1;
    if (!aExpired && bExpired) return 1;
    if (aExpiringSoon && !bExpiringSoon && !aExpired) return -1;
    if (!aExpiringSoon && bExpiringSoon && !bExpired) return 1;

    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
  });

  const expiredCount = products.filter(p => isExpired(p.expirationDate)).length;
  const expiringSoonCount = products.filter(p => isExpiringSoon(p.expirationDate) && !isExpired(p.expirationDate)).length;

  return (
    <div className="product-list-container">
      {(expiredCount > 0 || expiringSoonCount > 0) && (
        <div className="alerts-summary">
          {expiredCount > 0 && (
            <div className="alert alert-expired">
              {t('productList.expiredProduct', { count: expiredCount })}
            </div>
          )}
          {expiringSoonCount > 0 && (
            <div className="alert alert-expiring">
              {t('productList.expiringSoon', { count: expiringSoonCount })}
            </div>
          )}
        </div>
      )}

      <div className="product-grid">
        {sortedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            onDelete={onDelete}
            onEdit={onEdit}
            index={index}
          />
        ))}
      </div>

      <div className="clear-fridge-row">
        <button className="clear-fridge-btn" onClick={() => setShowClearModal(true)}>
          {t('productList.clearFridge')}
        </button>
      </div>

      {showClearModal && (
        <div className="clear-modal-overlay" onClick={() => !clearing && setShowClearModal(false)}>
          <div className="clear-modal" onClick={e => e.stopPropagation()}>
            <div className="clear-modal-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h3 className="clear-modal-title">{t('productList.clearConfirmTitle')}</h3>
            <p className="clear-modal-message">
              {t('productList.clearConfirmMessage', { count: products.length })}
            </p>
            <div className="clear-modal-actions">
              <button
                className="clear-modal-cancel"
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
              >
                {t('form.cancel')}
              </button>
              <button
                className="clear-modal-confirm"
                onClick={handleConfirmClear}
                disabled={clearing}
              >
                {clearing ? '…' : t('productList.clearConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
