import { ProductCategory } from '../types/Product';

const CATEGORY_KEYWORDS: Record<Exclude<ProductCategory, 'Other'>, string[]> = {
  Fruits: [
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'mango', 'pear',
    'lemon', 'kiwi', 'peach', 'cherry', 'watermelon', 'melon', 'pineapple',
    'blueberry', 'raspberry', 'plum', 'apricot', 'fig', 'pomegranate',
    'lime', 'coconut', 'papaya', 'nectarine', 'clementine', 'tangerine',
    'grapefruit', 'blackberry', 'cranberry', 'passion fruit', 'lychee',
  ],
  Vegetables: [
    'carrot', 'tomato', 'potato', 'onion', 'lettuce', 'broccoli', 'spinach',
    'pepper', 'cucumber', 'zucchini', 'eggplant', 'celery', 'cabbage',
    'cauliflower', 'garlic', 'mushroom', 'corn', 'pea', 'bean', 'leek',
    'asparagus', 'radish', 'beet', 'artichoke', 'kale', 'arugula',
    'sweet potato', 'turnip', 'squash', 'pumpkin', 'avocado',
  ],
  Meat: [
    'chicken', 'beef', 'pork', 'lamb', 'steak', 'sausage', 'turkey', 'ham',
    'bacon', 'veal', 'duck', 'rabbit', 'ground beef', 'meatball', 'salami',
    'chorizo', 'prosciutto', 'pepperoni', 'ribs', 'wing',
  ],
  Fish: [
    'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'sardine', 'trout',
    'mackerel', 'herring', 'anchovy', 'crab', 'lobster', 'mussel', 'oyster',
    'squid', 'octopus', 'clam', 'scallop', 'swordfish', 'bass', 'haddock',
    'tilapia', 'fish',
  ],
  Dairy: [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'mozzarella',
    'cheddar', 'parmesan', 'brie', 'camembert', 'gouda', 'feta',
    'ricotta', 'cottage cheese', 'sour cream', 'whipped cream',
    'cream cheese', 'mascarpone',
  ],
  Beverages: [
    'water', 'juice', 'soda', 'beer', 'wine', 'coffee', 'tea',
    'lemonade', 'smoothie', 'milkshake', 'cola', 'kombucha',
    'energy drink', 'sparkling water', 'cider',
  ],
  Frozen: [
    'ice cream', 'frozen', 'sorbet', 'gelato', 'popsicle', 'frozen pizza',
    'frozen vegetables', 'frozen fruit',
  ],
};

export function guessCategory(name: string): ProductCategory {
  const normalized = name.toLowerCase().trim();
  if (!normalized) return 'Other';

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category as ProductCategory;
      }
    }
  }

  return 'Other';
}
