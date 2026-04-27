import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { REGIONS, seasonalDataByRegion, productEmojiMap, FRUITS, getNearestRegion, type RegionId } from '../utils/seasonalData';
import { fetchProductFunFacts } from '../utils/mistralApi';
import './SeasonalProducts.css';

export const SeasonalProducts = ({ isActive }: { isActive: boolean }) => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedRegion, setSelectedRegion] = useState<RegionId>(() => {
    return (localStorage.getItem('seasonal-region') as RegionId) || 'france';
  });
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [detecting, setDetecting] = useState(false);

  const [funFactProduct, setFunFactProduct] = useState<string | null>(null);
  const [funFacts, setFunFacts] = useState<string[]>([]);
  const [loadingFunFacts, setLoadingFunFacts] = useState(false);
  const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true';

  useEffect(() => {
    localStorage.setItem('seasonal-region', selectedRegion);
  }, [selectedRegion]);

  useEffect(() => {
    if (isActive) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
  }, [isActive]);

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const handleDetectRegion = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setSelectedRegion(getNearestRegion(coords.latitude, coords.longitude));
        setDetecting(false);
      },
      () => setDetecting(false),
      { timeout: 8000 }
    );
  };

  const handleProductClick = async (product: string) => {
    if (!aiEnabled) return;
    setFunFactProduct(product);
    setFunFacts([]);
    setLoadingFunFacts(true);
    const facts = await fetchProductFunFacts(product, i18n.language);
    setFunFacts(facts);
    setLoadingFunFacts(false);
  };

  const entry = seasonalDataByRegion[selectedRegion][selectedMonth];
  const products = entry.products;
  const fruits = products.filter(p => FRUITS.has(p));
  const vegetables = products.filter(p => !FRUITS.has(p));
  const seasonName = entry.season.toLowerCase();

  const renderProductCard = (product: string, index: number) => (
    <div
      key={product}
      className={`seasonal-product-card${aiEnabled ? ' seasonal-product-card--clickable' : ''}`}
      style={{ '--index': index } as React.CSSProperties}
      onClick={() => handleProductClick(product)}
    >
      <div className="product-emoji">{productEmojiMap[product] || '🥬'}</div>
      <p>{t(`seasonal.products.${product}`, { defaultValue: product })}</p>
    </div>
  );

  return (
    <div className="seasonal-products">
      <div className="seasonal-header">
        <h2>{t('seasonal.title')}</h2>
      </div>

      <div className="region-selector">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            className={`region-btn${selectedRegion === region.id ? ' region-btn-active' : ''}`}
            onClick={() => setSelectedRegion(region.id)}
          >
            <span>{region.flag}</span>
            <span>{region.name}</span>
          </button>
        ))}
        <button
          className={`region-btn detect-btn${detecting ? ' detect-btn-loading' : ''}`}
          onClick={handleDetectRegion}
          disabled={detecting || !navigator.geolocation}
          aria-label={t('seasonal.detectRegion')}
          title={t('seasonal.detectRegion')}
        >
          {detecting ? '⋯' : '📍'}
        </button>
      </div>

      <div className="month-nav">
        <button className="month-nav-btn" onClick={prevMonth} aria-label="prev">‹</button>
        <div className="month-nav-center">
          <span className="month-nav-label">
            {t(`seasonal.months.${selectedMonth}`)}
            {selectedYear !== currentYear ? ` ${selectedYear}` : ''}
          </span>
          <span className={`season-indicator season-indicator-${seasonName}`}>
            {t(`seasonal.season.${seasonName}`)}
          </span>
        </div>
        <button className="month-nav-btn" onClick={nextMonth} aria-label="next">›</button>
      </div>

      <div className="seasonal-content">
        {vegetables.length > 0 && (
          <div className="products-section">
            <h3 className="products-section-title">{t('seasonal.vegetables')}</h3>
            <div className="products-grid">
              {vegetables.map((product, index) => renderProductCard(product, index))}
            </div>
          </div>
        )}
        {fruits.length > 0 && (
          <div className="products-section">
            <h3 className="products-section-title">{t('seasonal.fruits')}</h3>
            <div className="products-grid">
              {fruits.map((product, index) => renderProductCard(product, index + vegetables.length))}
            </div>
          </div>
        )}
      </div>

      {funFactProduct && (
        <div className="modal-overlay" onClick={() => setFunFactProduct(null)}>
          <div className="modal-content funfact-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setFunFactProduct(null)}>✕</button>
            <div className="funfact-header">
              <span className="funfact-emoji">{productEmojiMap[funFactProduct] || '🥬'}</span>
              <h2>{t(`seasonal.products.${funFactProduct}`, { defaultValue: funFactProduct })}</h2>
            </div>
            <p className="funfact-label">{t('seasonal.funFactLabel')}</p>
            {loadingFunFacts ? (
              <div className="funfact-loading">
                <div className="funfact-skeleton" />
                <div className="funfact-skeleton" />
                <div className="funfact-skeleton" />
              </div>
            ) : funFacts.length > 0 ? (
              <ul className="funfact-list">
                {funFacts.map((fact, i) => (
                  <li key={i} className="funfact-item">
                    <span className="funfact-bullet">✦</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="funfact-error">{t('seasonal.funFactError')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
