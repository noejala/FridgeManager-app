import { Product } from '../types/Product';
import './WhatToCook.css';

interface WhatToCookProps {
  products: Product[];
}

export const WhatToCook = ({ products }: WhatToCookProps) => {
  // Simple suggestions based on available products
  const getSuggestions = () => {
    if (products.length === 0) {
      return {
        message: "Add some products to your fridge to get cooking suggestions!",
        recipes: []
      };
    }

    const categories = products.map(p => p.category);
    const uniqueCategories = [...new Set(categories)];

    const suggestions = [];

    if (uniqueCategories.includes('Meat') || uniqueCategories.includes('Fish')) {
      suggestions.push({
        title: "Grilled Protein",
        description: "You have meat or fish! Perfect for grilling or pan-searing.",
        ingredients: products.filter(p => p.category === 'Meat' || p.category === 'Fish').slice(0, 2)
      });
    }

    if (uniqueCategories.includes('Fruits') || uniqueCategories.includes('Vegetables')) {
      suggestions.push({
        title: "Fresh Salad",
        description: "Mix your fresh fruits and vegetables for a healthy salad.",
        ingredients: products.filter(p => p.category === 'Fruits' || p.category === 'Vegetables').slice(0, 3)
      });
    }

    if (uniqueCategories.includes('Dairy')) {
      suggestions.push({
        title: "Creamy Dish",
        description: "Use your dairy products to create a creamy sauce or dessert.",
        ingredients: products.filter(p => p.category === 'Dairy').slice(0, 2)
      });
    }

    return {
      message: `Based on your ${products.length} product${products.length > 1 ? 's' : ''}, here are some suggestions:`,
      recipes: suggestions.length > 0 ? suggestions : [{
        title: "Simple Meal",
        description: "Use what you have to create a simple, delicious meal!",
        ingredients: products.slice(0, 3)
      }]
    };
  };

  const { message, recipes } = getSuggestions();

  return (
    <div className="what-to-cook">
      <div className="cook-header">
        <h2>🍳 What to cook</h2>
        <p className="cook-subtitle">{message}</p>
      </div>

      {recipes.length === 0 ? (
        <div className="empty-suggestions">
          <div className="empty-icon">🍽️</div>
          <p>Add products to your fridge to get personalized cooking suggestions!</p>
        </div>
      ) : (
        <div className="suggestions-grid">
          {recipes.map((recipe, index) => (
            <div key={index} className="suggestion-card">
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              {recipe.ingredients.length > 0 && (
                <div className="ingredients-list">
                  <strong>You can use:</strong>
                  <ul>
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i}>
                        {ing.name} ({ing.quantity} {ing.unit})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

