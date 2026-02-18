import { Product } from '../types/Product';
import { ProductCard } from './ProductCard';
import { isExpired, isExpiringSoon } from '../utils/storage';
import './ProductList.css';

interface ProductListProps {
  products: Product[];
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}

export const ProductList = ({ products, onDelete, onEdit }: ProductListProps) => {
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
        <h3>Nothing here yet</h3>
        <p>Start by adding what's in your fridge</p>
      </div>
    );
  }

  // Trier les produits : expirés d'abord, puis ceux qui expirent bientôt
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
              ⚠️ {expiredCount} expired product{expiredCount > 1 ? 's' : ''}
            </div>
          )}
          {expiringSoonCount > 0 && (
            <div className="alert alert-expiring">
              ⏰ {expiringSoonCount} product{expiringSoonCount > 1 ? 's' : ''} expiring soon
            </div>
          )}
        </div>
      )}
      
      <div className="product-grid">
        {sortedProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
};

