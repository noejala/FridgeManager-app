import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { searchByIngredient, getMealDetails, MealDetails, singularize } from '../utils/mealApi';
import { toEnglishIngredient } from '../utils/ingredientTranslation';
import './WhatToCook.css';

interface WhatToCookProps {
  products: Product[];
}

const MAX_MISSING = 4;

// Common pantry staples that most people have at home — don't count as "to buy"
const PANTRY_STAPLES = new Set([
  'salt', 'pepper', 'oil', 'olive oil', 'vegetable oil', 'sunflower oil', 'cooking oil',
  'butter', 'flour', 'plain flour', 'sugar', 'water', 'garlic', 'garlic clove',
  'black pepper', 'white pepper', 'vinegar', 'soy sauce', 'cornstarch',
  'baking powder', 'baking soda', 'egg', 'eggs', 'milk',
  'dried oregano', 'oregano', 'basil', 'thyme', 'bay leaf', 'parsley',
  'paprika', 'cumin', 'cinnamon', 'nutmeg', 'chilli powder', 'turmeric powder',
  'ginger', 'ginger paste', 'mustard', 'mustard powder', 'honey',
  'lemon', 'lime', 'lemon juice', 'lime juice',
]);

type CourseFilter = 'all' | 'starter' | 'main' | 'dessert';

function getCourse(category: string): 'starter' | 'main' | 'dessert' {
  const c = category.toLowerCase();
  if (c === 'dessert') return 'dessert';
  if (c === 'starter') return 'starter';
  return 'main';
}

interface RecipeMatch {
  meal: MealDetails;
  available: { name: string; measure: string }[];
  missing: { name: string; measure: string }[];
  pantry: { name: string; measure: string }[];
}

function matchIngredients(
  meal: MealDetails,
  fridgeNames: string[]
): { available: { name: string; measure: string }[]; missing: { name: string; measure: string }[]; pantry: { name: string; measure: string }[] } {
  const fridgeSingular = fridgeNames.map((n) => singularize(n));
  const available: { name: string; measure: string }[] = [];
  const missing: { name: string; measure: string }[] = [];
  const pantry: { name: string; measure: string }[] = [];

  for (const ing of meal.ingredients) {
    const ingSingular = singularize(ing.name);
    const inFridge = fridgeSingular.some(
      (f) => ingSingular.includes(f) || f.includes(ingSingular)
    );
    if (inFridge) {
      available.push(ing);
    } else if (PANTRY_STAPLES.has(ingSingular) || PANTRY_STAPLES.has(ing.name.toLowerCase())) {
      pantry.push(ing);
    } else {
      missing.push(ing);
    }
  }

  return { available, missing, pantry };
}

