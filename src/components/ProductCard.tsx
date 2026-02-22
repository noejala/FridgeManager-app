import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { getDaysUntilExpiration, isExpired, isExpiringSoon } from '../utils/storage';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}

export const ProductCard = ({ product, onDelete, onEdit }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
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

  return (
    <div className={`product-card ${getStatusClass()}`}>
      <div className="product-header">
        <h3>{product.name}</h3>
        <div className="product-actions">
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
            onClick={() => onDelete(product.id)}
            aria-label={t('productCard.delete')}
            title={t('productCard.delete')}
          >
            ×
          </button>
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
