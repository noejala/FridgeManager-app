import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductCategory } from '../types/Product';
import { guessCategory } from '../utils/categoryMapping';
import { estimateExpirationDate, isProductRecognized } from '../utils/shelfLife';
import './AddProductForm.css';

interface EditProductFormProps {
  product: Product;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Fruits',
  'Vegetables',
  'Meat',
  'Fish',
  'Dairy',
  'Beverages',
  'Frozen',
  'Other'
];

export const EditProductForm = ({ product, onSave, onCancel }: EditProductFormProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState<ProductCategory>(product.category as ProductCategory);
  const [expirationDate, setExpirationDate] = useState(product.expirationDate);
  const [quantity, setQuantity] = useState<string>(product.quantity.toString());
  const [unit, setUnit] = useState(product.unit);
  const [unknownExpiration, setUnknownExpiration] = useState(product.isEstimatedExpiration ?? false);
  const [purchaseDate, setPurchaseDate] = useState('');

  useEffect(() => {
    setName(product.name);
    setCategory(product.category as ProductCategory);
    setExpirationDate(product.expirationDate);
    setQuantity(product.quantity.toString());
    setUnit(product.unit);
    setUnknownExpiration(product.isEstimatedExpiration ?? false);
  }, [product]);

  const recognized = isProductRecognized(name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalExpirationDate = (unknownExpiration && recognized)
      ? estimateExpirationDate(name, purchaseDate || undefined)
      : expirationDate;
    if (!name || !finalExpirationDate) return;

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert(t('form.quantityError'));
      return;
    }

    setIsLoading(true);
    await onSave({
      ...product,
      name: name.trim(),
      category,
      expirationDate: finalExpirationDate,
      quantity: quantityNum,
      unit,
      isEstimatedExpiration: unknownExpiration && recognized,
    });
    setIsLoading(false);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>{t('form.editProduct')}</h2>

      <div className="form-group">
        <label htmlFor="edit-name">{t('form.productName')}</label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => {
            const newName = e.target.value;
            setName(newName);
            setCategory(guessCategory(newName));
          }}
          required
          placeholder={t('form.productPlaceholder')}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="edit-category">{t('form.category')}</label>
          <select
            id="edit-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="edit-quantity">{t('form.quantity')}</label>
          <input
            id="edit-quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={(e) => {
              const value = e.target.value;
              if (value === '' || Number(value) <= 0) {
                setQuantity('1');
              }
            }}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-unit">{t('form.unit')}</label>
          <select
            id="edit-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="unit">unit</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="L">L</option>
            <option value="mL">mL</option>
            <option value="pack">pack</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={unknownExpiration}
            onChange={(e) => setUnknownExpiration(e.target.checked)}
          />
          {t('form.unknownExpiration')}
        </label>
      </div>

      {unknownExpiration && recognized ? (
        <div className="form-group">
          <label htmlFor="edit-purchaseDate">{t('form.whenDidYouBuy')}</label>
          <div className="purchase-date-row">
            <input
              id="edit-purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={minDate}
            />
            <button
              type="button"
              className="today-btn"
              onClick={() => setPurchaseDate(new Date().toISOString().split('T')[0])}
            >
              {t('form.today')}
            </button>
          </div>
        </div>
      ) : unknownExpiration && !recognized ? (
        <div className="form-group">
          <p className="unknown-product-warning">{t('form.unknownProductWarning')}</p>
          <label htmlFor="edit-expirationDate">{t('form.expirationDate')}</label>
          <input
            id="edit-expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            min={minDate}
            required
          />
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="edit-expirationDate">{t('form.expirationDate')}</label>
          <input
            id="edit-expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            min={minDate}
            required
          />
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel} disabled={isLoading}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? t('form.saving') : t('form.save')}
        </button>
      </div>
    </form>
  );
};
