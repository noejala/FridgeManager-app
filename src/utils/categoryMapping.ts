import { ProductCategory } from '../types/Product';

const CATEGORY_KEYWORDS: Record<Exclude<ProductCategory, 'Other'>, string[]> = {
  Sauces: [
    // English
    'ketchup', 'mayonnaise', 'mayo', 'mustard', 'hot sauce', 'soy sauce',
    'worcestershire', 'sriracha', 'tabasco', 'pesto', 'salsa', 'hummus', 'houmous',
    'vinaigrette', 'dressing', 'tahini', 'tapenade', 'jam', 'jelly', 'honey',
    'syrup', 'aioli', 'tzatziki', 'guacamole', 'bbq sauce', 'teriyaki',
    'bolognese', 'tomato sauce', 'béchamel', 'bechamel',
    // French
    'moutarde', 'sauce tomate', 'sauce soja', 'sauce piquante', 'harissa',
    'bolognaise', 'vinaigrette', 'confiture', 'miel', 'sirop', 'aïoli',
    'tapenade', 'houmous', 'crème de', 'sauce barbecue', 'sauce curry',
    'sauce', 'ketchup', 'mayo',
  ],
  Milk: [
    // English
    'milk', 'oat milk', 'almond milk', 'soy milk', 'rice milk', 'coconut milk',
    // French
    'lait', "lait d'avoine", "lait d'amande", 'lait de soja', 'lait de riz', 'lait de coco',
  ],
  Juice: [
    // English
    'juice', 'orange juice', 'apple juice', 'grape juice',
    // French
    'jus', "jus d'orange", 'jus de pomme', 'jus de raisin',
  ],
  Cream: [
    // English
    'heavy cream', 'whipping cream', 'liquid cream', 'single cream', 'double cream',
    // French
    'crème liquide', 'crème fleurette', 'crème entière', 'crème légère',
  ],
  Fruits: [
    // English
    'apple', 'banana', 'orange', 'strawberry', 'grape', 'mango', 'pear',
    'lemon', 'kiwi', 'peach', 'cherry', 'watermelon', 'melon', 'pineapple',
    'blueberry', 'raspberry', 'plum', 'apricot', 'fig', 'pomegranate',
    'lime', 'coconut', 'papaya', 'nectarine', 'clementine', 'tangerine',
    'grapefruit', 'blackberry', 'cranberry', 'passion fruit', 'lychee',
    // French
    'pomme', 'banane', 'fraise', 'raisin', 'mangue', 'poire', 'citron',
    'pêche', 'cerise', 'pastèque', 'ananas', 'myrtille', 'framboise',
    'prune', 'abricot', 'figue', 'grenade', 'noix de coco', 'papaye',
    'clémentine', 'mandarine', 'pamplemousse', 'mûre', 'canneberge',
    'fruit de la passion', 'litchi',
  ],
  Vegetables: [
    // English
    'carrot', 'tomato', 'potato', 'onion', 'lettuce', 'broccoli', 'spinach',
    'pepper', 'cucumber', 'zucchini', 'eggplant', 'celery', 'cabbage',
    'cauliflower', 'garlic', 'mushroom', 'corn', 'pea', 'bean', 'leek',
    'asparagus', 'radish', 'beet', 'artichoke', 'kale', 'arugula',
    'sweet potato', 'turnip', 'squash', 'pumpkin', 'avocado',
    // French
    'carotte', 'tomate', 'pomme de terre', 'oignon', 'salade', 'laitue',
    'brocoli', 'épinard', 'poivron', 'concombre', 'courgette', 'aubergine',
    'céleri', 'chou-fleur', 'chou', 'ail', 'champignon', 'maïs',
    'petit pois', 'haricot', 'poireau', 'asperge', 'radis', 'betterave',
    'artichaut', 'roquette', 'patate douce', 'navet', 'courge', 'citrouille',
    'avocat',
  ],
  Meat: [
    // English
    'chicken', 'beef', 'pork', 'lamb', 'steak', 'sausage', 'turkey', 'ham',
    'bacon', 'veal', 'duck', 'rabbit', 'ground beef', 'meatball', 'salami',
    'chorizo', 'prosciutto', 'pepperoni', 'ribs', 'wing',
    // French
    'poulet', 'bœuf', 'boeuf', 'porc', 'agneau', 'saucisse', 'dinde',
    'jambon', 'lardons', 'veau', 'canard', 'lapin', 'steak haché',
    'boulette', 'côtes', 'aile', 'merguez', 'andouille', 'boudin', 'rôti',
  ],
  Fish: [
    // English
    'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'sardine', 'trout',
    'mackerel', 'herring', 'anchovy', 'crab', 'lobster', 'mussel', 'oyster',
    'squid', 'octopus', 'clam', 'scallop', 'swordfish', 'bass', 'haddock',
    'tilapia', 'fish',
    // French
    'saumon', 'thon', 'cabillaud', 'crevette', 'sardine', 'truite',
    'maquereau', 'hareng', 'anchois', 'crabe', 'homard', 'moule', 'huître',
    'calmar', 'poulpe', 'palourde', 'espadon', 'bar', 'aiglefin', 'poisson',
    'lieu', 'dorade', 'daurade', 'sole', 'turbot',
  ],
  Dairy: [
    // English
    'cheese', 'yogurt', 'butter', 'cream', 'egg', 'mozzarella',
    'cheddar', 'parmesan', 'brie', 'camembert', 'gouda', 'feta',
    'ricotta', 'cottage cheese', 'sour cream', 'whipped cream',
    'cream cheese', 'mascarpone',
    // French
    'fromage', 'yaourt', 'yogourt', 'beurre', 'crème', 'œuf', 'oeuf',
    'fromage blanc', 'crème fraîche', 'chantilly',
  ],
  Beverages: [
    // English
    'water', 'soda', 'beer', 'wine', 'coffee', 'tea',
    'lemonade', 'smoothie', 'milkshake', 'cola', 'kombucha',
    'energy drink', 'sparkling water', 'cider',
    // French
    'eau', 'bière', 'vin', 'café', 'thé', 'limonade', 'cidre',
  ],
  Frozen: [
    // English
    'ice cream', 'frozen', 'sorbet', 'gelato', 'popsicle', 'frozen pizza',
    'frozen vegetables', 'frozen fruit',
    // French
    'glace', 'surgelé', 'eskimo',
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
