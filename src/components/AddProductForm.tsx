import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductCategory } from '../types/Product';
import { guessCategory } from '../utils/categoryMapping';
import { estimateExpirationDate } from '../utils/shelfLife';
import './AddProductForm.css';

interface AddProductFormProps {
  onAdd: (product: Omit<Product, 'id' | 'addedDate'>) => void;
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

export const AddProductForm = ({ onAdd }: AddProductFormProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Other');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState('unit');
  const [unknownExpiration, setUnknownExpiration] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalExpirationDate = unknownExpiration
      ? estimateExpirationDate(name, category, purchaseDate || undefined)
      : expirationDate;
    if (!name || !finalExpirationDate) return;

    const quantityNum = Number(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert(t('form.quantityError'));
      return;
    }

    onAdd({
      name: name.trim(),
      category,
      expirationDate: finalExpirationDate,
      quantity: quantityNum,
      unit,
      isEstimatedExpiration: unknownExpiration,
    });

    setName('');
    setCategory('Other');
    setExpirationDate('');
    setQuantity('1');
    setUnit('unit');
    setUnknownExpiration(false);
    setPurchaseDate('');
    setIsOpen(false);
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!isOpen) {
    return (
      <button className="add-product-btn" onClick={() => setIsOpen(true)}>
        + {t('form.addProduct')}
      </button>
    );
  }

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2>{t('form.addProduct')}</h2>

      <div className="form-group">
        <label htmlFor="name">{t('form.productName')}</label>
        <input
          id="name"
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
          <label htmlFor="category">{t('form.category')}</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quantity">{t('form.quantity')}</label>
          <input
            id="quantity"
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
          <label htmlFor="unit">{t('form.unit')}</label>
          <select
            id="unit"
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

      {unknownExpiration ? (
        <div className="form-group">
          <label htmlFor="purchaseDate">{t('form.whenDidYouBuy')}</label>
          <div className="purchase-date-row">
            <input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={minDate}
            />
            <button
              type="button"
              className={`today-btn${purchaseDate === new Date().toISOString().split('T')[0] ? ' today-btn-active' : ''}`}
              onClick={() => setPurchaseDate(new Date().toISOString().split('T')[0])}
            >
              {t('form.today')}
            </button>
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="expirationDate">{t('form.expirationDate')}</label>
          <input
            id="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            min={minDate}
            required
          />
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={() => setIsOpen(false)}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="submit-btn">
          {t('form.add')}
        </button>
      </div>
    </form>
  );
};
