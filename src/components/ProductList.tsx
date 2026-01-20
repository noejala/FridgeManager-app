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
        <div className="empty-icon">🧊</div>
        <h3>Your fridge is empty</h3>
        <p>Add your first products to start managing them!</p>
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

