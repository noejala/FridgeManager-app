const FR_TO_EN: Record<string, string> = {
  // Condiments & sauces (avant les mots courts pour priorité au match partiel)
  'mayonnaise': 'mayonnaise',
  'ketchup': 'ketchup',
  'moutarde': 'mustard',
  'sauce soja': 'soy sauce',
  'sauce tomate': 'tomato puree',
  'vinaigre': 'vinegar',
  'huile': 'oil',
  'huile d\'olive': 'olive oil',

  // Féculents & produits secs
  'riz': 'rice',
  'pâtes': 'pasta',
  'pate': 'pasta',
  'farine': 'flour',
  'pain': 'bread',
  'pizza': 'pizza',
  'pepperoni': 'pepperoni',
  'ravioli': 'pasta',
  'gnocchi': 'gnocchi',
  'quinoa': 'quinoa',
  'semoule': 'semolina',
  'lentille': 'lentils',
  'pois chiche': 'chickpeas',

  // Viandes
  'poulet': 'chicken',
  'bœuf': 'beef',
  'boeuf': 'beef',
  'porc': 'pork',
  'agneau': 'lamb',
  'saucisse': 'sausage',
  'dinde': 'turkey',
  'jambon': 'ham',
  'lardons': 'bacon',
  'bacon': 'bacon',
  'veau': 'veal',
  'canard': 'duck',
  'lapin': 'rabbit',
  'steak haché': 'ground beef',
  'boulette': 'meatball',
  'chorizo': 'chorizo',
  'merguez': 'sausage',
  'rôti': 'roast',

  // Poissons & fruits de mer
  'saumon': 'salmon',
  'thon': 'tuna',
  'cabillaud': 'cod',
  'crevette': 'shrimp',
  'sardine': 'sardine',
  'truite': 'trout',
  'maquereau': 'mackerel',
  'hareng': 'herring',
  'anchois': 'anchovy',
  'crabe': 'crab',
  'homard': 'lobster',
  'moule': 'mussel',
  'huître': 'oyster',
  'calmar': 'squid',
  'poulpe': 'octopus',
  'palourde': 'clam',
  'espadon': 'swordfish',
  'bar': 'sea bass',
  'dorade': 'sea bream',
  'daurade': 'sea bream',
  'sole': 'sole',
  'turbot': 'turbot',
  'poisson': 'fish',

  // Produits laitiers
  'lait': 'milk',
  'fromage': 'cheese',
  'yaourt': 'yogurt',
  'yogourt': 'yogurt',
  'beurre': 'butter',
  'crème': 'cream',
  'œuf': 'egg',
  'oeuf': 'egg',
  'mozzarella': 'mozzarella',
  'parmesan': 'parmesan',
  'brie': 'brie',
  'camembert': 'camembert',
  'gouda': 'gouda',
  'feta': 'feta',
  'ricotta': 'ricotta',
  'fromage blanc': 'cottage cheese',
  'crème fraîche': 'sour cream',
  'chantilly': 'whipped cream',
  'mascarpone': 'mascarpone',

  // Légumes
  'carotte': 'carrot',
  'tomate': 'tomato',
  'pomme de terre': 'potato',
  'oignon': 'onion',
  'salade': 'lettuce',
  'laitue': 'lettuce',
  'brocoli': 'broccoli',
  'épinard': 'spinach',
  'poivron': 'pepper',
  'concombre': 'cucumber',
  'courgette': 'zucchini',
  'aubergine': 'eggplant',
  'céleri': 'celery',
  'chou-fleur': 'cauliflower',
  'chou': 'cabbage',
  'ail': 'garlic',
  'champignon': 'mushroom',
  'pleurote': 'oyster mushroom',
  'girofle': 'clove',
  'maïs': 'corn',
  'petit pois': 'pea',
  'haricot': 'bean',
  'poireau': 'leek',
  'asperge': 'asparagus',
  'radis': 'radish',
  'betterave': 'beet',
  'artichaut': 'artichoke',
  'roquette': 'arugula',
  'patate douce': 'sweet potato',
  'navet': 'turnip',
  'courge': 'squash',
  'citrouille': 'pumpkin',
  'avocat': 'avocado',
  'endive': 'endive',
  'fenouil': 'fennel',

  // Fruits
  'pomme': 'apple',
  'banane': 'banana',
  'orange': 'orange',
  'fraise': 'strawberry',
  'raisin': 'grape',
  'mangue': 'mango',
  'poire': 'pear',
  'citron': 'lemon',
  'kiwi': 'kiwi',
  'pêche': 'peach',
  'cerise': 'cherry',
  'pastèque': 'watermelon',
  'melon': 'melon',
  'ananas': 'pineapple',
  'myrtille': 'blueberry',
  'framboise': 'raspberry',
  'prune': 'plum',
  'abricot': 'apricot',
  'figue': 'fig',
  'clémentine': 'clementine',
  'mandarine': 'tangerine',
  'pamplemousse': 'grapefruit',
  'mûre': 'blackberry',
  'litchi': 'lychee',
  'châtaigne': 'chestnut',
  'marron': 'chestnut',

  // Boissons
  'eau': 'water',
  'jus': 'juice',
  'bière': 'beer',
  'vin': 'wine',
  'café': 'coffee',
  'thé': 'tea',
  'limonade': 'lemonade',
  'cidre': 'cider',
  'sirop': 'syrup',
};

function frSingularize(word: string): string {
  if (word.endsWith('aux')) return word.slice(0, -3) + 'al';
  if (word.endsWith('s') || word.endsWith('x')) return word.slice(0, -1);
  // Multi-word: singularize first word ("pommes de terre" → "pomme de terre")
  const spaceIdx = word.indexOf(' ');
  if (spaceIdx > 0) {
    const first = frSingularize(word.slice(0, spaceIdx));
    if (first !== word.slice(0, spaceIdx)) return first + word.slice(spaceIdx);
  }
  return word;
}

export function toEnglishIngredient(name: string): string {
  const normalized = name.toLowerCase().trim();

  if (FR_TO_EN[normalized]) return FR_TO_EN[normalized];

  // Try French-singularized form ("bananes" → "banane", "légaux" → "légal")
  const singular = frSingularize(normalized);
  if (singular !== normalized && FR_TO_EN[singular]) return FR_TO_EN[singular];

  // Partial match — handles "blanc de poulet" → "chicken", etc.
  // Uses word boundaries to avoid false matches ("barista" matching "bar", etc.)
  for (const [fr, en] of Object.entries(FR_TO_EN)) {
    const escaped = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ])${escaped}(?:$|[^a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ])`, 'i');
    if (regex.test(normalized)) return en;
  }

  return name;
}
