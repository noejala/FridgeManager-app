import { useState, useEffect } from 'react';
import './SeasonalProducts.css';

type RegionId = 'france' | 'mediterranean' | 'north_europe' | 'north_america' | 'southern_hemisphere';

const REGIONS: { id: RegionId; name: string; flag: string }[] = [
  { id: 'france', name: 'France', flag: '🇫🇷' },
  { id: 'mediterranean', name: 'Mediterranean', flag: '🌊' },
  { id: 'north_europe', name: 'N. Europe', flag: '🇸🇪' },
  { id: 'north_america', name: 'N. America', flag: '🇺🇸' },
  { id: 'southern_hemisphere', name: 'S. Hemisphere', flag: '🌏' },
];

type SeasonalEntry = { season: string; products: string[] };

const seasonalDataByRegion: Record<RegionId, Record<number, SeasonalEntry>> = {
  france: {
    1:  { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Carrots', 'Potatoes', 'Apples', 'Endives'] },
    2:  { season: 'Winter', products: ['Citrus fruits', 'Leeks', 'Endives', 'Potatoes', 'Apples', 'Carrots'] },
    3:  { season: 'Spring', products: ['Asparagus', 'Spinach', 'Radishes', 'Leeks', 'Carrots', 'Lettuce'] },
    4:  { season: 'Spring', products: ['Asparagus', 'Peas', 'Lettuce', 'Radishes', 'Strawberries', 'Artichokes'] },
    5:  { season: 'Spring', products: ['Strawberries', 'Cherries', 'Asparagus', 'Peas', 'Spinach', 'Radishes'] },
    6:  { season: 'Summer', products: ['Strawberries', 'Cherries', 'Tomatoes', 'Zucchini', 'Cucumbers', 'Peaches'] },
    7:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Peppers', 'Peaches', 'Plums', 'Blueberries'] },
    8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Peppers', 'Melons', 'Figs', 'Peaches'] },
    9:  { season: 'Autumn', products: ['Grapes', 'Apples', 'Pears', 'Mushrooms', 'Pumpkins', 'Figs'] },
    10: { season: 'Autumn', products: ['Apples', 'Pears', 'Grapes', 'Chestnuts', 'Mushrooms', 'Pumpkins'] },
    11: { season: 'Autumn', products: ['Cabbage', 'Carrots', 'Potatoes', 'Brussels sprouts', 'Mushrooms', 'Leeks'] },
    12: { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Carrots', 'Potatoes', 'Pears', 'Endives'] },
  },
  mediterranean: {
    1:  { season: 'Winter', products: ['Citrus fruits', 'Artichokes', 'Broccoli', 'Fennel', 'Cauliflower', 'Olives'] },
    2:  { season: 'Winter', products: ['Citrus fruits', 'Artichokes', 'Fennel', 'Broccoli', 'Peas', 'Cauliflower'] },
    3:  { season: 'Spring', products: ['Artichokes', 'Peas', 'Fava beans', 'Asparagus', 'Strawberries', 'Fennel'] },
    4:  { season: 'Spring', products: ['Strawberries', 'Artichokes', 'Asparagus', 'Fava beans', 'Peas', 'Lettuce'] },
    5:  { season: 'Spring', products: ['Strawberries', 'Cherries', 'Zucchini', 'Tomatoes', 'Fava beans', 'Peaches'] },
    6:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Zucchini', 'Peaches', 'Apricots', 'Cherries'] },
    7:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Watermelon', 'Peaches', 'Figs'] },
    8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Figs', 'Grapes', 'Watermelon'] },
    9:  { season: 'Autumn', products: ['Grapes', 'Figs', 'Tomatoes', 'Eggplant', 'Peppers', 'Mushrooms'] },
    10: { season: 'Autumn', products: ['Grapes', 'Pomegranates', 'Mushrooms', 'Chestnuts', 'Artichokes', 'Fennel'] },
    11: { season: 'Autumn', products: ['Citrus fruits', 'Artichokes', 'Broccoli', 'Fennel', 'Mushrooms', 'Olives'] },
    12: { season: 'Winter', products: ['Citrus fruits', 'Artichokes', 'Broccoli', 'Cauliflower', 'Fennel', 'Olives'] },
  },
  north_europe: {
    1:  { season: 'Winter', products: ['Kale', 'Carrots', 'Potatoes', 'Parsnips', 'Beetroot', 'Cabbage'] },
    2:  { season: 'Winter', products: ['Kale', 'Carrots', 'Leeks', 'Potatoes', 'Parsnips', 'Celeriac'] },
    3:  { season: 'Winter', products: ['Kale', 'Leeks', 'Carrots', 'Potatoes', 'Broccoli', 'Celeriac'] },
    4:  { season: 'Spring', products: ['Asparagus', 'Broccoli', 'Spinach', 'Radishes', 'Lettuce', 'Leeks'] },
    5:  { season: 'Spring', products: ['Asparagus', 'Spinach', 'Radishes', 'Lettuce', 'Strawberries', 'Peas'] },
    6:  { season: 'Summer', products: ['Strawberries', 'Peas', 'Lettuce', 'Broad beans', 'New potatoes', 'Raspberries'] },
    7:  { season: 'Summer', products: ['Strawberries', 'Raspberries', 'Peas', 'Zucchini', 'Broad beans', 'Lettuce'] },
    8:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Runner beans', 'Blueberries', 'Corn', 'Cucumbers'] },
    9:  { season: 'Autumn', products: ['Apples', 'Pears', 'Blackberries', 'Mushrooms', 'Squash', 'Beetroot'] },
    10: { season: 'Autumn', products: ['Apples', 'Pears', 'Kale', 'Mushrooms', 'Squash', 'Beetroot'] },
    11: { season: 'Autumn', products: ['Kale', 'Parsnips', 'Carrots', 'Potatoes', 'Brussels sprouts', 'Leeks'] },
    12: { season: 'Winter', products: ['Kale', 'Brussels sprouts', 'Parsnips', 'Carrots', 'Potatoes', 'Celeriac'] },
  },
  north_america: {
    1:  { season: 'Winter', products: ['Citrus fruits', 'Kale', 'Brussels sprouts', 'Sweet potatoes', 'Carrots', 'Beets'] },
    2:  { season: 'Winter', products: ['Citrus fruits', 'Kale', 'Leeks', 'Sweet potatoes', 'Carrots', 'Beets'] },
    3:  { season: 'Spring', products: ['Asparagus', 'Artichokes', 'Spinach', 'Lettuce', 'Radishes', 'Peas'] },
    4:  { season: 'Spring', products: ['Asparagus', 'Peas', 'Strawberries', 'Lettuce', 'Artichokes', 'Radishes'] },
    5:  { season: 'Spring', products: ['Strawberries', 'Asparagus', 'Peas', 'Lettuce', 'Cherries', 'Radishes'] },
    6:  { season: 'Summer', products: ['Blueberries', 'Cherries', 'Tomatoes', 'Zucchini', 'Corn', 'Peaches'] },
    7:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Peaches', 'Blueberries', 'Peppers', 'Zucchini'] },
    8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Peaches', 'Plums', 'Melons', 'Peppers'] },
    9:  { season: 'Autumn', products: ['Apples', 'Grapes', 'Pears', 'Pumpkins', 'Squash', 'Sweet potatoes'] },
    10: { season: 'Autumn', products: ['Apples', 'Pears', 'Pumpkins', 'Sweet potatoes', 'Cranberries', 'Mushrooms'] },
    11: { season: 'Autumn', products: ['Sweet potatoes', 'Kale', 'Brussels sprouts', 'Apples', 'Cranberries', 'Pears'] },
    12: { season: 'Winter', products: ['Citrus fruits', 'Kale', 'Sweet potatoes', 'Brussels sprouts', 'Pomegranates', 'Carrots'] },
  },
  southern_hemisphere: {
    1:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Cucumbers', 'Peaches', 'Cherries', 'Corn'] },
    2:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Peaches', 'Plums', 'Melons'] },
    3:  { season: 'Autumn', products: ['Grapes', 'Apples', 'Pears', 'Tomatoes', 'Peppers', 'Figs'] },
    4:  { season: 'Autumn', products: ['Apples', 'Pears', 'Grapes', 'Mushrooms', 'Pumpkins', 'Squash'] },
    5:  { season: 'Autumn', products: ['Apples', 'Pears', 'Cabbage', 'Carrots', 'Potatoes', 'Citrus fruits'] },
    6:  { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Carrots', 'Potatoes', 'Leeks', 'Broccoli'] },
    7:  { season: 'Winter', products: ['Citrus fruits', 'Cabbage', 'Kale', 'Carrots', 'Potatoes', 'Cauliflower'] },
    8:  { season: 'Winter', products: ['Citrus fruits', 'Broccoli', 'Cauliflower', 'Leeks', 'Carrots', 'Kale'] },
    9:  { season: 'Spring', products: ['Asparagus', 'Strawberries', 'Peas', 'Lettuce', 'Radishes', 'Spinach'] },
    10: { season: 'Spring', products: ['Strawberries', 'Asparagus', 'Cherries', 'Peas', 'Lettuce', 'Artichokes'] },
    11: { season: 'Spring', products: ['Strawberries', 'Cherries', 'Tomatoes', 'Zucchini', 'Peaches', 'Asparagus'] },
    12: { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Cucumbers', 'Peaches', 'Cherries', 'Melons'] },
  },
};

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

  const regionData = seasonalDataByRegion[selectedRegion];
  const currentSeason = regionData[currentMonth];

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
    'Peas': '🫛',
    'Artichokes': '🌿',
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
    'Brussels sprouts': '🥦',
    'Endives': '🥬',
    'Figs': '🍈',
    'Broccoli': '🥦',
    'Cauliflower': '🥦',
    'Fennel': '🌿',
    'Olives': '🫒',
    'Fava beans': '🫘',
    'Apricots': '🍑',
    'Eggplant': '🍆',
    'Watermelon': '🍉',
    'Pomegranates': '🍎',
    'Kale': '🥬',
    'Parsnips': '🥕',
    'Beetroot': '🥕',
    'Beets': '🥕',
    'Celeriac': '🥔',
    'Broad beans': '🫛',
    'Raspberries': '🍓',
    'Runner beans': '🫛',
    'Blackberries': '🫐',
    'New potatoes': '🥔',
    'Sweet potatoes': '🍠',
    'Cranberries': '🍒',
  };

  return emojiMap[product] || '🥬';
};
