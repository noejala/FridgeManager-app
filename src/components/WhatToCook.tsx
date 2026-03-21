import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { DietaryPreference } from '../types/UserProfile';
import { searchByIngredient, getMealDetails, MealDetails, singularize } from '../utils/mealApi';
import { searchSpoonacularByIngredients, getSpoonacularRecipeDetails } from '../utils/spoonacularApi';
import { toEnglishIngredient } from '../utils/ingredientTranslation';
import { getDaysUntilExpiration } from '../utils/storage';
import './WhatToCook.css';

interface WhatToCookProps {
  products: Product[];
  dietaryPreferences?: DietaryPreference[];
  dislikedIngredients?: string[];
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

const MEAT_FISH = [
  'beef', 'chicken', 'pork', 'lamb', 'turkey', 'bacon', 'ham', 'sausage',
  'mince', 'mutton', 'duck', 'veal', 'venison', 'steak', 'chorizo',
  'pepperoni', 'prosciutto', 'salami', 'pancetta',
];
const FISH_SEAFOOD = [
  'anchovy', 'tuna', 'salmon', 'cod', 'haddock', 'shrimp', 'prawn',
  'crab', 'lobster', 'fish', 'seafood', 'clam', 'oyster', 'scallop',
  'squid', 'octopus', 'sardine', 'mackerel', 'tilapia', 'trout',
  'crawfish', 'crayfish',
];
const DAIRY_EGG = [
  'milk', 'cheese', 'cream', 'butter', 'egg', 'honey', 'yogurt', 'yoghurt',
  'ghee', 'gelatin', 'mayonnaise', 'parmesan', 'mozzarella', 'cheddar',
  'ricotta', 'brie', 'feta',
];
const GLUTEN_SOURCES = [
  'flour', 'bread', 'pasta', 'spaghetti', 'noodle', 'wheat', 'barley',
  'rye', 'breadcrumb', 'semolina', 'couscous', 'bulgur', 'pita', 'tortilla',
  'soy sauce',
];
const DAIRY = [
  'milk', 'cream', 'cheese', 'butter', 'yogurt', 'yoghurt', 'ghee', 'whey',
  'parmesan', 'mozzarella', 'cheddar', 'brie', 'feta', 'ricotta',
];
const PORK = ['pork', 'bacon', 'ham', 'lard', 'prosciutto', 'pancetta', 'chorizo', 'salami', 'pepperoni'];
const SHELLFISH = ['shrimp', 'crab', 'lobster', 'oyster', 'clam', 'scallop', 'squid', 'octopus', 'prawn', 'crawfish', 'crayfish'];

const DIETARY_BLACKLIST: Record<DietaryPreference, string[]> = {
  vegetarian: [...MEAT_FISH, ...FISH_SEAFOOD],
  pescatarian: MEAT_FISH,
  vegan: [...MEAT_FISH, ...FISH_SEAFOOD, ...DAIRY_EGG],
  gluten_free: GLUTEN_SOURCES,
  lactose_free: DAIRY,
  halal: PORK,
  kosher: [...PORK, ...SHELLFISH],
};

function hasKeyword(ingName: string, keyword: string): boolean {
  const lower = ingName.toLowerCase();
  if (keyword.includes(' ')) return lower.includes(keyword);
  return new RegExp(`\\b${keyword}s?\\b`, 'i').test(lower);
}

function meetsPreferences(recipe: RecipeMatch, prefs: DietaryPreference[]): boolean {
  if (prefs.length === 0) return true;
  const allIngredients = [...recipe.available, ...recipe.missing, ...recipe.pantry];
  for (const pref of prefs) {
    for (const ing of allIngredients) {
      if (DIETARY_BLACKLIST[pref].some(kw => hasKeyword(ing.name, kw))) return false;
    }
  }
  return true;
}

function meetsDislikedFilter(recipe: RecipeMatch, disliked: string[]): boolean {
  if (disliked.length === 0) return true;
  const allIngredients = [...recipe.available, ...recipe.missing, ...recipe.pantry];
  return !disliked.some(d =>
    allIngredients.some(ing => ing.name.toLowerCase().includes(d))
  );
}

type CourseFilter = 'all' | 'starter' | 'main' | 'dessert';
type SortMode = 'smart' | 'available';

const DEFAULT_SERVINGS = 4;

function scaleMeasure(measure: string, ratio: number): string {
  if (ratio === 1 || !measure.trim()) return measure;
  const match = measure.trim().match(/^(\d+\/\d+|\d+\.?\d*)\s*(.*)/);
  if (!match) return measure;
  const [, numStr, unit] = match;
  let num: number;
  if (numStr.includes('/')) {
    const [n, d] = numStr.split('/').map(Number);
    num = n / d;
  } else {
    num = parseFloat(numStr);
  }
  const scaled = num * ratio;
  const fmt = scaled % 1 === 0
    ? scaled.toString()
    : (Math.round(scaled * 4) / 4 % 1 === 0
        ? (Math.round(scaled * 4) / 4).toString()
        : scaled.toFixed(1));
  return `${fmt} ${unit}`.trim();
}

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
  urgentAvailableCount: number;
}

