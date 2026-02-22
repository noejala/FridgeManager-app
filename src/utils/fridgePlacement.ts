export type FridgeZone = 'Top of fridge' | 'Middle of fridge' | 'Bottom of fridge' | 'Fridge door' | 'Crisper drawer';

const ZONE_KEYWORDS: Record<FridgeZone, string[]> = {
  'Top of fridge': [
    // English
    'yogurt', 'cream', 'sour cream', 'whipped cream', 'cream cheese',
    'cottage cheese', 'ricotta', 'mascarpone', 'cheese', 'brie', 'camembert',
    'gouda', 'feta', 'mozzarella', 'cheddar', 'parmesan',
    // French
    'yaourt', 'yogourt', 'crème fraîche', 'chantilly', 'fromage blanc',
    'ricotta', 'mascarpone', 'fromage', 'brie', 'camembert', 'gouda', 'feta',
  ],
  'Middle of fridge': [
    // English
    'ham', 'salami', 'chorizo', 'prosciutto', 'pepperoni',
    // French
    'jambon', 'charcuterie', 'andouille',
  ],
  'Bottom of fridge': [
    // English
    'chicken', 'beef', 'pork', 'lamb', 'steak', 'sausage', 'turkey', 'veal',
    'duck', 'rabbit', 'ground beef', 'meatball', 'ribs', 'wing',
    'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'sardine', 'trout',
    'mackerel', 'herring', 'anchovy', 'crab', 'lobster', 'mussel', 'oyster',
    'squid', 'octopus', 'clam', 'scallop', 'swordfish', 'bass', 'haddock',
    'tilapia', 'fish',
    // French
    'poulet', 'bœuf', 'boeuf', 'porc', 'agneau', 'saucisse', 'dinde', 'veau',
    'canard', 'lapin', 'steak haché', 'boulette', 'merguez', 'rôti',
    'saumon', 'thon', 'cabillaud', 'crevette', 'sardine', 'truite',
    'maquereau', 'hareng', 'anchois', 'crabe', 'homard', 'moule', 'huître',
    'calmar', 'poulpe', 'palourde', 'espadon', 'bar', 'aiglefin', 'poisson',
  ],
  'Fridge door': [
    // English
    'butter', 'egg', 'milk', 'juice', 'soda', 'beer', 'wine', 'water',
    'lemonade', 'cola', 'kombucha', 'energy drink', 'sparkling water', 'cider',
    'coffee', 'tea', 'smoothie', 'milkshake',
    // French
    'beurre', 'œuf', 'oeuf', 'lait', 'jus', 'bière', 'vin', 'eau',
    'limonade', 'café', 'thé', 'cidre', 'sirop',
  ],
  'Crisper drawer': [
    // English
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
    // French
    'pomme', 'banane', 'fraise', 'raisin', 'mangue', 'poire', 'citron',
    'pêche', 'cerise', 'pastèque', 'ananas', 'myrtille', 'framboise',
    'prune', 'abricot', 'figue', 'clémentine', 'mandarine', 'pamplemousse',
    'carotte', 'tomate', 'pomme de terre', 'oignon', 'salade', 'laitue',
    'brocoli', 'épinard', 'poivron', 'concombre', 'courgette', 'aubergine',
    'céleri', 'chou-fleur', 'chou', 'ail', 'champignon', 'maïs', 'haricot',
    'poireau', 'asperge', 'radis', 'betterave', 'artichaut', 'roquette',
    'patate douce', 'navet', 'courge', 'citrouille', 'avocat',
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

