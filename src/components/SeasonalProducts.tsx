import { useState, useEffect } from 'react';
import { REGIONS, seasonalDataByRegion, productEmojiMap, type RegionId } from '../utils/seasonalData';
import './SeasonalProducts.css';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SeasonalProducts = () => {
  const currentMonth = new Date().getMonth() + 1;

  const [selectedRegion, setSelectedRegion] = useState<RegionId>(() => {
    return (localStorage.getItem('seasonal-region') as RegionId) || 'france';
  });

  useEffect(() => {
    localStorage.setItem('seasonal-region', selectedRegion);
  }, [selectedRegion]);

  const currentSeason = seasonalDataByRegion[selectedRegion][currentMonth];

  return (
    <div className="seasonal-products">
      <div className="seasonal-header">
        <h2>🌱 Seasonal products</h2>
        <p className="seasonal-subtitle">
          Recommended products for {monthNames[currentMonth - 1]} ({currentSeason.season})
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
            {currentSeason.season}
          </div>
          <p>
            These products are in season right now, meaning they're fresher,
            more flavorful, and often more affordable!
          </p>
        </div>

        <div className="products-grid">
          {currentSeason.products.map((product, index) => (
            <div key={index} className="seasonal-product-card">
              <div className="product-emoji">
                {productEmojiMap[product] || '🥬'}
              </div>
              <h3>{product}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
