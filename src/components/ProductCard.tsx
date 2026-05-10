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
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const englishName = singularize(toEnglishIngredient(product.name));
  const ingredientImg = `https://www.themealdb.com/images/ingredients/${encodeURIComponent(englishName)}-Small.png`;
  const [imgHidden, setImgHidden] = useState(false);

  const categoryEmoji: Record<string, string> = {
    Fruits: '🍎', Vegetables: '🥦', Meat: '🥩', Fish: '🐟',
    Dairy: '🧀', Cheese: '🧀', Butter: '🧈', Milk: '🥛',
    Cream: '🫙', Juice: '🍊', Beverages: '🥤', Sauces: '🫙',
    Prepared: '🍱', Frozen: '🧊', Other: '🛒',
  };

  const getProductEmoji = (name: string): string => {
    const n = name.toLowerCase();
    if (/pizza/.test(n)) return '🍕';
    if (/ravioli|pâtes?|pasta|spaghetti|tagliatelle|fusilli|penne|lasagne|gnocchi/.test(n)) return '🍝';
    if (/champignon|pleurote|mushroom|shiitake|portobello/.test(n)) return '🍄';
    if (/poulet|chicken|volaille|dinde|turkey/.test(n)) return '🍗';
    if (/saumon|salmon/.test(n)) return '🐟';
    if (/thon|tuna|sardine|cabillaud|sole|truite/.test(n)) return '🐟';
    if (/crevette|shrimp|prawn|homard|lobster/.test(n)) return '🦐';
    if (/boeuf|beef|steak|viande hach|agneau|lamb|veau|porc|pork/.test(n)) return '🥩';
    if (/jambon|ham|saucisse|sausage|merguez|chorizo/.test(n)) return '🥩';
    if (/oeuf|egg/.test(n)) return '🥚';
    if (/lait|milk/.test(n)) return '🥛';
    if (/fromage|cheese|comté|brie|camembert|emmental|gruyère|parmesan/.test(n)) return '🧀';
    if (/beurre|butter/.test(n)) return '🧈';
    if (/yaourt|yogourt|yogurt/.test(n)) return '🥛';
    if (/banane|banana/.test(n)) return '🍌';
    if (/fraise|strawberry/.test(n)) return '🍓';
    if (/citron|lemon/.test(n)) return '🍋';
    if (/orange|clémentine/.test(n)) return '🍊';
    if (/raisin|grape/.test(n)) return '🍇';
    if (/pomme(?! de terre)|apple/.test(n)) return '🍎';
    if (/poire|pear/.test(n)) return '🍐';
    if (/pêche|peach|abricot|apricot/.test(n)) return '🍑';
    if (/cerise|cherry/.test(n)) return '🍒';
    if (/ananas|pineapple/.test(n)) return '🍍';
    if (/mangue|mango/.test(n)) return '🥭';
    if (/pastèque|watermelon|melon/.test(n)) return '🍉';
    if (/tomate|tomato/.test(n)) return '🍅';
    if (/carotte|carrot/.test(n)) return '🥕';
    if (/brocoli|broccoli/.test(n)) return '🥦';
    if (/concombre|cucumber/.test(n)) return '🥒';
    if (/poivron|pepper/.test(n)) return '🫑';
    if (/courgette|zucchini/.test(n)) return '🥬';
    if (/épinard|spinach/.test(n)) return '🥬';
    if (/salade|lettuce/.test(n)) return '🥗';
    if (/pomme de terre|potato|patate/.test(n)) return '🥔';
    if (/oignon|onion/.test(n)) return '🧅';
    if (/ail|garlic/.test(n)) return '🧄';
    if (/avocat|avocado/.test(n)) return '🥑';
    if (/maïs|corn/.test(n)) return '🌽';
    if (/pain|bread|baguette/.test(n)) return '🍞';
    if (/croissant/.test(n)) return '🥐';
    if (/chocolat|chocolate/.test(n)) return '🍫';
    if (/gâteau|cake|tarte|pie/.test(n)) return '🎂';
    if (/glace|ice cream/.test(n)) return '🍦';
    if (/riz|rice/.test(n)) return '🍚';
    if (/soupe|soup/.test(n)) return '🍲';
    if (/miel|honey/.test(n)) return '🍯';
    if (/café|coffee/.test(n)) return '☕';
    if (/thé|tea/.test(n)) return '🍵';
    if (/bière|beer/.test(n)) return '🍺';
    if (/vin|wine/.test(n)) return '🍷';
    if (/eau|water/.test(n)) return '💧';
    if (/jus|juice/.test(n)) return '🧃';
    if (/mayonnaise|mayo|ketchup|moutarde|mustard/.test(n)) return '🫙';
    return categoryEmoji[product.category] ?? '🛒';
  };

  const fallbackEmoji = getProductEmoji(product.name);

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

  const getCompactDays = () => {
    if (expired) return isDDM ? 'DDM' : t('productCard.expired');
    if (daysUntil === 0) return 'Auj.';
    if (daysUntil < 14) return `+${daysUntil}j`;
    if (daysUntil < 60) return `+${Math.round(daysUntil / 7)}sem`;
    return `+${Math.round(daysUntil / 30)}m`;
  };

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
      <span className="status-dot" />
      <div className="product-card-toggle" onClick={() => setExpanded(p => !p)}>
        {imgHidden ? (
          <span className="product-img-fallback">{fallbackEmoji}</span>
        ) : (
          <img
            className="product-img"
            src={ingredientImg}
            alt=""
            aria-hidden="true"
            onError={() => setImgHidden(true)}
          />
        )}
        <h3 className="product-name">{product.name}</h3>
        <span className={`product-days ${getStatusClass()}`}>{getCompactDays()}</span>
        <span className="product-qty-tile">{product.quantity} {product.unit}</span>
      </div>

      {isExpanded && (
        <div className="product-card-body">
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
