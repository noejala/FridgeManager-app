import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductCategory } from '../types/Product';
import { guessCategory } from '../utils/categoryMapping';
import { getDefaultExpirationDateType } from '../utils/expirationDateType';
import { estimateExpirationDate, isProductRecognized } from '../utils/shelfLife';
import { AppDropdown } from './AppDropdown';
import { DatePicker } from './DatePicker';
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
  'Cheese',
  'Butter',
  'Beverages',
  'Sauces',
  'Prepared',
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
  const [expirationDateType, setExpirationDateType] = useState<'dlc' | 'ddm'>(
    product.expirationDateType ?? getDefaultExpirationDateType(product.category as ProductCategory)
  );
  const [purchaseDate, setPurchaseDate] = useState('');

  useEffect(() => {
    setName(product.name);
    setCategory(product.category as ProductCategory);
    setExpirationDate(product.expirationDate);
    setQuantity(product.quantity.toString());
    setUnit(product.unit);
    setUnknownExpiration(product.isEstimatedExpiration ?? false);
    setExpirationDateType(product.expirationDateType ?? getDefaultExpirationDateType(product.category as ProductCategory));
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
      expirationDateType,
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
          <AppDropdown
            id="edit-category"
            value={category}
            options={CATEGORIES.map(cat => ({ value: cat, label: t(`categories.${cat}`) }))}
            onChange={(v) => setCategory(v as ProductCategory)}
          />
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
          <AppDropdown
            id="edit-unit"
            value={unit}
            options={[
              { value: 'unit', label: 'unit' },
              { value: 'kg', label: 'kg' },
              { value: 'g', label: 'g' },
              { value: 'L', label: 'L' },
              { value: 'mL', label: 'mL' },
              { value: 'pack', label: 'pack' },
            ]}
            onChange={setUnit}
          />
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

      <div className="form-group">
        <label>{t('form.expirationDateType')}</label>
        <div className="expiry-type-toggle">
          <button
            type="button"
            className={`expiry-type-btn${expirationDateType === 'ddm' ? ' active' : ''}`}
            onClick={() => setExpirationDateType('ddm')}
          >
            <span className="expiry-type-label">{t('form.ddm')}</span>
            <span className="expiry-type-desc">{t('form.ddmDesc')}</span>
          </button>
          <button
            type="button"
            className={`expiry-type-btn${expirationDateType === 'dlc' ? ' active' : ''}`}
            onClick={() => setExpirationDateType('dlc')}
          >
            <span className="expiry-type-label">{t('form.dlc')}</span>
            <span className="expiry-type-desc">{t('form.dlcDesc')}</span>
          </button>
        </div>
      </div>

      {unknownExpiration && recognized ? (
        <div className="form-group">
          <label htmlFor="edit-purchaseDate">{t('form.whenDidYouBuy')}</label>
          <div className="purchase-date-row">
            <DatePicker
              id="edit-purchaseDate"
              value={purchaseDate}
              onChange={setPurchaseDate}
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
          <DatePicker
            id="edit-expirationDate"
            value={expirationDate}
            onChange={setExpirationDate}
            min={minDate}
          />
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="edit-expirationDate">{t('form.expirationDate')}</label>
          <DatePicker
            id="edit-expirationDate"
            value={expirationDate}
            onChange={setExpirationDate}
            min={minDate}
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
