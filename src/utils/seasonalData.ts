export type RegionId = 'france_north' | 'france_south' | 'dom_tom';

export type SeasonalEntry = { season: string; products: string[] };

export const REGIONS: { id: RegionId; name: string; flag: string }[] = [
  { id: 'france_north', name: 'France (Nord)',  flag: '🇫🇷' },
  { id: 'france_south', name: 'France (Sud)',   flag: '☀️'  },
  { id: 'dom_tom',      name: 'DOM-TOM',        flag: '🏝️' },
];

const REGION_CENTROIDS: Record<RegionId, { lat: number; lng: number }> = {
  france_north: { lat: 48.5, lng:   2.5  },
  france_south: { lat: 43.5, lng:   5.5  },
  dom_tom:      { lat: 14.6, lng: -61.0  },
};

export function getNearestRegion(lat: number, lng: number): RegionId {
  let nearest: RegionId = 'france_north';
  let minDist = Infinity;
  for (const [id, c] of Object.entries(REGION_CENTROIDS) as [RegionId, { lat: number; lng: number }][]) {
    const dlat = lat - c.lat;
    const dlng = (lng - c.lng) * Math.cos((lat * Math.PI) / 180);
    const dist = dlat * dlat + dlng * dlng;
    if (dist < minDist) { minDist = dist; nearest = id; }
  }
  return nearest;
}

