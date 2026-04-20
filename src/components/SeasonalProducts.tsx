import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { REGIONS, seasonalDataByRegion, productEmojiMap, FRUITS, type RegionId } from '../utils/seasonalData';
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
  const { t } = useTranslation();
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

  const monthName = t(`seasonal.months.${currentMonth}`);

  const products = getSeasonProducts(selectedRegion, selectedSeason);
  const fruits = products.filter(p => FRUITS.has(p));
  const vegetables = products.filter(p => !FRUITS.has(p));

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
              {vegetables.map((product, index) => (
                <div key={product} className="seasonal-product-card" style={{ '--index': index } as React.CSSProperties}>
                  <div className="product-emoji">{productEmojiMap[product] || '🥬'}</div>
                  <p>{t(`seasonal.products.${product}`, { defaultValue: product })}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {fruits.length > 0 && (
          <div className="products-section">
            <h3 className="products-section-title">{t('seasonal.fruits')}</h3>
            <div className="products-grid">
              {fruits.map((product, index) => (
                <div key={product} className="seasonal-product-card" style={{ '--index': index + vegetables.length } as React.CSSProperties}>
                  <div className="product-emoji">{productEmojiMap[product] || '🍎'}</div>
                  <p>{t(`seasonal.products.${product}`, { defaultValue: product })}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
