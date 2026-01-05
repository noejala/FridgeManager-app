import { Product } from '../types/Product';
import { getDaysUntilExpiration, isExpired, isExpiringSoon } from '../utils/storage';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
}

export const ProductCard = ({ product, onDelete }: ProductCardProps) => {
  const daysUntil = getDaysUntilExpiration(product.expirationDate);
  const expired = isExpired(product.expirationDate);
  const expiringSoon = isExpiringSoon(product.expirationDate);

  const getStatusClass = () => {
    if (expired) return 'status-expired';
    if (expiringSoon) return 'status-expiring';
    return 'status-ok';
  };

  const getStatusText = () => {
    if (expired) return 'Expiré';
    if (expiringSoon) return `Expire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
    return `Expire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;
  };

  return (
    <div className={`product-card ${getStatusClass()}`}>
      <div className="product-header">
        <h3>{product.name}</h3>
        <button 
          className="delete-btn" 
          onClick={() => onDelete(product.id)}
          aria-label="Supprimer"
        >
          ×
        </button>
      </div>
      <div className="product-info">
        <span className="category">{product.category}</span>
        <span className="quantity">
          {product.quantity} {product.unit}
        </span>
      </div>
      <div className="product-dates">
        <div className="date-info">
          <span className="label">Ajouté le:</span>
          <span>{new Date(product.addedDate).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="date-info">
          <span className="label">Expire le:</span>
          <span>{new Date(product.expirationDate).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>
      <div className={`status-badge ${getStatusClass()}`}>
        {getStatusText()}
      </div>
    </div>
  );
};

