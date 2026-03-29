import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { DietaryPreference } from '../types/UserProfile';
import { searchByIngredient, getMealDetails, MealDetails, singularize } from '../utils/mealApi';
import { fetchGeminiRecipes, CookingMode, CourseSelection } from '../utils/geminiApi';
import { toEnglishIngredient } from '../utils/ingredientTranslation';
import { getDaysUntilExpiration } from '../utils/storage';
import './WhatToCook.css';

const GEMINI_ALLOWED_USER = '6afffd0a-0346-43e9-9476-e184e33410f8';

function parseSteps(instructions: string): string[] {
  // Split by newlines first (TheMealDB uses \r\n, Gemini uses \n)
  const byNewline = instructions
    .split(/\r?\n/)
    .map(s => s.replace(/^(step\s*\d+\s*[:.]*\s*|\d+[.:)]\s*)/i, '').trim())
    .filter(s => s.length > 2);

  if (byNewline.length > 1) return byNewline;

  // Fallback: split by "1. 2. 3." numbered list pattern
  const byNumber = instructions.split(/(?=\d+\.\s)/).map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(s => s.length > 0);
  if (byNumber.length > 1) return byNumber;

  return [instructions.trim()];
}

interface WhatToCookProps {
  products: Product[];
  dietaryPreferences?: DietaryPreference[];
  dislikedIngredients?: string[];
  userId?: string;
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

async function fetchMealDbMeals(fridgeNames: string[]): Promise<(MealDetails | null)[]> {
  const ingredientNames = fridgeNames.slice(0, 5);
  const searchResults = await Promise.all(ingredientNames.map((name) => searchByIngredient(name)));
  const mealHits = new Map<string, number>();
  for (const meals of searchResults) {
    for (const meal of meals) {
      mealHits.set(meal.id, (mealHits.get(meal.id) || 0) + 1);
    }
  }
  const ids = [...mealHits.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, 30);
  return Promise.all(ids.map((id) => getMealDetails(id)));
}

const DIFFICULTY_RANK: Record<string, number> = {
  facile: 1, easy: 1,
  moyen: 2, medium: 2,
  difficile: 3, hard: 3,
};

function parsePrepMinutes(area: string): number {
  const h = area.match(/(\d+)\s*h/i);
  const m = area.match(/(\d+)\s*m/i);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0) || 999;
}

