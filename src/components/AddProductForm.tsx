import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductCategory } from '../types/Product';
import { guessCategory } from '../utils/categoryMapping';
import { estimateExpirationDate, isProductRecognized } from '../utils/shelfLife';
import { lookupBarcode } from '../utils/foodFactsApi';
import { BarcodeScanner } from './BarcodeScanner';
import './AddProductForm.css';

interface AddProductFormProps {
  onAdd: (product: Omit<Product, 'id' | 'addedDate'>) => Promise<void>;
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

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
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Other');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState('unit');
  const [unknownExpiration, setUnknownExpiration] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expDay, setExpDay] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 6 }, (_, i) => currentYear + i);
  const daysInSelectedMonth = expYear && expMonth
    ? new Date(parseInt(expYear), parseInt(expMonth), 0).getDate()
    : 31;

  const DATE_PRESETS = [
    { label: '3j',    days: 3 },
    { label: '1 sem', days: 7 },
    { label: '2 sem', days: 14 },
    { label: '1 mois', months: 1 },
    { label: '3 mois', months: 3 },
    { label: '6 mois', months: 6 },
    { label: '1 an',  months: 12 },
  ] as const;

  const applyPreset = (preset: typeof DATE_PRESETS[number]) => {
    const d = new Date();
    if ('months' in preset) {
      d.setMonth(d.getMonth() + preset.months);
    } else {
      d.setDate(d.getDate() + preset.days);
    }
    const [y, m, day] = d.toISOString().split('T')[0].split('-');
    setExpYear(y);
    setExpMonth(m);
    setExpDay(day);
    setExpirationDate(`${y}-${m}-${day}`);
    setActivePreset(preset.label);
  };

  const handleDatePart = (part: 'day' | 'month' | 'year', val: string) => {
    const newDay   = part === 'day'   ? val : expDay;
    const newMonth = part === 'month' ? val : expMonth;
    const newYear  = part === 'year'  ? val : expYear;
    if (part === 'day')   setExpDay(val);
    if (part === 'month') setExpMonth(val);
    if (part === 'year')  setExpYear(val);
    setActivePreset(null);
    if (newDay && newMonth && newYear) {
      setExpirationDate(`${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`);
    } else {
      setExpirationDate('');
    }
  };

  const recognized = isProductRecognized(name);

  const handleBarcodeDetected = async (barcode: string) => {
    setIsScanning(false);
    setIsOpen(true);
    setIsLookingUp(true);
    setLookupError(null);

    const result = await lookupBarcode(barcode);

    if (result) {
      setName(result.name);
      setCategory(result.category === 'Other' ? guessCategory(result.name) : result.category);
      setQuantity(String(result.quantity));
      setUnit(result.unit);
    } else {
      setLookupError('Produit non trouvé. Remplissez le formulaire manuellement.');
    }

    setIsLookingUp(false);
  };

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
    await onAdd({
      name: name.trim(),
      category,
      expirationDate: finalExpirationDate,
      quantity: quantityNum,
      unit,
      isEstimatedExpiration: unknownExpiration && recognized,
    });
    setIsLoading(false);

    setName('');
    setCategory('Other');
    setExpirationDate('');
    setQuantity('1');
    setUnit('unit');
    setUnknownExpiration(false);
    setPurchaseDate('');
    setExpDay('');
    setExpMonth('');
    setExpYear('');
    setActivePreset(null);
    setIsOpen(false);
  };

  const minDate = new Date().toISOString().split('T')[0];

  if (!isOpen) {
    return (
      <>
        {isScanning && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setIsScanning(false)}
          />
        )}
        <div className="add-product-actions">
          <button className="add-product-btn" onClick={() => setIsOpen(true)}>
            + {t('form.addProduct')}
          </button>
          <button
            className="scan-product-btn"
            onClick={() => setIsScanning(true)}
            title="Scanner un code-barres"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="5" height="5" rx="1"/>
              <rect x="16" y="3" width="5" height="5" rx="1"/>
              <rect x="3" y="16" width="5" height="5" rx="1"/>
              <path d="M16 16h2v2h-2zM18 18h2v2h-2zM16 20h2"/>
              <path d="M20 16v2"/>
            </svg>
            <span className="scan-btn-label-short">Scanner</span>
            <span className="scan-btn-label-long">Scanner un produit</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {isScanning && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setIsScanning(false)}
        />
      )}
      <form className="add-product-form" onSubmit={handleSubmit}>
        <div className="form-title-row">
          <h2>{t('form.addProduct')}</h2>
          <button
            type="button"
            className="scan-inline-btn"
            onClick={() => setIsScanning(true)}
            disabled={isLookingUp || isLoading}
            title="Scanner un code-barres"
          >
            {isLookingUp ? (
              <span className="scan-inline-spinner" />
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5" rx="1"/>
                <rect x="16" y="3" width="5" height="5" rx="1"/>
                <rect x="3" y="16" width="5" height="5" rx="1"/>
                <path d="M16 16h2v2h-2zM18 18h2v2h-2zM16 20h2"/>
                <path d="M20 16v2"/>
              </svg>
            )}
            {isLookingUp ? 'Recherche…' : 'Scanner'}
          </button>
        </div>

        {lookupError && (
          <div className="lookup-error">
            {lookupError}
          </div>
        )}

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
              if (lookupError) setLookupError(null);
            }}
            required
            disabled={isLookingUp}
            placeholder={isLookingUp ? 'Recherche en cours…' : t('form.productPlaceholder')}
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
              <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
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

      {unknownExpiration && recognized ? (
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
      ) : unknownExpiration && !recognized ? (
        <div className="form-group">
          <p className="unknown-product-warning">{t('form.unknownProductWarning')}</p>
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
      ) : (
        <div className="form-group">
          <label>{t('form.expirationDate')}</label>
          <div className="date-presets">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`date-preset-btn${activePreset === preset.label ? ' date-preset-btn--active' : ''}`}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {/* Desktop : date picker natif */}
          <input
            className="date-input-desktop"
            type="date"
            value={expirationDate}
            onChange={(e) => {
              const val = e.target.value;
              setExpirationDate(val);
              setActivePreset(null);
              if (val) {
                const [y, m, d] = val.split('-');
                setExpYear(y); setExpMonth(m); setExpDay(d);
              } else {
                setExpYear(''); setExpMonth(''); setExpDay('');
              }
            }}
            min={minDate}
          />
          {/* Mobile : 3 selects */}
          <div className="date-selects">
            <select
              value={expDay}
              onChange={(e) => handleDatePart('day', e.target.value)}
            >
              <option value="">Jour</option>
              {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(d => (
                <option key={d} value={String(d)}>{d}</option>
              ))}
            </select>
            <select
              value={expMonth}
              onChange={(e) => handleDatePart('month', e.target.value)}
            >
              <option value="">Mois</option>
              {MONTHS_FR.map((name, i) => (
                <option key={i} value={String(i + 1)}>{name}</option>
              ))}
            </select>
            <select
              value={expYear}
              onChange={(e) => handleDatePart('year', e.target.value)}
            >
              <option value="">Année</option>
              {YEARS.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={() => setIsOpen(false)} disabled={isLoading || isLookingUp}>
          {t('form.cancel')}
        </button>
        <button type="submit" className="submit-btn" disabled={isLoading || isLookingUp}>
          {isLoading ? t('form.adding') : t('form.add')}
        </button>
      </div>
    </form>
    </>
  );
};
