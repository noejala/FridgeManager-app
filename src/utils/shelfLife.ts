// Days a product lasts after opening
const SHELF_LIFE_AFTER_OPENING: Record<string, number> = {
  // Dairy & drinks
  lait: 4, milk: 4,
  'lait végétal': 5, 'oat milk': 5, 'almond milk': 5, 'soy milk': 5,
  'crème liquide': 3, 'heavy cream': 3, 'whipping cream': 3,
  'lait de coco': 4, 'coconut milk': 4,
  jus: 5, juice: 5,
  // Sauces & condiments
  mayo: 30, mayonnaise: 30,
  ketchup: 30,
  moutarde: 60, mustard: 60,
  soja: 90, soy: 90, worcestershire: 180,
  pesto: 7,
  bolognaise: 4, bolognese: 4,
  tomate: 5, 'tomato sauce': 5, 'sauce tomate': 5,
  vinaigrette: 21,
  sriracha: 180, tabasco: 180, harissa: 30,
  houmous: 7, hummus: 7,
  salsa: 10,
  tahini: 60,
  tapenade: 14,
  confiture: 30, jam: 30,
  miel: 365, honey: 365,
  sirop: 365, syrup: 365,
};

const OPENABLE_DAIRY_KEYWORDS = ['lait', 'milk', 'crème liquide', 'heavy cream', 'whipping cream', 'lait de coco', 'coconut milk', 'jus', 'juice'];

export function isOpenableProduct(name: string, category: string): boolean {
  if (['Sauces', 'Milk', 'Juice', 'Cream'].includes(category)) return true;
  const lower = name.toLowerCase().trim();
  return OPENABLE_DAIRY_KEYWORDS.some(k => lower.includes(k));
}

