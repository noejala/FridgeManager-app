import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, ProductCategory } from '../types/Product';
import { guessCategory } from '../utils/categoryMapping';
import { getDefaultExpirationDateType } from '../utils/expirationDateType';
import { estimateExpirationDate, estimateExpirationFromOpenDate, isProductRecognized } from '../utils/shelfLife';
import { lookupBarcode, FoodFactsResult } from '../utils/foodFactsApi';
import { BarcodeScanner } from './BarcodeScanner';
import { AppDropdown } from './AppDropdown';
import { DatePicker } from './DatePicker';
import './AddProductForm.css';

interface AddProductFormProps {
  onAdd: (product: Omit<Product, 'id' | 'addedDate'>) => Promise<void>;
  isFormOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
  prefill?: FoodFactsResult | null;
  onPrefillApplied?: () => void;
  onScanBarcode?: (barcode: string) => void;
  onVoiceStart?: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Fruits',
  'Vegetables',
  'Meat',
  'Fish',
  'Dairy',
  'Cheese',
  'Butter',
  'Milk',
  'Cream',
  'Juice',
  'Beverages',
  'Frozen',
  'Sauces',
  'Other'
];

const isOpenableCategory = (cat: ProductCategory) =>
  ['Sauces', 'Milk', 'Juice', 'Cream'].includes(cat);



