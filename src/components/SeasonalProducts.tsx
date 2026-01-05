import './SeasonalProducts.css';

export const SeasonalProducts = () => {
  // Get current month (0-11, so we add 1)
  const currentMonth = new Date().getMonth() + 1;

  // Simple seasonal products by month (Northern Hemisphere)
  const seasonalData: { [key: number]: { season: string; products: string[] } } = {
    1: { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Carrots', 'Potatoes', 'Apples', 'Pears'] },
    2: { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Carrots', 'Potatoes', 'Apples', 'Leeks'] },
    3: { season: 'Spring', products: ['Asparagus', 'Spinach', 'Lettuce', 'Radishes', 'Strawberries', 'Rhubarb'] },
    4: { season: 'Spring', products: ['Asparagus', 'Peas', 'Lettuce', 'Radishes', 'Strawberries', 'Artichokes'] },
    5: { season: 'Spring', products: ['Strawberries', 'Cherries', 'Peas', 'Lettuce', 'Radishes', 'Asparagus'] },
    6: { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Cucumbers', 'Strawberries', 'Cherries', 'Peaches'] },
    7: { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Peppers', 'Peaches', 'Plums', 'Blueberries'] },
    8: { season: 'Summer', products: ['Tomatoes', 'Corn', 'Peppers', 'Peaches', 'Plums', 'Melons'] },
    9: { season: 'Autumn', products: ['Apples', 'Pears', 'Grapes', 'Mushrooms', 'Pumpkins', 'Squash'] },
    10: { season: 'Autumn', products: ['Apples', 'Pears', 'Grapes', 'Mushrooms', 'Pumpkins', 'Chestnuts'] },
    11: { season: 'Autumn', products: ['Apples', 'Pears', 'Cabbage', 'Carrots', 'Potatoes', 'Brussels sprouts'] },
    12: { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Carrots', 'Potatoes', 'Apples', 'Pears'] }
  };

  const currentSeason = seasonalData[currentMonth] || seasonalData[1];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="seasonal-products">
      <div className="seasonal-header">
        <h2>🌱 Seasonal products</h2>
        <p className="seasonal-subtitle">
          Recommended products for {monthNames[currentMonth - 1]} ({currentSeason.season})
        </p>
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
                {getProductEmoji(product)}
              </div>
              <h3>{product}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const getProductEmoji = (product: string): string => {
  const emojiMap: { [key: string]: string } = {
    'Citrus fruits': '🍊',
    'Cabbage': '🥬',
    'Carrots': '🥕',
    'Potatoes': '🥔',
    'Apples': '🍎',
    'Pears': '🍐',
    'Leeks': '🧅',
    'Asparagus': '🌱',
    'Spinach': '🥬',
    'Lettuce': '🥬',
    'Radishes': '🌶️',
    'Strawberries': '🍓',
    'Rhubarb': '🌿',
    'Peas': '🫛',
    'Artichokes': '🥬',
    'Cherries': '🍒',
    'Tomatoes': '🍅',
    'Zucchini': '🥒',
    'Cucumbers': '🥒',
    'Peaches': '🍑',
    'Peppers': '🫑',
    'Plums': '🟣',
    'Blueberries': '🫐',
    'Corn': '🌽',
    'Melons': '🍈',
    'Grapes': '🍇',
    'Mushrooms': '🍄',
    'Pumpkins': '🎃',
    'Squash': '🎃',
    'Chestnuts': '🌰',
    'Brussels sprouts': '🥬'
  };

  return emojiMap[product] || '🥬';
};

