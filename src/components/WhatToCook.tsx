import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/Product';
import { searchByIngredient, getMealDetails, MealSummary, MealDetails } from '../utils/mealApi';
import './WhatToCook.css';

interface WhatToCookProps {
  products: Product[];
}

interface MealWithMatch extends MealSummary {
  matchedIngredient: string;
}

export const WhatToCook = ({ products }: WhatToCookProps) => {
  const [meals, setMeals] = useState<MealWithMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchRecipes = useCallback(async () => {
    if (products.length === 0) {
      setMeals([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ingredientNames = products.slice(0, 5).map((p) => p.name);
      const results = await Promise.all(
        ingredientNames.map(async (name) => {
          const summaries = await searchByIngredient(name);
          return summaries.map((s) => ({ ...s, matchedIngredient: name }));
        })
      );

      const allMeals = results.flat();
      const seen = new Set<string>();
      const deduplicated: MealWithMatch[] = [];
      for (const meal of allMeals) {
        if (!seen.has(meal.id)) {
          seen.add(meal.id);
          deduplicated.push(meal);
        }
      }

      setMeals(deduplicated);
    } catch {
      setError('Failed to fetch recipes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const handleMealClick = async (mealId: string) => {
    setLoadingDetails(true);
    try {
      const details = await getMealDetails(mealId);
      setSelectedMeal(details);
    } catch {
      setError('Failed to load recipe details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => setSelectedMeal(null);

  if (products.length === 0) {
    return (
      <div className="what-to-cook">
        <div className="cook-header">
          <h2>🍳 What to cook</h2>
        </div>
        <div className="empty-suggestions">
          <div className="empty-icon">🍽️</div>
          <p>Add products to get recipe suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="what-to-cook">
      <div className="cook-header">
        <h2>🍳 What to cook</h2>
        <p className="cook-subtitle">
          Recipes based on your {products.length} product{products.length > 1 ? 's' : ''}
        </p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Searching for recipes...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchRecipes}>Retry</button>
        </div>
      )}

      {!loading && !error && meals.length === 0 && (
        <div className="empty-suggestions">
          <div className="empty-icon">🔍</div>
          <p>No recipes found for your current products. Try adding more ingredients!</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div className="recipes-grid">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="recipe-card"
              onClick={() => handleMealClick(meal.id)}
            >
              <img src={meal.thumbnail} alt={meal.name} className="recipe-thumbnail" />
              <div className="recipe-info">
                <h3>{meal.name}</h3>
                <span className="matched-ingredient">🥄 {meal.matchedIngredient}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {(selectedMeal || loadingDetails) && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading recipe...</p>
              </div>
            ) : selectedMeal && (
              <>
                <button className="modal-close" onClick={closeDetails}>✕</button>
                <img
                  src={selectedMeal.thumbnail}
                  alt={selectedMeal.name}
                  className="modal-image"
                />
                <h2>{selectedMeal.name}</h2>
                <div className="modal-tags">
                  {selectedMeal.category && <span className="tag">{selectedMeal.category}</span>}
                  {selectedMeal.area && <span className="tag">{selectedMeal.area}</span>}
                </div>
                <div className="modal-section">
                  <h3>Ingredients</h3>
                  <ul className="modal-ingredients">
                    {selectedMeal.ingredients.map((ing, i) => (
                      <li key={i}>
                        <span className="ingredient-measure">{ing.measure}</span> {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="modal-section">
                  <h3>Instructions</h3>
                  <p className="modal-instructions">{selectedMeal.instructions}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