export const AddProductForm = ({ onAdd, isFormOpen, onFormOpenChange, prefill, onPrefillApplied, onScanBarcode, onVoiceStart }: AddProductFormProps) => {
  const { t } = useTranslation();
  const [fabOpen, setFabOpen] = useState(false);
  const [fabVisible, setFabVisible] = useState(true);
  const [voiceTried, setVoiceTried] = useState(() => localStorage.getItem('voice-tried') === '1');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 60) {
        setFabVisible(false);
        setFabOpen(false);
      } else {
        setFabVisible(true);
      }
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isFormOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [isFormOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Other');
  const [expirationDateType, setExpirationDateType] = useState<'dlc' | 'ddm'>('ddm');
  const [expirationDate, setExpirationDate] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unit, setUnit] = useState('unit');
  const [unknownExpiration, setUnknownExpiration] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState('');
  const [isOpened, setIsOpened] = useState(false);
  const [sauceOpenedDate, setSauceOpenedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!prefill) return;
    setName(prefill.name);
    const cat = prefill.category === 'Other' ? guessCategory(prefill.name) : prefill.category;
    setCategory(cat);
    setExpirationDateType(getDefaultExpirationDateType(cat));
    setQuantity(String(prefill.quantity));
    setUnit(prefill.unit);
    setShowDetails(true);
    onPrefillApplied?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const recognized = isProductRecognized(name);

  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    setIsScanning(false);

    // When scanning from the fridge tab, delegate to App.tsx which owns the add-product form
    if (onScanBarcode) {
      onScanBarcode(barcode);
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);

    const result = await lookupBarcode(barcode);

    if (result) {
      setName(result.name);
      setCategory(result.category === 'Other' ? guessCategory(result.name) : result.category);
      setQuantity(String(result.quantity));
      setUnit(result.unit);
      setShowDetails(true);
    } else {
      setLookupError('Produit non trouvé. Remplissez le formulaire manuellement.');
    }

    setIsLookingUp(false);
  }, [onFormOpenChange, onScanBarcode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSauceOpened = isOpenableCategory(category) && isOpened;
    const finalExpirationDate = isSauceOpened
      ? estimateExpirationFromOpenDate(name, sauceOpenedDate)
      : (unknownExpiration && recognized)
        ? estimateExpirationDate(name, purchaseDate || undefined)
        : expirationDate;
    if (!name || !finalExpirationDate) {
      if (!finalExpirationDate) setDateError(true);
      return;
    }

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
      isEstimatedExpiration: isSauceOpened || (unknownExpiration && recognized),
      expirationDateType,
      openedDate: isSauceOpened ? sauceOpenedDate : undefined,
    });
    setIsLoading(false);

    setName('');
    setCategory('Other');
    setExpirationDate('');
    setQuantity('1');
    setUnit('unit');
    setUnknownExpiration(false);
    setExpirationDateType('ddm');
    setPurchaseDate('');
    setIsOpened(false);
    setSauceOpenedDate(new Date().toISOString().split('T')[0]);
    setShowDetails(false);
    onFormOpenChange(false);
  };

  const minDate = new Date().toISOString().split('T')[0];
  const yesterdayDate = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();

  if (!isFormOpen) {
    return (
      <>
        {isScanning && (
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setIsScanning(false)}
          />
        )}

        {/* Desktop buttons */}
        <div className="add-product-actions">
          <button className="add-product-btn" onClick={() => onFormOpenChange(true)}>
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
          {onVoiceStart && (
            <button
              className="scan-product-btn"
              onClick={onVoiceStart}
              title={t('voice.title')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3"/>
                <path d="M5 10a7 7 0 0 0 14 0"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="8" y1="22" x2="16" y2="22"/>
              </svg>
              <span className="scan-btn-label-short">{t('voice.dictate')}</span>
            </button>
          )}
        </div>

        {/* Mobile FAB speed dial */}
        {fabOpen && (
          <div className="fab-backdrop" onClick={() => setFabOpen(false)} />
        )}
        <div className={`fab-container${fabOpen ? ' fab-open' : ''}${!fabVisible || isScanning ? ' fab-hidden' : ''}`}>
          <div className="fab-actions">
            {onVoiceStart && (
              <div className="fab-action">
                <span className="fab-action-label">{t('voice.dictate')}</span>
                <button
                  className="fab-action-btn"
                  onClick={() => { setFabOpen(false); onVoiceStart(); }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="12" rx="3"/>
                    <path d="M5 10a7 7 0 0 0 14 0"/>
                    <line x1="12" y1="19" x2="12" y2="22"/>
                    <line x1="8" y1="22" x2="16" y2="22"/>
                  </svg>
                </button>
              </div>
            )}
            <div className="fab-action">
              <span className="fab-action-label">Scanner</span>
              <button
                className="fab-action-btn"
                onClick={() => { setFabOpen(false); setIsScanning(true); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="5" rx="1"/>
                  <rect x="16" y="3" width="5" height="5" rx="1"/>
                  <rect x="3" y="16" width="5" height="5" rx="1"/>
                  <path d="M16 16h2v2h-2zM18 18h2v2h-2zM16 20h2"/>
                  <path d="M20 16v2"/>
                </svg>
              </button>
            </div>
            <div className="fab-action">
              <span className="fab-action-label">{t('form.addProduct')}</span>
              <button
                className="fab-action-btn"
                onClick={() => { setFabOpen(false); onFormOpenChange(true); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
          <button className="fab-main" onClick={() => setFabOpen(prev => !prev)}>
            <svg className="fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
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
      {onVoiceStart && (
        <div className="voice-mic-fab-wrap">
          {!voiceTried && (
            <div className="voice-mic-bubble">
              Essaye, dicter c'est le plus rapide
              <span className="voice-mic-bubble-arrow" />
            </div>
          )}
          <button
            type="button"
            className="voice-mic-fab"
            onClick={() => {
              onVoiceStart();
              if (!voiceTried) {
                setVoiceTried(true);
                localStorage.setItem('voice-tried', '1');
              }
            }}
            title="Dicter"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          </button>
        </div>
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

        {/* ── Nom du produit ── */}
        <div className="form-group">
          <label htmlFor="name">{t('form.productName')}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              const guessed = guessCategory(newName);
              setCategory(guessed);
              setExpirationDateType(getDefaultExpirationDateType(guessed));
              if (lookupError) setLookupError(null);
            }}
            required
            disabled={isLookingUp}
            placeholder={isLookingUp ? 'Recherche en cours…' : t('form.productPlaceholder')}
          />
          {name && !showDetails && (
            <button
              type="button"
              className="category-badge"
              onClick={() => setShowDetails(true)}
            >
              {t(`categories.${category}`)}
              <span className="category-badge-edit">· Modifier</span>
            </button>
          )}
        </div>

        {/* ── Sauce ouverte / date inconnue ── */}
        {isOpenableCategory(category) ? (
          <div className="form-group sauce-opened-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isOpened}
                onChange={(e) => setIsOpened(e.target.checked)}
              />
              {t('form.sauceAlreadyOpened')}
            </label>
            {isOpened && (
              <div className="purchase-date-row" style={{ marginTop: '0.5rem' }}>
                <DatePicker
                  value={sauceOpenedDate}
                  onChange={setSauceOpenedDate}
                  max={minDate}
                />
                <button
                  type="button"
                  className={`today-btn${sauceOpenedDate === yesterdayDate ? ' today-btn-active' : ''}`}
                  onClick={() => setSauceOpenedDate(yesterdayDate)}
                >
                  {t('productList.yesterday')}
                </button>
                <button
                  type="button"
                  className={`today-btn${sauceOpenedDate === minDate ? ' today-btn-active' : ''}`}
                  onClick={() => setSauceOpenedDate(minDate)}
                >
                  {t('form.today')}
                </button>
              </div>
            )}
          </div>
        ) : recognized ? (
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
        ) : null}

        {/* ── Date d'expiration ── */}
        {!(isOpenableCategory(category) && isOpened) && (
          unknownExpiration && recognized ? (
            <div className="form-group">
              <label htmlFor="purchaseDate">{t('form.whenDidYouBuy')}</label>
              <div className="purchase-date-row">
                <DatePicker
                  id="purchaseDate"
                  value={purchaseDate}
                  onChange={setPurchaseDate}
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
              <label>{t('form.expirationDate')}</label>
              <DatePicker
                value={expirationDate}
                onChange={(val) => { setExpirationDate(val); if (val) setDateError(false); }}
                min={minDate}
              />
            </div>
          )
        )}

        {dateError && (
          <p className="date-error-msg">Veuillez ajouter une date d'expiration</p>
        )}

        {/* ── Plus d'options ── */}
        <button
          type="button"
          className={`details-toggle${showDetails ? ' details-toggle--open' : ''}`}
          onClick={() => setShowDetails(!showDetails)}
        >
          <svg
            className="details-toggle-chevron"
            width="12" height="12" viewBox="0 0 12 12"
            fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
          {showDetails ? 'Moins d\'options' : 'Plus d\'options'}
        </button>

        {showDetails && (
          <div className="form-details">
            <div className="form-group">
              <label htmlFor="category">{t('form.category')}</label>
              <AppDropdown
                id="category"
                value={category}
                options={CATEGORIES.map(cat => ({ value: cat, label: t(`categories.${cat}`) }))}
                onChange={(v) => {
                  const cat = v as ProductCategory;
                  setCategory(cat);
                  setExpirationDateType(getDefaultExpirationDateType(cat));
                }}
              />
            </div>

            <div className="form-row">
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
                <AppDropdown
                  id="unit"
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

            {!(isOpenableCategory(category) && isOpened) && (
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
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => {
            setName(''); setCategory('Other'); setExpirationDate('');
            setQuantity('1'); setUnit('unit'); setUnknownExpiration(false);
            setExpirationDateType('ddm');
            setPurchaseDate(''); setIsOpened(false);
            setSauceOpenedDate(new Date().toISOString().split('T')[0]);
            setLookupError(null);
            setShowDetails(false);
            onFormOpenChange(false);
          }} disabled={isLoading || isLookingUp}>
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
