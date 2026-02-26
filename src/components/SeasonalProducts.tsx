import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { REGIONS, seasonalDataByRegion, productEmojiMap, type RegionId } from '../utils/seasonalData';
import './SeasonalProducts.css';

export const SeasonalProducts = () => {
  const { t } = useTranslation();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedRegion, setSelectedRegion] = useState<RegionId>(() => {
    return (localStorage.getItem('seasonal-region') as RegionId) || 'france';
  });

  useEffect(() => {
    localStorage.setItem('seasonal-region', selectedRegion);
  }, [selectedRegion]);

  const currentSeason = seasonalDataByRegion[selectedRegion][currentMonth];
  const monthName = t(`seasonal.months.${currentMonth}`);
  const seasonName = t(`seasonal.season.${currentSeason.season.toLowerCase()}`);

  return (
    <div className="seasonal-products">
      <div className="seasonal-header">
        <h2>{t('seasonal.title')}</h2>
        <p className="seasonal-subtitle">
          {t('seasonal.recommendedFor', { month: monthName, season: seasonName })}
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
        <div className="seasonal-info">
          <div className={`season-badge season-badge-${currentSeason.season.toLowerCase()}`}>
            {seasonName}
          </div>
          <p>{t('seasonal.description')}</p>
        </div>

        <div className="products-grid">
          {currentSeason.products.map((product, index) => (
            <div key={index} className="seasonal-product-card" style={{ '--index': index } as React.CSSProperties}>
              <div className="product-emoji">
                {productEmojiMap[product] || '🥬'}
              </div>
              <h3>{t(`seasonal.products.${product}`, { defaultValue: product })}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