function matchIngredients(
  meal: MealDetails,
  fridgeNames: string[],
  urgentFridgeNames: string[]
): { available: { name: string; measure: string }[]; missing: { name: string; measure: string }[]; pantry: { name: string; measure: string }[]; urgentAvailableCount: number } {
  const fridgeSingular = fridgeNames.map((n) => singularize(n));
  const urgentSingular = urgentFridgeNames.map((n) => singularize(n));
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

  const urgentAvailableCount = available.filter((ing) => {
    const ingSingular = singularize(ing.name);
    return urgentSingular.some((u) => ingSingular.includes(u) || u.includes(ingSingular));
  }).length;

  return { available, missing, pantry, urgentAvailableCount };
}

function scoreRecipe(recipe: RecipeMatch): number {
  return recipe.available.length * 10 + recipe.urgentAvailableCount * 15 - recipe.missing.length * 2;
}

function applySort(recipes: RecipeMatch[], mode: SortMode): RecipeMatch[] {
  return [...recipes].sort((a, b) => {
    if (mode === 'available') {
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
      return b.available.length - a.available.length;
    }
    return scoreRecipe(b) - scoreRecipe(a);
  });
}

export const WhatToCook = ({ products, dietaryPreferences = [], dislikedIngredients = [] }: WhatToCookProps) => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('smart');
  const [servings, setServings] = useState(DEFAULT_SERVINGS);

  const fetchRecipes = useCallback(async () => {
    if (products.length === 0) {
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fridgeNames = products.map((p) => toEnglishIngredient(p.name));
      const urgentFridgeNames = products
        .filter((p) => getDaysUntilExpiration(p.expirationDate) <= 3)
        .map((p) => toEnglishIngredient(p.name));
      const ingredientNames = fridgeNames.slice(0, 5);

      // Fetch from both APIs in parallel
      const [mealDbSearchResults, spoonacularSummaries] = await Promise.all([
        Promise.all(ingredientNames.map((name) => searchByIngredient(name))),
        searchSpoonacularByIngredients(ingredientNames),
      ]);

      // MealDB: rank by how many ingredients matched
      const mealHits = new Map<string, number>();
      for (const meals of mealDbSearchResults) {
        for (const meal of meals) {
          mealHits.set(meal.id, (mealHits.get(meal.id) || 0) + 1);
        }
      }
      const mealDbIds = [...mealHits.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(0, 30);

      // Fetch all details in parallel
      const [mealDbDetails, spoonacularDetails] = await Promise.all([
        Promise.all(mealDbIds.map((id) => getMealDetails(id))),
        Promise.all(spoonacularSummaries.map((r) => getSpoonacularRecipeDetails(r.id))),
      ]);

      // Merge and deduplicate by name (case-insensitive)
      const seenNames = new Set<string>();
      const matched: RecipeMatch[] = [];

      for (const meal of [...mealDbDetails, ...spoonacularDetails]) {
        if (!meal) continue;
        const key = meal.name.toLowerCase();
        if (seenNames.has(key)) continue;
        seenNames.add(key);

        const { available, missing, pantry, urgentAvailableCount } = matchIngredients(meal, fridgeNames, urgentFridgeNames);
        if (missing.length <= MAX_MISSING) {
          matched.push({ meal, available, missing, pantry, urgentAvailableCount });
        }
      }

      matched.sort((a, b) => scoreRecipe(b) - scoreRecipe(a));

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
        <div className="cook-subtitle-row">
          <p className="cook-subtitle">
            {t('cook.recipesBasedOn', { count: products.length })}
          </p>
          <div className="servings-stepper">
            <button
              className="stepper-btn"
              onClick={() => setServings(s => Math.max(1, s - 1))}
              disabled={servings <= 1}
            >−</button>
            <span className="servings-value">
              {servings} <span className="servings-unit">{t('cook.servingsUnit')}</span>
            </span>
            <button
              className="stepper-btn"
              onClick={() => setServings(s => Math.min(20, s + 1))}
              disabled={servings >= 20}
            >+</button>
          </div>
        </div>
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

      {!loading && !error && recipes.length > 0 && recipes.filter(r => meetsPreferences(r, dietaryPreferences) && meetsDislikedFilter(r, dislikedIngredients)).length === 0 && (
        <div className="empty-suggestions">
          <div className="empty-icon">🥗</div>
          <p>{t('cook.noRecipesDietary')}</p>
        </div>
      )}

      {!loading && recipes.length > 0 && (() => {
        const dietFiltered = recipes.filter(r =>
          meetsPreferences(r, dietaryPreferences) && meetsDislikedFilter(r, dislikedIngredients)
        );
        const counts = {
          all: dietFiltered.length,
          starter: dietFiltered.filter(r => getCourse(r.meal.category) === 'starter').length,
          main: dietFiltered.filter(r => getCourse(r.meal.category) === 'main').length,
          dessert: dietFiltered.filter(r => getCourse(r.meal.category) === 'dessert').length,
        };
        const filters: { key: CourseFilter; label: string }[] = [
          { key: 'all', label: t('cook.filterAll') },
          { key: 'starter', label: t('cook.filterStarter') },
          { key: 'main', label: t('cook.filterMain') },
          { key: 'dessert', label: t('cook.filterDessert') },
        ];
        const courseFiltered = courseFilter === 'all'
          ? dietFiltered
          : dietFiltered.filter(r => getCourse(r.meal.category) === courseFilter);
        const filteredRecipes = applySort(courseFiltered, sortMode);

        return (
          <>
            {dietaryPreferences.length > 0 && (
            <div className="diet-filter-bar">
              {t('cook.dietaryFilterActive', {
                prefs: dietaryPreferences.map(p => t(`settings.dietary.${p}`)).join(', '),
              })}
            </div>
          )}
          <div className="filters-row">
            <div className="course-dropdown">
              <button
                className="course-dropdown-btn"
                onClick={() => setCourseDropdownOpen(o => !o)}
              >
                {filters.find(f => f.key === courseFilter)?.label}
                <span className="course-dropdown-count">{counts[courseFilter]}</span>
                <span className="dropdown-chevron">▾</span>
              </button>
              {courseDropdownOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setCourseDropdownOpen(false)} />
                  <div className="course-dropdown-menu">
                    {filters.map(f => (
                      <button
                        key={f.key}
                        className={`course-dropdown-item${courseFilter === f.key ? ' active' : ''}`}
                        onClick={() => { setCourseFilter(f.key); setCourseDropdownOpen(false); }}
                      >
                        {f.label}
                        <span className="course-dropdown-count">{counts[f.key]}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="filter-divider" />
            <div className="sort-control">
              {(['smart', 'available'] as SortMode[]).map((mode) => (
                <button
                  key={mode}
                  className={`sort-btn${sortMode === mode ? ' active' : ''}`}
                  onClick={() => setSortMode(mode)}
                >
                  {t(`cook.sort.${mode}`)}
                </button>
              ))}
            </div>
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
              <span className="tag tag-servings">
                {t('cook.servingsCount', { count: servings })}
              </span>
            </div>

            {selectedRecipe.available.length > 0 && (
              <div className="modal-section">
                <h3>{t('cook.inYourFridge')}</h3>
                <ul className="modal-ingredients">
                  {selectedRecipe.available.map((ing, i) => (
                    <li key={i} className="ingredient-available">
                      <span className="ingredient-measure">{scaleMeasure(ing.measure, servings / DEFAULT_SERVINGS)}</span> {ing.name}
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
                      <span className="ingredient-measure">{scaleMeasure(ing.measure, servings / DEFAULT_SERVINGS)}</span> {ing.name}
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
                      <span className="ingredient-measure">{scaleMeasure(ing.measure, servings / DEFAULT_SERVINGS)}</span> {ing.name}
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
