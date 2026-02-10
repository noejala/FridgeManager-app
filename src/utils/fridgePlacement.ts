export type FridgeZone = 'Top of fridge' | 'Middle of fridge' | 'Bottom of fridge' | 'Fridge door' | 'Crisper drawer';

const ZONE_KEYWORDS: Record<FridgeZone, string[]> = {
  'Top of fridge': [
    'yogurt', 'cream', 'sour cream', 'whipped cream', 'cream cheese',
    'cottage cheese', 'ricotta', 'mascarpone', 'cheese', 'brie', 'camembert',
    'gouda', 'feta', 'mozzarella', 'cheddar', 'parmesan',
  ],
  'Middle of fridge': [
    'ham', 'salami', 'chorizo', 'prosciutto', 'pepperoni',
  ],
  'Bottom of fridge': [
    'chicken', 'beef', 'pork', 'lamb', 'steak', 'sausage', 'turkey', 'veal',
    'duck', 'rabbit', 'ground beef', 'meatball', 'ribs', 'wing',
    'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'sardine', 'trout',
    'mackerel', 'herring', 'anchovy', 'crab', 'lobster', 'mussel', 'oyster',
    'squid', 'octopus', 'clam', 'scallop', 'swordfish', 'bass', 'haddock',
    'tilapia', 'fish',
  ],
  'Fridge door': [
    'butter', 'egg', 'milk', 'juice', 'soda', 'beer', 'wine', 'water',
    'lemonade', 'cola', 'kombucha', 'energy drink', 'sparkling water', 'cider',
    'coffee', 'tea', 'smoothie', 'milkshake',
  ],
  'Crisper drawer': [
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'mango', 'pear',
    'lemon', 'kiwi', 'peach', 'cherry', 'watermelon', 'melon', 'pineapple',
    'blueberry', 'raspberry', 'plum', 'apricot', 'fig', 'pomegranate',
    'lime', 'coconut', 'papaya', 'nectarine', 'clementine', 'tangerine',
    'grapefruit', 'blackberry', 'cranberry', 'passion fruit', 'lychee',
    'carrot', 'tomato', 'potato', 'onion', 'lettuce', 'broccoli', 'spinach',
    'pepper', 'cucumber', 'zucchini', 'eggplant', 'celery', 'cabbage',
    'cauliflower', 'garlic', 'mushroom', 'corn', 'pea', 'bean', 'leek',
    'asparagus', 'radish', 'beet', 'artichoke', 'kale', 'arugula',
    'sweet potato', 'turnip', 'squash', 'pumpkin', 'avocado',
  ],
};

const CATEGORY_TO_ZONE: Record<string, FridgeZone> = {
  Dairy: 'Top of fridge',
  Meat: 'Bottom of fridge',
  Fish: 'Bottom of fridge',
  Fruits: 'Crisper drawer',
  Vegetables: 'Crisper drawer',
  Beverages: 'Fridge door',
};

export function getFridgeZone(name: string, category: string): FridgeZone {
  const normalized = name.toLowerCase().trim();

  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return zone as FridgeZone;
      }
    }
  }

  if (category in CATEGORY_TO_ZONE) {
    return CATEGORY_TO_ZONE[category];
  }

  return 'Middle of fridge';
}

const ZONE_EXPLANATIONS: Record<FridgeZone, string> = {
  'Top of fridge': 'The top of the fridge has a mild, stable temperature — ideal for dairy products, leftovers, and ready-to-eat items that don\'t need intense cold.',
  'Middle of fridge': 'The middle shelves have a consistent, moderate temperature — perfect for deli meats, cooked dishes, and prepared foods.',
  'Bottom of fridge': 'The bottom of the fridge is the coldest zone — essential for raw meat and fish to prevent bacterial growth and keep them fresh longer.',
  'Fridge door': 'The door is the warmest part of the fridge — suitable for condiments, drinks, butter, and eggs which tolerate slight temperature changes.',
  'Crisper drawer': 'The crisper drawer maintains higher humidity — designed to keep fruits and vegetables fresh and prevent them from drying out.',
};

export function getZoneExplanation(zone: string): string {
  return ZONE_EXPLANATIONS[zone as FridgeZone] ?? '';
}
