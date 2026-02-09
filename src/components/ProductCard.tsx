import { Product } from '../types/Product';
import { getDaysUntilExpiration, isExpired, isExpiringSoon } from '../utils/storage';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}

export const ProductCard = ({ product, onDelete, onEdit }: ProductCardProps) => {
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const expired = isExpired(product.expirationDate);
  const expiringSoon = isExpiringSoon(product.expirationDate);

  const getStatusClass = () => {
    if (expired) return 'status-expired';
    if (expiringSoon) return 'status-expiring';
    return 'status-ok';
  };

  const getStatusText = () => {
    if (expired) return 'Expired';
    if (expiringSoon) return `Expires in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
    return `Expires in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`;
  };

  return (
    <div className={`product-card ${getStatusClass()}`}>
      <div className="product-header">
        <h3>{product.name}</h3>
        <div className="product-actions">
          <button 
            className="edit-btn" 
            onClick={() => onEdit(product)}
            aria-label="Edit"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            className="delete-btn" 
            onClick={() => onDelete(product.id)}
            aria-label="Delete"
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
      <div className="product-info">
        <span className="category">{product.category}</span>
        <span className="quantity">
          {product.quantity} {product.unit}
        </span>
      </div>
      <div className="product-dates">
        <div className="date-info">
          <span className="label">Added:</span>
          <span>{new Date(product.addedDate).toLocaleDateString('en-US')}</span>
        </div>
        <div className="date-info">
          <span className="label">Expires:</span>
          <span>
            {product.isEstimatedExpiration ? '~' : ''}
            {new Date(product.expirationDate).toLocaleDateString('en-US')}
            {product.isEstimatedExpiration ? ' (estimated)' : ''}
          </span>
        </div>
      </div>
      <div className={`status-badge ${getStatusClass()}`}>
        {getStatusText()}
      </div>
    </div>
  );
};