export const WhatToCook = ({ products }: WhatToCookProps) => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');

  const fetchRecipes = useCallback(async () => {
    if (products.length === 0) {
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fridgeNames = products.map((p) => toEnglishIngredient(p.name));
      const ingredientNames = fridgeNames.slice(0, 5);

      const searchResults = await Promise.all(
        ingredientNames.map((name) => searchByIngredient(name))
      );

      const mealHits = new Map<string, number>();
      for (const meals of searchResults) {
        for (const meal of meals) {
          mealHits.set(meal.id, (mealHits.get(meal.id) || 0) + 1);
        }
      }

      const sortedIds = [...mealHits.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

      const detailsResults = await Promise.all(
        sortedIds.slice(0, 30).map((id) => getMealDetails(id))
      );

      const matched: RecipeMatch[] = [];
      for (const meal of detailsResults) {
        if (!meal) continue;
        const { available, missing, pantry } = matchIngredients(meal, fridgeNames);
        if (missing.length <= MAX_MISSING) {
          matched.push({ meal, available, missing, pantry });
        }
      }

      matched.sort((a, b) => {
        if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
        return a.meal.name.localeCompare(b.meal.name);
      });

      setRecipes(matched);
    } catch {
      setError(t('cook.failedFetch'));
    } finally {
      setLoading(false);
    }
  }, [products, t]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const closeDetails = () => setSelectedRecipe(null);

  if (products.length === 0) {
    return (
      <div className="what-to-cook">
        <div className="cook-header">
          <h2>{t('cook.title')}</h2>
        </div>
        <div className="empty-suggestions">
          <div className="empty-icon">🍽️</div>
          <p>{t('cook.addProductsForSuggestions')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="what-to-cook">
      <div className="cook-header">
        <h2>{t('cook.title')}</h2>
        <p className="cook-subtitle">
          {t('cook.recipesBasedOn', { count: products.length })}
        </p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>{t('cook.searching')}</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchRecipes}>{t('cook.retry')}</button>
        </div>
      )}

      {!loading && !error && recipes.length === 0 && (
        <div className="empty-suggestions">
          <div className="empty-icon">🔍</div>
          <p>{t('cook.noRecipes')}</p>
        </div>
      )}

      {!loading && recipes.length > 0 && (() => {
        const counts = {
          all: recipes.length,
          starter: recipes.filter(r => getCourse(r.meal.category) === 'starter').length,
          main: recipes.filter(r => getCourse(r.meal.category) === 'main').length,
          dessert: recipes.filter(r => getCourse(r.meal.category) === 'dessert').length,
        };
        const filters: { key: CourseFilter; label: string }[] = [
          { key: 'all', label: t('cook.filterAll') },
          { key: 'starter', label: t('cook.filterStarter') },
          { key: 'main', label: t('cook.filterMain') },
          { key: 'dessert', label: t('cook.filterDessert') },
        ];
        const filteredRecipes = courseFilter === 'all'
          ? recipes
          : recipes.filter(r => getCourse(r.meal.category) === courseFilter);

        return (
          <>
            <div className="course-filters">
              {filters.map(f => (
                <button
                  key={f.key}
                  className={`course-filter-btn${courseFilter === f.key ? ' active' : ''}${counts[f.key] === 0 ? ' empty' : ''}`}
                  onClick={() => setCourseFilter(f.key)}
                >
                  {f.label}
                  <span className="course-count">{counts[f.key]}</span>
                </button>
              ))}
            </div>

            {filteredRecipes.length === 0 ? (
              <div className="empty-suggestions">
                <div className="empty-icon">🔍</div>
                <p>{t('cook.noRecipesInCategory')}</p>
              </div>
            ) : (
              <div className="recipes-grid">
                {filteredRecipes.map((recipe, index) => (
            <div
              key={recipe.meal.id}
              className="recipe-card"
              onClick={() => setSelectedRecipe(recipe)}
              style={{ '--index': index } as React.CSSProperties}
            >
              <img src={recipe.meal.thumbnail} alt={recipe.meal.name} className="recipe-thumbnail" />
              <div className="recipe-info">
                <h3>{recipe.meal.name}</h3>
                <div className="recipe-match-info">
                  {recipe.missing.length === 0 ? (
                    <span className="match-badge ready">{t('cook.readyToCook')}</span>
                  ) : (
                    <span className="match-badge to-buy">
                      {t('cook.toBuy', { count: recipe.missing.length })}
                    </span>
                  )}
                </div>
              </div>
            </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {selectedRecipe && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetails}>✕</button>
            <img
              src={selectedRecipe.meal.thumbnail}
              alt={selectedRecipe.meal.name}
              className="modal-image"
            />
            <h2>{selectedRecipe.meal.name}</h2>
            <div className="modal-tags">
              {selectedRecipe.meal.category && <span className="tag">{selectedRecipe.meal.category}</span>}
              {selectedRecipe.meal.area && <span className="tag">{selectedRecipe.meal.area}</span>}
            </div>

            {selectedRecipe.available.length > 0 && (
              <div className="modal-section">
                <h3>{t('cook.inYourFridge')}</h3>
                <ul className="modal-ingredients">
                  {selectedRecipe.available.map((ing, i) => (
                    <li key={i} className="ingredient-available">
                      <span className="ingredient-measure">{ing.measure}</span> {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.pantry.length > 0 && (
              <div className="modal-section">
                <h3>{t('cook.pantryStaples')}</h3>
                <ul className="modal-ingredients">
                  {selectedRecipe.pantry.map((ing, i) => (
                    <li key={i} className="ingredient-pantry">
                      <span className="ingredient-measure">{ing.measure}</span> {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecipe.missing.length > 0 && (
              <div className="modal-section">
                <h3>{t('cook.toBuy', { count: selectedRecipe.missing.length })}</h3>
                <ul className="modal-ingredients">
                  {selectedRecipe.missing.map((ing, i) => (
                    <li key={i} className="ingredient-missing">
                      <span className="ingredient-measure">{ing.measure}</span> {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-section">
              <h3>{t('cook.instructions')}</h3>
              <p className="modal-instructions">{selectedRecipe.meal.instructions}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