function sortGeminiRecipes(recipes: RecipeMatch[]): RecipeMatch[] {
  return [...recipes].sort((a, b) => {
    const da = DIFFICULTY_RANK[a.meal.category?.toLowerCase() ?? ''] ?? 2;
    const db = DIFFICULTY_RANK[b.meal.category?.toLowerCase() ?? ''] ?? 2;
    if (da !== db) return da - db;
    return parsePrepMinutes(a.meal.area ?? '') - parsePrepMinutes(b.meal.area ?? '');
  });
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

const geminiEnabled = import.meta.env.VITE_GEMINI_ENABLED === 'true';

export const WhatToCook = ({ products, dietaryPreferences = [], dislikedIngredients = [], userId }: WhatToCookProps) => {
  const { t, i18n } = useTranslation();
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMatch | null>(null);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('smart');
  const [servings, setServings] = useState(DEFAULT_SERVINGS);
  const [aiFallback, setAiFallback] = useState(false);
  const [showAiTeaser, setShowAiTeaser] = useState(false);
  const fetchingRef = useRef(false);
  const [recipeMode, setRecipeMode] = useState<'api' | 'ai'>(() => {
    if (!geminiEnabled || userId !== GEMINI_ALLOWED_USER) return 'api';
    return (localStorage.getItem('recipe-mode') as 'api' | 'ai') || 'api';
  });
  const [selectedCookingMode, setSelectedCookingMode] = useState<CookingMode | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseSelection | null>(null);

  useEffect(() => {
    localStorage.setItem('recipe-mode', recipeMode);
    if (recipeMode === 'api') {
      setSelectedCookingMode(null);
      setSelectedCourse(null);
      setRecipes([]);
    }
  }, [recipeMode]);

  const fetchRecipes = useCallback(async () => {
    if (products.length === 0) {
      setRecipes([]);
      return;
    }

    // In AI mode, wait for the user to pick a cooking mode and a course
    if (recipeMode === 'ai' && (!selectedCookingMode || !selectedCourse)) {
      setRecipes([]);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const fridgeNames = products.map((p) => toEnglishIngredient(p.name));
      const urgentFridgeNames = products
        .filter((p) => getDaysUntilExpiration(p.expirationDate) <= 3)
        .map((p) => toEnglishIngredient(p.name));

      let meals: (MealDetails | null)[];
      let isAiMode = false;

      if (recipeMode === 'ai') {
        const geminiResults = await fetchGeminiRecipes(fridgeNames, dietaryPreferences, i18n.language, selectedCookingMode ?? undefined, urgentFridgeNames, selectedCourse ?? undefined);
        if (geminiResults.length > 0) {
          meals = geminiResults;
          isAiMode = true;
          setAiFallback(false);
        } else {
          meals = await fetchMealDbMeals(fridgeNames);
          setAiFallback(true);
        }
      } else {
        meals = await fetchMealDbMeals(fridgeNames);
        setAiFallback(false);
      }

      const seenNames = new Set<string>();
      const matched: RecipeMatch[] = [];

      for (const meal of meals) {
        if (!meal) continue;
        const key = meal.name.toLowerCase();
        if (seenNames.has(key)) continue;
        seenNames.add(key);

        let available: { name: string; measure: string }[];
        let missing: { name: string; measure: string }[];
        let pantry: { name: string; measure: string }[];
        let urgentAvailableCount: number;
        if (isAiMode) {
          // Gemini designed recipes for these fridge contents — treat all non-pantry ingredients as available
          pantry = meal.ingredients.filter(ing =>
            PANTRY_STAPLES.has(singularize(ing.name.toLowerCase())) ||
            PANTRY_STAPLES.has(ing.name.toLowerCase())
          );
          available = meal.ingredients.filter(ing => !pantry.includes(ing));
          missing = [];
          urgentAvailableCount = 0;
        } else {
          ({ available, missing, pantry, urgentAvailableCount } = matchIngredients(meal, fridgeNames, urgentFridgeNames));
        }

        if (missing.length <= MAX_MISSING) {
          matched.push({ meal, available, missing, pantry, urgentAvailableCount });
        }
      }

      const sorted = isAiMode ? sortGeminiRecipes(matched) : matched.sort((a, b) => scoreRecipe(b) - scoreRecipe(a));
      setRecipes(sorted);
    } catch {
      setError(t('cook.failedFetch'));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, recipeMode, selectedCookingMode, selectedCourse, dietaryPreferences.join(','), i18n.language]);

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
        <div className="cook-header-top">
          <h2>{t('cook.title')}</h2>
          {geminiEnabled && userId !== GEMINI_ALLOWED_USER && (
            <div className="mode-toggle-wrapper">
              <div className="mode-toggle">
                <button
                  className="mode-btn mode-btn-ai mode-btn-teaser"
                  title={t('cook.aiComingSoon')}
                  onClick={() => setShowAiTeaser(p => !p)}
                >
                  ✨ {t('cook.modeAi')}
                </button>
              </div>
              {showAiTeaser && (
                <div className="ai-teaser-tooltip">{t('cook.aiComingSoon')}</div>
              )}
            </div>
          )}
          {geminiEnabled && userId === GEMINI_ALLOWED_USER && (
            <div className="mode-toggle">
              <button
                className={`mode-btn${recipeMode === 'api' ? ' active' : ''}`}
                onClick={() => setRecipeMode('api')}
              >
                {t('cook.modeApi')}
              </button>
              <button
                className={`mode-btn mode-btn-ai${recipeMode === 'ai' ? ' active' : ''}`}
                onClick={() => setRecipeMode('ai')}
              >
                {t('cook.modeAi')}
              </button>
            </div>
          )}
        </div>
        <div className="cook-subtitle-row">
          {!(recipeMode === 'ai' && selectedCookingMode && selectedCourse) && (
            <p className="cook-subtitle">
              {t('cook.recipesBasedOn', { count: products.length })}
            </p>
          )}
          {recipeMode === 'ai' && selectedCookingMode && selectedCourse && (
            <>
              <button
                className="change-cooking-mode-btn"
                onClick={() => { setSelectedCookingMode(null); setSelectedCourse(null); setRecipes([]); }}
              >
                {t(`cook.cookingModes.${selectedCookingMode}.icon`)} {t(`cook.cookingModes.${selectedCookingMode}.label`)} ↩
              </button>
              <button
                className="change-cooking-mode-btn"
                onClick={() => { setSelectedCourse(null); setRecipes([]); }}
              >
                {t(`cook.coursePicker.${selectedCourse}.icon`)} {t(`cook.coursePicker.${selectedCourse}.label`)} ↩
              </button>
            </>
          )}
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

      {recipeMode === 'ai' && !selectedCookingMode && (
        <div className="cooking-mode-picker">
          <div className="cooking-mode-picker-header">
            <h3>{t('cook.cookingModes.title')}</h3>
            <p>{t('cook.cookingModes.subtitle')}</p>
          </div>
          <div className="cooking-mode-grid">
            {(['quick', 'empty_fridge', 'expiring', 'chef'] as CookingMode[]).map((mode) => (
              <button
                key={mode}
                className="cooking-mode-card"
                onClick={() => setSelectedCookingMode(mode)}
              >
                <span className="cooking-mode-icon">{t(`cook.cookingModes.${mode}.icon`)}</span>
                <span className="cooking-mode-label">{t(`cook.cookingModes.${mode}.label`)}</span>
                <span className="cooking-mode-desc">{t(`cook.cookingModes.${mode}.description`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recipeMode === 'ai' && selectedCookingMode && !selectedCourse && (
        <div className="cooking-mode-picker">
          <div className="cooking-mode-picker-header">
            <button
              className="course-picker-back"
              onClick={() => setSelectedCookingMode(null)}
            >
              ← {t(`cook.cookingModes.${selectedCookingMode}.icon`)} {t(`cook.cookingModes.${selectedCookingMode}.label`)}
            </button>
            <h3>{t('cook.coursePicker.title')}</h3>
            <p>{t('cook.coursePicker.subtitle')}</p>
          </div>
          <div className="cooking-mode-grid">
            {(['starter', 'main', 'dessert', 'all'] as CourseSelection[]).map((course) => (
              <button
                key={course}
                className="cooking-mode-card"
                onClick={() => setSelectedCourse(course)}
              >
                <span className="cooking-mode-icon">{t(`cook.coursePicker.${course}.icon`)}</span>
                <span className="cooking-mode-label">{t(`cook.coursePicker.${course}.label`)}</span>
                <span className="cooking-mode-desc">{t(`cook.coursePicker.${course}.description`)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recipeMode === 'ai' && aiFallback && !loading && (
        <div className="ai-fallback-notice">
          ⚠️ {t('cook.aiFallback')}
          <button onClick={fetchRecipes}>{t('cook.retry')}</button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>{recipeMode === 'ai' ? t('cook.searchingAi') : t('cook.searching')}</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchRecipes}>{t('cook.retry')}</button>
        </div>
      )}

      {!loading && !error && recipes.length === 0 && !(recipeMode === 'ai' && (!selectedCookingMode || !selectedCourse)) && (
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

        const renderCard = (recipe: RecipeMatch, index: number) => (
          <div
            key={recipe.meal.id}
            className="recipe-card"
            onClick={() => setSelectedRecipe(recipe)}
            style={{ '--index': index } as React.CSSProperties}
          >
            {recipe.meal.thumbnail
              ? <img src={recipe.meal.thumbnail} alt={recipe.meal.name} className="recipe-thumbnail" />
              : <div className="recipe-thumbnail-placeholder" aria-hidden="true">✨</div>
            }
            <div className="recipe-info">
              <h3>{recipe.meal.name}</h3>
              <div className="recipe-match-info">
                {recipe.meal.id.startsWith('gemini-') ? (
                  <>
                    {recipe.meal.category && (
                      <span className={`match-badge difficulty difficulty--${['facile','easy'].includes(recipe.meal.category.toLowerCase()) ? 'easy' : ['moyen','medium'].includes(recipe.meal.category.toLowerCase()) ? 'medium' : 'hard'}`}>
                        {recipe.meal.category}
                      </span>
                    )}
                    {recipe.meal.area && <span className="match-badge preptime">⏱ {recipe.meal.area}</span>}
                  </>
                ) : recipe.missing.length === 0 ? (
                  <span className="match-badge ready">{t('cook.readyToCook')}</span>
                ) : (
                  <span className="match-badge to-buy">
                    {t('cook.toBuy', { count: recipe.missing.length })}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

        // AI mode with all 3 courses: grouped sections
        if (recipeMode === 'ai' && selectedCourse === 'all') {
          return (
            <>
              {dietaryPreferences.length > 0 && (
                <div className="diet-filter-bar">
                  {t('cook.dietaryFilterActive', {
                    prefs: dietaryPreferences.map(p => t(`settings.dietary.${p}`)).join(', '),
                  })}
                </div>
              )}
              {(['starter', 'main', 'dessert'] as const).map(course => {
                const courseRecipes = dietFiltered.filter(r => r.meal.course === course);
                if (courseRecipes.length === 0) return null;
                return (
                  <div key={course} className="course-section">
                    <div className="course-section-header">
                      <span className="course-section-icon">{t(`cook.coursePicker.${course}.icon`)}</span>
                      <h4 className="course-section-title">{t(`cook.coursePicker.${course}.label`)}</h4>
                    </div>
                    <div className="recipes-grid">
                      {courseRecipes.map((recipe, index) => renderCard(recipe, index))}
                    </div>
                  </div>
                );
              })}
            </>
          );
        }

        // API mode or single AI course: flat grid with filters
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
                {filteredRecipes.map((recipe, index) => renderCard(recipe, index))}
              </div>
            )}
          </>
        );
      })()}

      {selectedRecipe && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetails}>✕</button>
            {selectedRecipe.meal.thumbnail
              ? <img src={selectedRecipe.meal.thumbnail} alt={selectedRecipe.meal.name} className="modal-image" />
              : <div className="modal-thumbnail-placeholder" aria-hidden="true">✨</div>
            }
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
              <ol className="modal-steps">
                {parseSteps(selectedRecipe.meal.instructions).map((step, i) => (
                  <li key={i} className="modal-step">
                    <span className="step-number">{i + 1}</span>
                    <span className="step-text">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
