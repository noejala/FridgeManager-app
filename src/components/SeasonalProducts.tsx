import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { REGIONS, seasonalDataByRegion, productEmojiMap, FRUITS, type RegionId } from '../utils/seasonalData';
import { fetchSeasonalRecipes } from '../utils/mistralApi';
import { MealDetails } from '../utils/mealApi';
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
  const [seasonalRecipes, setSeasonalRecipes] = useState<MealDetails[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<MealDetails | null>(null);
  const aiEnabled = import.meta.env.VITE_AI_ENABLED === 'true';

  useEffect(() => {
    if (isActive) setSelectedSeason(currentSeasonName);
  }, [isActive]);

  const products = getSeasonProducts(selectedRegion, selectedSeason);
  const fruits = products.filter(p => FRUITS.has(p));
  const vegetables = products.filter(p => !FRUITS.has(p));

  const loadRecipes = useCallback(async () => {
    if (!aiEnabled) return;
    setLoadingRecipes(true);
    setSeasonalRecipes([]);
    const results = await fetchSeasonalRecipes(selectedSeason.toLowerCase(), selectedRegion, i18n.language, products);
    setSeasonalRecipes(results);
    setLoadingRecipes(false);
  }, [selectedSeason, selectedRegion, i18n.language, aiEnabled, products]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const monthName = t(`seasonal.months.${currentMonth}`);

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

      {aiEnabled && (
        <div className="seasonal-recipes-section">
          <div className="seasonal-recipes-header">
            <h3 className="products-section-title">{t('seasonal.topRecipes', { season: t(`seasonal.season.${selectedSeason.toLowerCase()}`) })}</h3>
            {!loadingRecipes && seasonalRecipes.length > 0 && (
              <button className="seasonal-recipes-refresh" onClick={loadRecipes} title={t('cook.retry')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            )}
          </div>

          {loadingRecipes ? (
            <div className="seasonal-recipes-loading">
              <div className="seasonal-recipe-skeleton" />
              <div className="seasonal-recipe-skeleton" />
              <div className="seasonal-recipe-skeleton" />
            </div>
          ) : seasonalRecipes.length > 0 ? (
            <div className="seasonal-recipes-list">
              {seasonalRecipes.map((recipe, index) => (
                <button
                  key={recipe.id}
                  className="seasonal-recipe-card"
                  onClick={() => setSelectedRecipe(recipe)}
                  style={{ '--index': index } as React.CSSProperties}
                >
                  <div className="seasonal-recipe-info">
                    <span className="seasonal-recipe-name">{recipe.name}</span>
                    <div className="seasonal-recipe-meta">
                      {recipe.area && <span className="seasonal-recipe-tag">{recipe.area}</span>}
                      {recipe.category && (
                        <span className={`seasonal-recipe-tag difficulty difficulty--${['facile','easy'].includes(recipe.category.toLowerCase()) ? 'easy' : ['moyen','medium'].includes(recipe.category.toLowerCase()) ? 'medium' : 'hard'}`}>
                          {recipe.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="seasonal-recipe-arrow">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {selectedRecipe && (
        <div className="modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedRecipe(null)}>✕</button>
            <h2>{selectedRecipe.name}</h2>
            <div className="modal-tags">
              {selectedRecipe.area && <span className="tag">{selectedRecipe.area}</span>}
              {selectedRecipe.category && <span className="tag">{selectedRecipe.category}</span>}
            </div>
            {selectedRecipe.ingredients.length > 0 && (
              <div className="modal-section">
                <h4 className="modal-section-title">{t('seasonal.ingredients')}</h4>
                <ul className="modal-ingredients">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i}><span className="ing-measure">{ing.measure}</span> {ing.name}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="modal-section">
              <h4 className="modal-section-title">{t('cook.instructions')}</h4>
              <ol className="modal-steps">
                {selectedRecipe.instructions.split('\n').filter(s => s.trim()).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
