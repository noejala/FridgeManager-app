import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { ProductCard } from './ProductCard';
import { isExpired, isExpiringSoon } from '../utils/storage';
import './ProductList.css';

interface ProductListProps {
  products: Product[];
  consumedProducts: Product[];
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
  onRestore: (id: string) => void;
  onDeleteConsumed: (id: string) => void;
  onEdit: (product: Product) => void;
  onOpenSauce: (id: string, openedDate: string) => void;
  onClearAll: () => Promise<void>;
}

function getRelativeDay(isoTimestamp: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const consumed = new Date(isoTimestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - consumed.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('productList.today');
  if (diffDays === 1) return t('productList.yesterday');
  return t('productList.daysAgo', { count: diffDays });
}

export const ProductList = ({ products, consumedProducts, onDelete, onConsume, onRestore, onDeleteConsumed, onEdit, onOpenSauce, onClearAll }: ProductListProps) => {
  const { t } = useTranslation();
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [consumedExpanded, setConsumedExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirmClear = async () => {
    setClearing(true);
    await onClearAll();
    setClearing(false);
    setShowClearModal(false);
  };

  const byDate = (a: Product, b: Product) =>
    new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = normalizedQuery
    ? products.filter(p => p.name.toLowerCase().includes(normalizedQuery))
    : products;

  const expiredProducts = filtered.filter(p => isExpired(p.expirationDate)).sort(byDate);
  const expiringSoonProducts = filtered.filter(p => !isExpired(p.expirationDate) && isExpiringSoon(p.expirationDate)).sort(byDate);
  const freshProducts = filtered.filter(p => !isExpired(p.expirationDate) && !isExpiringSoon(p.expirationDate)).sort(byDate);
  const renderGrid = (items: Product[]) => {
    const cols: Product[][] = [[], [], [], []];
    items.forEach((item, i) => cols[i % 4].push(item));
    return (
      <div className="product-grid">
        {cols.map((col, colIndex) => (
          <div key={colIndex} className="product-grid-col">
            {col.map((product, index) => (
              <ProductCard key={product.id} product={product} onDelete={onDelete} onConsume={onConsume} onEdit={onEdit} onOpenSauce={onOpenSauce} index={index} />
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="product-list-container">
      {products.length >= 30 && (
        <div className="product-search-bar">
          <svg className="product-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="product-search-input"
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('productList.searchPlaceholder')}
            autoComplete="off"
          />
          {searchQuery && (
            <button className="product-search-clear" onClick={() => setSearchQuery('')} aria-label={t('productList.searchClear')}>×</button>
          )}
        </div>
      )}
      {products.length === 0 ? (
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
      ) : normalizedQuery && filtered.length === 0 ? (
        <div className="product-search-empty">
          <p>{t('productList.searchNoResults', { query: searchQuery })}</p>
        </div>
      ) : (
        <>
          {expiredProducts.length > 0 && (
            <div className="product-section product-section--expired">
              <div className="product-section-header">
                <span className="product-section-label">{t('productList.sectionExpired')}</span>
                <span className="product-section-line" />
                <span className="product-section-count">{expiredProducts.length}</span>
              </div>
              {renderGrid(expiredProducts)}
            </div>
          )}

          {expiringSoonProducts.length > 0 && (
            <div className="product-section product-section--expiring">
              <div className="product-section-header">
                <span className="product-section-label">{t('productList.sectionExpiringSoon')}</span>
                <span className="product-section-line" />
                <span className="product-section-count">{expiringSoonProducts.length}</span>
              </div>
              {renderGrid(expiringSoonProducts)}
            </div>
          )}

          {freshProducts.length > 0 && (
            <div className="product-section product-section--fresh">
              <div className="product-section-header">
                <span className="product-section-label">{t('productList.sectionFresh')}</span>
                <span className="product-section-line" />
                <span className="product-section-count">{freshProducts.length}</span>
              </div>
              {renderGrid(freshProducts)}
            </div>
          )}
        </>
      )}

      {consumedProducts.length > 0 && (
        <div className="consumed-section">
          <button
            className="consumed-section-header"
            onClick={() => setConsumedExpanded(prev => !prev)}
          >
            <span className="consumed-section-title">{t('productList.recentlyConsumed')}</span>
            <span className="consumed-section-count">{consumedProducts.length}</span>
            <span className={`consumed-chevron${consumedExpanded ? ' expanded' : ''}`}>›</span>
          </button>
          {consumedExpanded && (
            <ul className="consumed-list">
              {consumedProducts.map(p => (
                <li key={p.id} className="consumed-item">
                  <span className="consumed-name">{p.name}</span>
                  <span className="consumed-qty">{p.quantity} {p.unit}</span>
                  <span className="consumed-when">{p.consumedAt ? getRelativeDay(p.consumedAt, t) : ''}</span>
                  <button
                    className="restore-btn"
                    onClick={() => onRestore(p.id)}
                    title={t('productList.restore')}
                  >
                    ↩
                  </button>
                  <button
                    className="consumed-delete-btn"
                    onClick={() => onDeleteConsumed(p.id)}
                    title={t('productCard.delete')}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {products.length > 0 && (
        <div className="clear-fridge-row">
          <button className="clear-fridge-btn" onClick={() => setShowClearModal(true)}>
            {t('productList.clearFridge')}
          </button>
        </div>
      )}

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