export const seasonalDataByRegion: Record<RegionId, Record<number, SeasonalEntry>> = {
  // Source: Calendrier Greenpeace France (greenpeace.fr/guetteur/calendrier)
  // Représentatif de la France métropolitaine Nord (IDF, Bretagne, Normandie, Grand Est, Centre)
  france_north: {
    1:  { season: 'Winter', products: ['Carrots', 'Leeks', 'Endives', 'Cabbage', 'Spinach', 'Apples', 'Pears', 'Clementines'] },
    2:  { season: 'Winter', products: ['Carrots', 'Leeks', 'Endives', 'Spinach', 'Radishes', 'Apples', 'Pears', 'Oranges'] },
    3:  { season: 'Spring', products: ['Asparagus', 'Leeks', 'Carrots', 'Spinach', 'Radishes', 'Apples', 'Pears', 'Oranges'] },
    4:  { season: 'Spring', products: ['Asparagus', 'Artichokes', 'Peas', 'Lettuce', 'Cauliflower', 'Radishes', 'Apples', 'Pears'] },
    5:  { season: 'Spring', products: ['Asparagus', 'Artichokes', 'Peas', 'Zucchini', 'Radishes', 'Strawberries', 'Cherries', 'Rhubarb'] },
    6:  { season: 'Summer', products: ['Artichokes', 'Zucchini', 'Cucumbers', 'Green beans', 'Fennel', 'Strawberries', 'Cherries', 'Apricots'] },
    7:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Eggplant', 'Peppers', 'Fennel', 'Raspberries', 'Peaches', 'Figs'] },
    8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Zucchini', 'Fennel', 'Peaches', 'Figs', 'Grapes'] },
    9:  { season: 'Autumn', products: ['Leeks', 'Fennel', 'Squash', 'Artichokes', 'Spinach', 'Apples', 'Pears', 'Grapes'] },
    10: { season: 'Autumn', products: ['Carrots', 'Leeks', 'Celeriac', 'Cabbage', 'Pumpkins', 'Chestnuts', 'Apples', 'Pears'] },
    11: { season: 'Autumn', products: ['Carrots', 'Leeks', 'Celeriac', 'Cabbage', 'Broccoli', 'Endives', 'Clementines', 'Apples'] },
    12: { season: 'Winter', products: ['Carrots', 'Leeks', 'Endives', 'Cabbage', 'Spinach', 'Clementines', 'Oranges', 'Pears'] },
  },

  // Source: données PACA/Occitanie — Réseau Civam, GRAB (Groupe de Recherche en Agriculture Biologique)
  // Représentatif de la France méditerranéenne (PACA, Languedoc, Corse, Sud Occitanie)
  france_south: {
    1:  { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Fennel', 'Spinach', 'Leeks', 'Clementines', 'Oranges', 'Lemons'] },
    2:  { season: 'Winter', products: ['Artichokes', 'Fennel', 'Broccoli', 'Peas', 'Cauliflower', 'Spinach', 'Oranges', 'Lemons'] },
    3:  { season: 'Spring', products: ['Artichokes', 'Peas', 'Fava beans', 'Asparagus', 'Radishes', 'Strawberries', 'Fennel', 'Oranges'] },
    4:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Fava beans', 'Lettuce', 'Radishes', 'Strawberries', 'Cherries'] },
    5:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Peas', 'Fava beans', 'Cucumbers', 'Cherries', 'Apricots', 'Strawberries'] },
    6:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Zucchini', 'Eggplant', 'Cucumbers', 'Peaches', 'Apricots', 'Melons'] },
    7:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Zucchini', 'Fennel', 'Watermelon', 'Melons', 'Peaches'] },
    8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Zucchini', 'Figs', 'Grapes', 'Peaches', 'Watermelon'] },
    9:  { season: 'Autumn', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Artichokes', 'Fennel', 'Figs', 'Grapes', 'Pomegranates'] },
    10: { season: 'Autumn', products: ['Artichokes', 'Fennel', 'Mushrooms', 'Chestnuts', 'Quince', 'Grapes', 'Pomegranates', 'Olives'] },
    11: { season: 'Autumn', products: ['Artichokes', 'Broccoli', 'Fennel', 'Spinach', 'Chestnuts', 'Olives', 'Clementines', 'Oranges'] },
    12: { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Fennel', 'Cauliflower', 'Spinach', 'Clementines', 'Oranges', 'Lemons'] },
  },

  // Source: APICAD / Chambre d'Agriculture Martinique et Guadeloupe
  // Représentatif des Antilles (Martinique, Guadeloupe) — approximatif pour Réunion et Guyane
  // Carême (saison sèche) : jan–mai / Hivernage (saison des pluies) : juin–nov / Transition : déc
  dom_tom: {
    1:  { season: 'Dry', products: ['Christophine', 'Yams', 'Sweet potatoes', 'Avocados', 'Pomelo', 'Papayas', 'Bananas', 'Pineapples'] },
    2:  { season: 'Dry', products: ['Christophine', 'Yams', 'Avocados', 'Pomelo', 'Lychees', 'Papayas', 'Bananas', 'Pineapples'] },
    3:  { season: 'Dry', products: ['Mangoes', 'Avocados', 'Passion fruit', 'Papayas', 'Pineapples', 'Bananas', 'Yams', 'Pomelo'] },
    4:  { season: 'Dry', products: ['Mangoes', 'Breadfruit', 'Avocados', 'Passion fruit', 'Pineapples', 'Papayas', 'Bananas', 'Coconuts'] },
    5:  { season: 'Dry', products: ['Mangoes', 'Breadfruit', 'Passion fruit', 'Guava', 'Pineapples', 'Papayas', 'Bananas', 'Coconuts'] },
    6:  { season: 'Wet', products: ['Breadfruit', 'Passion fruit', 'Guava', 'Soursop', 'Pineapples', 'Papayas', 'Bananas', 'Coconuts'] },
    7:  { season: 'Wet', products: ['Breadfruit', 'Guava', 'Soursop', 'Passion fruit', 'Sweet potatoes', 'Cassava', 'Bananas', 'Pineapples'] },
    8:  { season: 'Wet', products: ['Breadfruit', 'Guava', 'Soursop', 'Sweet potatoes', 'Cassava', 'Papayas', 'Bananas', 'Pineapples'] },
    9:  { season: 'Wet', products: ['Soursop', 'Sweet potatoes', 'Cassava', 'Yams', 'Papayas', 'Pineapples', 'Bananas', 'Coconuts'] },
    10: { season: 'Wet', products: ['Yams', 'Sweet potatoes', 'Cassava', 'Papayas', 'Guava', 'Pineapples', 'Bananas', 'Coconuts'] },
    11: { season: 'Wet', products: ['Christophine', 'Yams', 'Sweet potatoes', 'Lychees', 'Papayas', 'Pineapples', 'Bananas', 'Cassava'] },
    12: { season: 'Dry', products: ['Christophine', 'Yams', 'Sweet potatoes', 'Avocados', 'Lychees', 'Papayas', 'Pineapples', 'Bananas'] },
  },
};

export const FRUITS = new Set([
  // Temperate
  'Apples', 'Pears', 'Clementines', 'Oranges', 'Lemons', 'Pomelo', 'Strawberries', 'Cherries',
  'Raspberries', 'Peaches', 'Figs', 'Grapes', 'Blueberries', 'Plums', 'Melons', 'Watermelon',
  'Pomegranates', 'Cranberries', 'Blackberries', 'Apricots', 'Citrus fruits', 'Rhubarb', 'Quince',
  // Tropical
  'Mangoes', 'Avocados', 'Pineapples', 'Bananas', 'Papayas', 'Lychees', 'Coconuts',
  'Passion fruit', 'Guava', 'Soursop',
]);

// Maps product name → SVG filename in /illustrations/seasonal/ (Fluent Emoji Flat, MIT)
// Fallback to closest available illustration when no exact match exists
export const productIllustrationMap: Record<string, string> = {
  // Direct matches
  'Apples': 'red-apple',
  'Avocados': 'avocado',
  'Bananas': 'banana',
  'Blueberries': 'blueberries',
  'Broccoli': 'broccoli',
  'Carrots': 'carrot',
  'Cherries': 'cherries',
  'Chestnuts': 'chestnut',
  'Clementines': 'tangerine',
  'Coconuts': 'coconut',
  'Cucumbers': 'cucumber',
  'Corn': 'ear-of-corn',
  'Eggplant': 'eggplant',
  'Grapes': 'grapes',
  'Green beans': 'beans',
  'Lemon': 'lemon',
  'Lemons': 'lemon',
  'Lettuce': 'leafy-green',
  'Mangoes': 'mango',
  'Melons': 'melon',
  'Mushrooms': 'brown-mushroom',
  'Olives': 'olive',
  'Oranges': 'tangerine',
  'Peaches': 'peach',
  'Pears': 'pear',
  'Peas': 'pea-pod',
  'Peppers': 'bell-pepper',
  'Pineapples': 'pineapple',
  'Potatoes': 'potato',
  'Pumpkins': 'jack-o-lantern',
  'Strawberries': 'strawberry',
  'Sweet potatoes': 'roasted-sweet-potato',
  'Tomatoes': 'tomato',
  'Watermelon': 'watermelon',
  'Pomelo': 'tangerine',
  // Closest match fallbacks
  'Apricots': 'peach',
  'Artichokes': 'leafy-green',
  'Asparagus': 'herb',
  'Beans': 'beans',
  'Beets': 'carrot',
  'Beetroot': 'carrot',
  'Blackberries': 'blueberries',
  'Breadfruit': 'potato',
  'Broad beans': 'pea-pod',
  'Brussels sprouts': 'broccoli',
  'Cabbage': 'leafy-green',
  'Cassava': 'potato',
  'Cauliflower': 'broccoli',
  'Celeriac': 'potato',
  'Christophine': 'leafy-green',
  'Citrus fruits': 'tangerine',
  'Cranberries': 'cherries',
  'Endives': 'leafy-green',
  'Fava beans': 'pea-pod',
  'Fennel': 'herb',
  'Figs': 'pear',
  'Guava': 'green-apple',
  'Kale': 'leafy-green',
  'Leeks': 'leafy-green',
  'Lychees': 'grapes',
  'New potatoes': 'potato',
  'Papayas': 'peach',
  'Parsnips': 'carrot',
  'Passion fruit': 'herb',
  'Plums': 'grapes',
  'Pomegranates': 'grapes',
  'Quince': 'pear',
  'Radishes': 'hot-pepper',
  'Raspberries': 'strawberry',
  'Rhubarb': 'herb',
  'Runner beans': 'beans',
  'Soursop': 'green-apple',
  'Spinach': 'leafy-green',
  'Squash': 'jack-o-lantern',
  'Yams': 'roasted-sweet-potato',
  'Zucchini': 'cucumber',
};

// Keep emoji map for the fun-fact modal header (larger display)
export const productEmojiMap: Record<string, string> = {
  'Citrus fruits': '🍊', 'Cabbage': '🥬', 'Carrots': '🥕', 'Potatoes': '🥔',
  'Apples': '🍎', 'Pears': '🍐', 'Leeks': '🧅', 'Asparagus': '🌱',
  'Spinach': '🥬', 'Lettuce': '🥬', 'Radishes': '🌶️', 'Strawberries': '🍓',
  'Peas': '🫛', 'Artichokes': '🌿', 'Cherries': '🍒', 'Tomatoes': '🍅',
  'Zucchini': '🥒', 'Cucumbers': '🥒', 'Peaches': '🍑', 'Peppers': '🫑',
  'Plums': '🟣', 'Blueberries': '🫐', 'Corn': '🌽', 'Melons': '🍈',
  'Grapes': '🍇', 'Mushrooms': '🍄', 'Pumpkins': '🎃', 'Squash': '🎃',
  'Chestnuts': '🌰', 'Brussels sprouts': '🥦', 'Endives': '🥬', 'Figs': '🍈',
  'Broccoli': '🥦', 'Cauliflower': '🥦', 'Fennel': '🌿', 'Olives': '🫒',
  'Fava beans': '🫘', 'Apricots': '🍑', 'Eggplant': '🍆', 'Watermelon': '🍉',
  'Pomegranates': '🍎', 'Kale': '🥬', 'Parsnips': '🥕', 'Beetroot': '🥕',
  'Beets': '🥕', 'Celeriac': '🥔', 'Broad beans': '🫛', 'Raspberries': '🍓',
  'Runner beans': '🫛', 'Blackberries': '🫐', 'New potatoes': '🥔',
  'Sweet potatoes': '🍠', 'Cranberries': '🍒', 'Clementines': '🍊',
  'Oranges': '🍊', 'Green beans': '🫘', 'Rhubarb': '🌿', 'Quince': '🍐',
  'Lemons': '🍋', 'Mangoes': '🥭', 'Avocados': '🥑', 'Pineapples': '🍍',
  'Bananas': '🍌', 'Papayas': '🍑', 'Lychees': '🔴', 'Coconuts': '🥥',
  'Passion fruit': '🌺', 'Guava': '🍈', 'Soursop': '🍈', 'Breadfruit': '🫓',
  'Christophine': '🥬', 'Yams': '🟤', 'Cassava': '🌿', 'Pomelo': '🍊',
};
