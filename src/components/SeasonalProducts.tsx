import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COUNTRIES, seasonalData, productEmojiMap, productIllustrationMap, FRUITS,
  getNearestLocation,
  type CountryId, type RegionId,
} from '../utils/seasonalData';
import { fetchProductFunFacts } from '../utils/mistralApi';
import './SeasonalProducts.css';

type ImgStage = 'mealdb' | 'svg' | 'emoji';

function ProductIllustration({ product, size }: { product: string; size: number }) {
  const [stage, setStage] = useState<ImgStage>('mealdb');
  const icon = productIllustrationMap[product] ?? 'herb';

  if (stage === 'emoji') {
    return <span style={{ fontSize: size * 0.55 }}>{productEmojiMap[product] ?? '🥬'}</span>;
  }
  if (stage === 'svg') {
    return (
      <img
        src={`/illustrations/seasonal/${icon}.svg`}
        width={size}
        height={size}
        alt=""
        onError={() => setStage('emoji')}
      />
    );
  }
  return (
    <img
      src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(product)}-Small.png`}
      width={size}
      height={size}
      alt=""
      style={{ borderRadius: '50%', objectFit: 'cover' }}
      onError={() => setStage('svg')}
    />
  );
}

function LocationDropdown<T extends string>({
  value, options, onChange, grow = false,
}: {
  value: T;
  options: { id: T; label: string; flag?: string }[];
  onChange: (v: T) => void;
  grow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.id === value);
  return (
    <div className={`loc-dropdown${grow ? ' loc-dropdown--grow' : ''}`}>
      <button className="loc-dropdown-btn" onClick={() => setOpen(o => !o)}>
        {current?.flag && <span>{current.flag}</span>}
        <span className="loc-dropdown-label">{current?.label}</span>
        <span className="dropdown-chevron">▾</span>
      </button>
      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="loc-dropdown-menu">
            {options.map(o => (
              <button
                key={o.id}
                className={`loc-dropdown-item${value === o.id ? ' active' : ''}`}
                onClick={() => { onChange(o.id); setOpen(false); }}
              >
                {o.flag && <span>{o.flag}</span>}
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getInitialSelection(): { country: CountryId; region: RegionId } {
  const storedCountry = localStorage.getItem('seasonal-country') as CountryId | null;
  const storedRegion = localStorage.getItem('seasonal-region') as string | null;

  // Migration from old single-key format
  if (!storedCountry) {
    if (storedRegion === 'france_north' || storedRegion === 'france_south') {
      localStorage.setItem('seasonal-country', 'france');
      return { country: 'france', region: storedRegion as RegionId };
    }
    if (storedRegion === 'dom_tom') {
      localStorage.setItem('seasonal-country', 'france_domtom');
      localStorage.setItem('seasonal-region', 'martinique');
      return { country: 'france_domtom', region: 'martinique' };
    }
    return { country: 'france', region: 'france_north' };
  }

  const config = seasonalData[storedCountry];
  if (!config) return { country: 'france', region: 'france_north' };

  if (config.hasRegions) {
    const validRegions = config.regions.map(r => r.id as RegionId);
    const region = validRegions.includes(storedRegion as RegionId)
      ? (storedRegion as RegionId)
      : config.regions[0].id as RegionId;
    return { country: storedCountry, region };
  }

  return { country: storedCountry, region: 'france_north' };
}

export const SeasonalProducts = ({ isActive }: { isActive: boolean }) => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const initial = useRef(getInitialSelection());
  const [selectedCountry, setSelectedCountry] = useState<CountryId>(initial.current.country);
  const [selectedRegion, setSelectedRegion] = useState<RegionId>(initial.current.region);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [detecting, setDetecting] = useState(false);

  const [funFactProduct, setFunFactProduct] = useState<string | null>(null);
  const [funFacts, setFunFacts] = useState<string[]>([]);
  const [loadingFunFacts, setLoadingFunFacts] = useState(false);
  const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true';

  useEffect(() => {
    if (isActive) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    }
  }, [isActive]);

  const handleCountryChange = (countryId: CountryId) => {
    setSelectedCountry(countryId);
    localStorage.setItem('seasonal-country', countryId);
    const config = seasonalData[countryId];
    if (config.hasRegions) {
      const firstRegion = config.regions[0].id as RegionId;
      const validRegions = config.regions.map(r => r.id as RegionId);
      const next = validRegions.includes(selectedRegion) ? selectedRegion : firstRegion;
      setSelectedRegion(next);
      localStorage.setItem('seasonal-region', next);
    }
  };

  const handleRegionChange = (regionId: RegionId) => {
    setSelectedRegion(regionId);
    localStorage.setItem('seasonal-region', regionId);
  };

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { country, region } = getNearestLocation(coords.latitude, coords.longitude);
        setSelectedCountry(country);
        localStorage.setItem('seasonal-country', country);
        if (region) {
          setSelectedRegion(region);
          localStorage.setItem('seasonal-region', region);
        }
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

  const countryConfig = seasonalData[selectedCountry];
  const entry = countryConfig.hasRegions
    ? countryConfig.data[selectedRegion]?.[selectedMonth]
    : (countryConfig.data as Record<number, { season: string; products: string[] }>)[selectedMonth];

  const products = entry?.products ?? [];
  const fruits = products.filter(p => FRUITS.has(p));
  const vegetables = products.filter(p => !FRUITS.has(p));
  const seasonName = (entry?.season ?? 'winter').toLowerCase();

  const renderProductCard = (product: string, index: number) => (
    <div
      key={product}
      className={`seasonal-product-card${aiEnabled ? ' seasonal-product-card--clickable' : ''}`}
      style={{ '--index': index } as React.CSSProperties}
      onClick={() => handleProductClick(product)}
    >
      <div className="product-emoji">
        <ProductIllustration product={product} size={32} />
      </div>
      <p>{t(`seasonal.products.${product}`, { defaultValue: product })}</p>
    </div>
  );

  return (
    <div className="seasonal-products">
      <div className="seasonal-header">
        <h2>{t('seasonal.title')}</h2>
      </div>

      <div className="location-selector">
        <button
          className={`location-detect-btn${detecting ? ' location-detect-btn--loading' : ''}`}
          onClick={handleDetectLocation}
          disabled={detecting || !navigator.geolocation}
          aria-label={t('seasonal.detectLocation')}
          title={t('seasonal.detectLocation')}
        >
          {detecting ? '⋯' : '📍'}
        </button>
        <LocationDropdown
          grow
          value={selectedCountry}
          options={COUNTRIES.map(c => ({ id: c.id, label: c.name, flag: c.flag }))}
          onChange={handleCountryChange}
        />
        {countryConfig.hasRegions && (
          <>
            <span className="location-separator" />
            <LocationDropdown
              value={selectedRegion}
              options={countryConfig.regions.map(r => ({ id: r.id as RegionId, label: r.name, flag: r.flag }))}
              onChange={handleRegionChange}
            />
          </>
        )}
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
              <div className="funfact-emoji">
                <ProductIllustration product={funFactProduct} size={60} />
              </div>
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