export function estimateExpirationFromOpenDate(name: string, openedDate: string): string {
  const lowerName = name.toLowerCase().trim();
  let days = 14; // default
  for (const [keyword, d] of Object.entries(SHELF_LIFE_AFTER_OPENING)) {
    if (lowerName.includes(keyword)) {
      days = d;
      break;
    }
  }
  const date = new Date(openedDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

const PRODUCT_SHELF_LIFE: Record<string, number> = {
  // ── Fruits ──
  pomme: 21, apple: 21,
  poire: 10, pear: 10,
  banane: 5, banana: 5,
  fraise: 4, strawberry: 4,
  framboise: 3, raspberry: 3,
  myrtille: 7, blueberry: 7,
  cerise: 5, cherry: 5,
  raisin: 7, grape: 7,
  pêche: 5, peach: 5,
  abricot: 5, apricot: 5,
  prune: 5, plum: 5,
  figue: 4, fig: 4,
  mangue: 5, mango: 5,
  ananas: 5, pineapple: 5,
  kiwi: 14,
  avocat: 4, avocado: 4,
  melon: 7,
  pastèque: 7, watermelon: 7,
  orange: 14,
  citron: 21, lemon: 21,
  'citron vert': 21, lime: 21,
  pamplemousse: 21, grapefruit: 21,
  clémentine: 14, clementine: 14,
  mandarine: 14, tangerine: 14,
  grenade: 21, pomegranate: 21,
  papaye: 5, papaya: 5,

  // ── Légumes ──
  tomate: 7, tomato: 7,
  carotte: 21, carrot: 21,
  courgette: 7, zucchini: 7,
  concombre: 7, cucumber: 7,
  poivron: 7, 'bell pepper': 7,
  salade: 5, laitue: 5, lettuce: 5,
  épinard: 4, spinach: 4,
  brocoli: 5, broccoli: 5,
  'chou-fleur': 7, cauliflower: 7,
  chou: 14, cabbage: 14,
  poireau: 10, leek: 10,
  oignon: 30, onion: 30,
  échalote: 30, shallot: 30,
  ail: 30, garlic: 30,
  champignon: 7, mushroom: 7,
  asperge: 5, asparagus: 5,
  artichaut: 7, artichoke: 7,
  betterave: 14, beetroot: 14,
  navet: 14, turnip: 14,
  céleri: 14, celery: 14,
  radis: 7, radish: 7,
  'haricot vert': 5, 'green bean': 5,
  'petit pois': 5, pea: 5,
  maïs: 5, corn: 5,
  aubergine: 7, eggplant: 7,
  fenouil: 10, fennel: 10,
  panais: 14, parsnip: 14,
  patate: 30, 'pomme de terre': 30, potato: 30,
  poivrade: 7,

  // ── Viandes ──
  poulet: 3, chicken: 3,
  dinde: 3, turkey: 3,
  lapin: 3, rabbit: 3,
  boeuf: 4, beef: 4,
  steak: 4,
  porc: 4, pork: 4,
  agneau: 4, lamb: 4,
  veau: 3, veal: 3,
  saucisse: 3, sausage: 3,
  merguez: 3,
  chipolata: 3,
  jambon: 5, ham: 5,
  lardons: 5, bacon: 5,
  'viande hachée': 2, 'ground beef': 2, 'steak haché': 2,
  côtelette: 4, chop: 4,
  rôti: 4, roast: 4,

  // ── Poissons & fruits de mer ──
  saumon: 2, salmon: 2,
  thon: 2, tuna: 2,
  cabillaud: 2, cod: 2,
  dorade: 2, 'sea bream': 2,
  bar: 2, 'sea bass': 2,
  sardine: 2,
  maquereau: 2, mackerel: 2,
  sole: 2,
  truite: 2, trout: 2,
  crevette: 3, shrimp: 3, prawn: 3,
  moule: 2, mussel: 2,
  coquille: 2, scallop: 2,
  calmar: 2, squid: 2,
  pieuvre: 2, octopus: 2,
  homard: 2, lobster: 2,

  // ── Produits laitiers ──
  lait: 7, milk: 7,
  yaourt: 21, yogurt: 21, yoghurt: 21,
  fromage: 21, cheese: 21,
  beurre: 30, butter: 30,
  'crème fraîche': 10, 'crème': 10, cream: 10,
  'fromage blanc': 14,
  'fromage de chèvre': 14,
  'fromage frais': 7,
  ricotta: 7,
  mascarpone: 7,
  mozzarella: 7,
  feta: 14,
  'crème dessert': 21,
  dessert: 14,

  // ── Œufs ──
  oeuf: 28, egg: 28,

  // ── Boulangerie ──
  baguette: 2,
  pain: 5, bread: 5,
  croissant: 2,
  brioche: 5,
  'pain de mie': 7,
  viennoiserie: 3,
  bagel: 5,

  // ── Boissons ──
  eau: 365, water: 365,
  jus: 10, juice: 10,
  soda: 365,
  bière: 180, beer: 180,
  vin: 730, wine: 730,
  champagne: 730,
  limonade: 365,
  kombucha: 30,

  // ── Épicerie / autres ──
  tofu: 5,
  tempeh: 7,
  'lait d\'avoine': 10, 'lait végétal': 10, 'oat milk': 10,
  'lait d\'amande': 10, 'almond milk': 10,
  quiche: 4,
  pizza: 4,
  soupe: 4, soup: 4,
  bouillon: 4, broth: 4,
};

export function isProductRecognized(name: string): boolean {
  const lower = name.toLowerCase().trim();
  return Object.keys(PRODUCT_SHELF_LIFE).some(k => lower.includes(k));
}

export function estimateExpirationDate(name: string, purchaseDate?: string): string | null {
  const lowerName = name.toLowerCase().trim();

  let days: number | undefined;
  for (const [keyword, d] of Object.entries(PRODUCT_SHELF_LIFE)) {
    if (lowerName.includes(keyword)) {
      days = d;
      break;
    }
  }

  if (days === undefined) return null;

  const date = purchaseDate ? new Date(purchaseDate) : new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
