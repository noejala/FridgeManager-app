import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/Product';
import { RecipeMatch } from './WhatToCook';
import { matchRecipeIngredients, IngredientMatch } from '../utils/ingredientMatcher';
import './CookingSession.css';

function parseSteps(instructions: string): string[] {
  const byNewline = instructions
    .split(/\r?\n/)
    .map(s => s.replace(/^(step\s*\d+\s*[:.]*\s*|\d+[.:)]\s*)/i, '').trim())
    .filter(s => s.length > 2);
  if (byNewline.length > 1) return byNewline;
  const byNumber = instructions.split(/(?=\d+\.\s)/).map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(s => s.length > 0);
  if (byNumber.length > 1) return byNumber;
  return [instructions.trim()];
}

interface Props {
  recipes: RecipeMatch[];
  fridgeProducts: Product[];
  onClose: () => void;
  onFinish: (productIds: string[]) => void;
  onRemoveRecipe: (recipeId: string) => void;
}

type Phase = 'cooking' | 'confirming';

export const CookingSession = ({ recipes, fridgeProducts, onClose, onFinish, onRemoveRecipe }: Props) => {
  const { t } = useTranslation();

  // checkedSteps: recipeId → Set of checked step indices
  const [checkedSteps, setCheckedSteps] = useState<Map<string, Set<number>>>(new Map());
  const [phase, setPhase] = useState<Phase>('cooking');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Compute all ingredient → product matches across all recipes
  const allMatches = useMemo<Map<string, IngredientMatch[]>>(() => {
    const map = new Map<string, IngredientMatch[]>();
    const usedIds = new Set<string>();
    for (const recipe of recipes) {
      // Only match fridge-available ingredients for consumption
      const fridgeIngredients = [...recipe.available];
      const matches = matchRecipeIngredients(
        fridgeIngredients,
        fridgeProducts.filter(p => !usedIds.has(p.id))
      );
      matches.forEach(m => usedIds.add(m.product.id));
      map.set(recipe.meal.id, matches);
    }
    return map;
  }, [recipes, fridgeProducts]);

  const toggleStep = (recipeId: string, stepIndex: number) => {
    setCheckedSteps(prev => {
      const next = new Map(prev);
      const steps = new Set(next.get(recipeId) ?? []);
      if (steps.has(stepIndex)) steps.delete(stepIndex);
      else steps.add(stepIndex);
      next.set(recipeId, steps);
      return next;
    });
  };

  const handleGoToConfirm = () => {
    // Pre-select all matched products
    const ids = new Set<string>();
    allMatches.forEach(matches => matches.forEach(m => ids.add(m.product.id)));
    setSelectedProductIds(ids);
    setPhase('confirming');
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalSteps = recipes.reduce((sum, r) => sum + parseSteps(r.meal.instructions).length, 0);
  const checkedCount = [...checkedSteps.values()].reduce((sum, s) => sum + s.size, 0);

  // Flatten all matched products (deduplicated) for the confirmation view
  const allMatchedProducts = useMemo<{ product: Product; ingredientNames: string[] }[]>(() => {
    const byId = new Map<string, { product: Product; ingredientNames: string[] }>();
    allMatches.forEach(matches => {
      matches.forEach(({ product, ingredient }) => {
        if (!byId.has(product.id)) {
          byId.set(product.id, { product, ingredientNames: [] });
        }
        byId.get(product.id)!.ingredientNames.push(ingredient.name);
      });
    });
    return [...byId.values()];
  }, [allMatches]);

  return (
    <div className="cooking-session-overlay">
      <div className="cooking-session-panel">

        {/* Header */}
        <div className="cooking-session-header">
          <button className="cooking-session-close" onClick={onClose}>✕</button>
          <div className="cooking-session-header-title">
            {phase === 'cooking'
              ? t('cook.session.title', { count: recipes.length })
              : t('cook.session.confirmTitle')
            }
          </div>
          {phase === 'cooking' && totalSteps > 0 && (
            <span className="cooking-session-progress">{checkedCount}/{totalSteps}</span>
          )}
        </div>

        {/* Body */}
        <div className="cooking-session-body">

          {phase === 'cooking' && recipes.map(recipe => {
            const steps = parseSteps(recipe.meal.instructions);
            const checked = checkedSteps.get(recipe.meal.id) ?? new Set<number>();
            return (
              <div key={recipe.meal.id} className="cooking-recipe-block">
                <div className="cooking-recipe-header">
                  <span className="cooking-recipe-name">{recipe.meal.name}</span>
                  <button
                    className="cooking-recipe-remove"
                    onClick={() => onRemoveRecipe(recipe.meal.id)}
                    title={t('cook.session.removeRecipe')}
                  >×</button>
                </div>
                <div className="cooking-recipe-steps-progress">
                  <div
                    className="cooking-recipe-steps-bar"
                    style={{ width: `${steps.length > 0 ? (checked.size / steps.length) * 100 : 0}%` }}
                  />
                </div>
                <ol className="cooking-steps-list">
                  {steps.map((step, i) => (
                    <li
                      key={i}
                      className={`cooking-step${checked.has(i) ? ' checked' : ''}`}
                      onClick={() => toggleStep(recipe.meal.id, i)}
                    >
                      <span className="cooking-step-check">{checked.has(i) ? '✓' : ''}</span>
                      <span className="cooking-step-text">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}

          {phase === 'confirming' && (
            <div className="cooking-confirm-section">
              {allMatchedProducts.length === 0 ? (
                <p className="cooking-confirm-empty">{t('cook.session.noProductsMatched')}</p>
              ) : (
                <>
                  <p className="cooking-confirm-hint">{t('cook.session.confirmHint')}</p>
                  <ul className="cooking-confirm-list">
                    {allMatchedProducts.map(({ product, ingredientNames }) => (
                      <li
                        key={product.id}
                        className={`cooking-confirm-item${selectedProductIds.has(product.id) ? ' selected' : ''}`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <span className="cooking-confirm-check">
                          {selectedProductIds.has(product.id) ? '✓' : ''}
                        </span>
                        <div className="cooking-confirm-info">
                          <span className="cooking-confirm-name">{product.name}</span>
                          <span className="cooking-confirm-match">← {ingredientNames.join(', ')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cooking-session-footer">
          {phase === 'cooking' ? (
            <button className="cooking-session-finish-btn" onClick={handleGoToConfirm}>
              {t('cook.session.done')}
            </button>
          ) : (
            <>
              <button className="cooking-session-back-btn" onClick={() => setPhase('cooking')}>
                {t('cook.session.back')}
              </button>
              <button
                className="cooking-session-confirm-btn"
                onClick={() => onFinish(Array.from(selectedProductIds))}
              >
                {t('cook.session.removeFridge')}
                {selectedProductIds.size > 0 && (
                  <span className="cooking-session-confirm-count">{selectedProductIds.size}</span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
