import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { REGIONS, seasonalDataByRegion, productEmojiMap, FRUITS, type RegionId } from '../utils/seasonalData';
import { fetchProductFunFacts } from '../utils/mistralApi';
import './SeasonalProducts.css';

const SEASON_ORDER = ['Winter', 'Spring', 'Summer', 'Autumn'] as const;
type Season = typeof SEASON_ORDER[number];

function getSeasonProducts(region: RegionId, season: Season): string[] {
  const seen = new Set<string>();
  const products: string[] = [];
  for (const entry of Object.values(seasonalDataByRegion[region])) {
    if (entry.season === season) {
      for (const p of entry.products) {
        if (!seen.has(p)) { seen.add(p); products.push(p); }
      }
    }
  }
  return products;
}

export const SeasonalProducts = ({ isActive }: { isActive: boolean }) => {
  const { t, i18n } = useTranslation();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedRegion, setSelectedRegion] = useState<RegionId>(() => {
    return (localStorage.getItem('seasonal-region') as RegionId) || 'france';
  });

  useEffect(() => {
    localStorage.setItem('seasonal-region', selectedRegion);
  }, [selectedRegion]);

  const currentSeasonName = seasonalDataByRegion[selectedRegion][currentMonth].season as Season;
  const [selectedSeason, setSelectedSeason] = useState<Season>(currentSeasonName);

  useEffect(() => {
    if (isActive) setSelectedSeason(currentSeasonName);
  }, [isActive]);

  const [funFactProduct, setFunFactProduct] = useState<string | null>(null);
  const [funFacts, setFunFacts] = useState<string[]>([]);
  const [loadingFunFacts, setLoadingFunFacts] = useState(false);
  const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true';

  const handleProductClick = async (product: string) => {
    if (!aiEnabled) return;
    setFunFactProduct(product);
    setFunFacts([]);
    setLoadingFunFacts(true);
    const facts = await fetchProductFunFacts(product, i18n.language);
    setFunFacts(facts);
    setLoadingFunFacts(false);
  };

  const monthName = t(`seasonal.months.${currentMonth}`);

  const products = getSeasonProducts(selectedRegion, selectedSeason);
  const fruits = products.filter(p => FRUITS.has(p));
  const vegetables = products.filter(p => !FRUITS.has(p));

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
        <p className="seasonal-subtitle">
          {t('seasonal.recommendedFor', { month: monthName, season: t(`seasonal.season.${currentSeasonName.toLowerCase()}`) })}
        </p>
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
      </div>

      <div className="seasonal-content">
        <div className="season-tabs">
          {SEASON_ORDER.map(season => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={[
                'season-badge',
                `season-badge-${season.toLowerCase()}`,
                season !== currentSeasonName ? 'season-badge-inactive' : '',
                selectedSeason === season ? 'season-badge-selected' : '',
              ].join(' ')}
            >
              {t(`seasonal.season.${season.toLowerCase()}`)}
            </button>
          ))}
        </div>

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
