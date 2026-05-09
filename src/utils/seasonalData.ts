export type CountryId =
  | 'france' | 'france_domtom'
  | 'belgium' | 'denmark' | 'germany' | 'italy'
  | 'netherlands' | 'portugal' | 'spain' | 'sweden' | 'uk';

export type RegionId = 'france_north' | 'france_south' | 'guadeloupe' | 'martinique' | 'reunion';

export type SeasonalEntry = { season: string; products: string[] };

interface RegionMeta { id: RegionId; name: string; flag: string }

export type CountryConfig =
  | { hasRegions: true; regions: RegionMeta[]; data: Record<string, Record<number, SeasonalEntry>> }
  | { hasRegions: false; data: Record<number, SeasonalEntry> };

export const COUNTRIES: Array<{ id: CountryId; name: string; flag: string }> = [
  { id: 'france',        name: 'France',       flag: '🇫🇷' },
  { id: 'france_domtom', name: 'France - DOM-TOM', flag: '🏝️' },
  { id: 'belgium',       name: 'Belgique',      flag: '🇧🇪' },
  { id: 'denmark',       name: 'Danemark',      flag: '🇩🇰' },
  { id: 'germany',       name: 'Allemagne',     flag: '🇩🇪' },
  { id: 'italy',         name: 'Italie',        flag: '🇮🇹' },
  { id: 'netherlands',   name: 'Pays-Bas',      flag: '🇳🇱' },
  { id: 'portugal',      name: 'Portugal',      flag: '🇵🇹' },
  { id: 'spain',         name: 'Espagne',       flag: '🇪🇸' },
  { id: 'sweden',        name: 'Suède',         flag: '🇸🇪' },
  { id: 'uk',            name: 'Royaume-Uni',   flag: '🇬🇧' },
];

export const seasonalData: Record<CountryId, CountryConfig> = {

  // ── France ────────────────────────────────────────────────────────────────
  // Source: Interfel / Calendrier Greenpeace France
  france: {
    hasRegions: true,
    regions: [
      { id: 'france_north', name: 'Nord' },
      { id: 'france_south', name: 'Sud' },
    ],
    data: {
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
    },
  },

  // ── France DOM-TOM ────────────────────────────────────────────────────────
  // Source: APICAD / Chambres d'Agriculture Martinique, Guadeloupe, Réunion
  france_domtom: {
    hasRegions: true,
    regions: [
      { id: 'guadeloupe', name: 'Guadeloupe', flag: '🌴' },
      { id: 'martinique', name: 'Martinique', flag: '🌺' },
      { id: 'reunion',    name: 'La Réunion', flag: '🌋' },
    ],
    data: {
      guadeloupe: {
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
      martinique: {
        1:  { season: 'Dry', products: ['Christophine', 'Yams', 'Sweet potatoes', 'Avocados', 'Pomelo', 'Papayas', 'Bananas', 'Pineapples'] },
        2:  { season: 'Dry', products: ['Christophine', 'Yams', 'Avocados', 'Pomelo', 'Lychees', 'Papayas', 'Bananas', 'Pineapples'] },
        3:  { season: 'Dry', products: ['Mangoes', 'Avocados', 'Passion fruit', 'Breadfruit', 'Papayas', 'Pineapples', 'Bananas', 'Pomelo'] },
        4:  { season: 'Dry', products: ['Mangoes', 'Breadfruit', 'Avocados', 'Passion fruit', 'Pineapples', 'Papayas', 'Bananas', 'Coconuts'] },
        5:  { season: 'Dry', products: ['Mangoes', 'Breadfruit', 'Passion fruit', 'Guava', 'Pineapples', 'Papayas', 'Bananas', 'Coconuts'] },
        6:  { season: 'Wet', products: ['Breadfruit', 'Guava', 'Soursop', 'Pineapples', 'Papayas', 'Sweet potatoes', 'Bananas', 'Coconuts'] },
        7:  { season: 'Wet', products: ['Breadfruit', 'Guava', 'Soursop', 'Passion fruit', 'Sweet potatoes', 'Cassava', 'Bananas', 'Pineapples'] },
        8:  { season: 'Wet', products: ['Breadfruit', 'Soursop', 'Sweet potatoes', 'Cassava', 'Papayas', 'Guava', 'Bananas', 'Pineapples'] },
        9:  { season: 'Wet', products: ['Soursop', 'Sweet potatoes', 'Cassava', 'Yams', 'Papayas', 'Pineapples', 'Bananas', 'Coconuts'] },
        10: { season: 'Wet', products: ['Yams', 'Sweet potatoes', 'Christophine', 'Papayas', 'Guava', 'Pineapples', 'Bananas', 'Coconuts'] },
        11: { season: 'Wet', products: ['Christophine', 'Yams', 'Sweet potatoes', 'Lychees', 'Papayas', 'Pineapples', 'Bananas', 'Cassava'] },
        12: { season: 'Dry', products: ['Christophine', 'Yams', 'Sweet potatoes', 'Avocados', 'Lychees', 'Papayas', 'Pineapples', 'Bananas'] },
      },
      reunion: {
        1:  { season: 'Wet', products: ['Lychees', 'Mangoes', 'Papayas', 'Pineapples', 'Bananas', 'Avocados', 'Passion fruit', 'Guava'] },
        2:  { season: 'Wet', products: ['Mangoes', 'Papayas', 'Pineapples', 'Bananas', 'Avocados', 'Passion fruit', 'Guava', 'Sweet potatoes'] },
        3:  { season: 'Wet', products: ['Mangoes', 'Papayas', 'Pineapples', 'Bananas', 'Passion fruit', 'Avocados', 'Guava', 'Sweet potatoes'] },
        4:  { season: 'Wet', products: ['Papayas', 'Pineapples', 'Bananas', 'Avocados', 'Passion fruit', 'Guava', 'Sweet potatoes', 'Yams'] },
        5:  { season: 'Dry', products: ['Papayas', 'Pineapples', 'Bananas', 'Sweet potatoes', 'Yams', 'Guava', 'Passion fruit', 'Cassava'] },
        6:  { season: 'Dry', products: ['Papayas', 'Pineapples', 'Bananas', 'Sweet potatoes', 'Yams', 'Cassava', 'Guava', 'Mangoes'] },
        7:  { season: 'Dry', products: ['Papayas', 'Pineapples', 'Bananas', 'Sweet potatoes', 'Yams', 'Cassava', 'Mangoes', 'Guava'] },
        8:  { season: 'Dry', products: ['Papayas', 'Pineapples', 'Bananas', 'Sweet potatoes', 'Cassava', 'Guava', 'Mangoes', 'Passion fruit'] },
        9:  { season: 'Dry', products: ['Papayas', 'Pineapples', 'Bananas', 'Passion fruit', 'Sweet potatoes', 'Mangoes', 'Guava', 'Avocados'] },
        10: { season: 'Dry', products: ['Papayas', 'Pineapples', 'Bananas', 'Mangoes', 'Lychees', 'Passion fruit', 'Sweet potatoes', 'Avocados'] },
        11: { season: 'Wet', products: ['Lychees', 'Mangoes', 'Papayas', 'Pineapples', 'Bananas', 'Passion fruit', 'Guava', 'Avocados'] },
        12: { season: 'Wet', products: ['Lychees', 'Mangoes', 'Papayas', 'Pineapples', 'Bananas', 'Avocados', 'Passion fruit', 'Guava'] },
      },
    },
  },

  // ── Belgium ───────────────────────────────────────────────────────────────
  // Source: VLAM / Bruxelles Environnement
  belgium: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Endives', 'Leeks', 'Brussels sprouts', 'Cabbage', 'Carrots', 'Beets', 'Apples', 'Pears'] },
      2:  { season: 'Winter', products: ['Endives', 'Leeks', 'Brussels sprouts', 'Cabbage', 'Carrots', 'Kale', 'Apples', 'Pears'] },
      3:  { season: 'Spring', products: ['Leeks', 'Spinach', 'Kale', 'Rhubarb', 'Cabbage', 'Carrots', 'Apples', 'Pears'] },
      4:  { season: 'Spring', products: ['Asparagus', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas', 'Apples', 'Pears'] },
      5:  { season: 'Spring', products: ['Asparagus', 'Strawberries', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas'] },
      6:  { season: 'Summer', products: ['Strawberries', 'Cherries', 'Peas', 'Broad beans', 'Lettuce', 'Cucumbers', 'Radishes'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Green beans', 'Raspberries', 'Blueberries', 'Cherries', 'Cucumbers'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Peppers', 'Plums', 'Blueberries', 'Pears', 'Green beans', 'Apples'] },
      9:  { season: 'Autumn', products: ['Apples', 'Pears', 'Mushrooms', 'Grapes', 'Plums', 'Squash', 'Leeks'] },
      10: { season: 'Autumn', products: ['Apples', 'Pears', 'Pumpkins', 'Endives', 'Beets', 'Cabbage', 'Leeks', 'Chestnuts'] },
      11: { season: 'Autumn', products: ['Endives', 'Leeks', 'Kale', 'Cabbage', 'Brussels sprouts', 'Beets', 'Apples', 'Pears'] },
      12: { season: 'Winter', products: ['Endives', 'Leeks', 'Cabbage', 'Brussels sprouts', 'Carrots', 'Kale', 'Apples', 'Pears'] },
    },
  },

  // ── Denmark ───────────────────────────────────────────────────────────────
  // Source: Sæson (sæson.dk)
  denmark: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Leeks', 'Parsnips', 'Apples', 'Pears'] },
      2:  { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Leeks', 'Parsnips', 'Apples', 'Pears'] },
      3:  { season: 'Spring', products: ['Leeks', 'Carrots', 'Kale', 'Rhubarb', 'Cabbage', 'Parsnips', 'Apples'] },
      4:  { season: 'Spring', products: ['Asparagus', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Kale'] },
      5:  { season: 'Spring', products: ['Asparagus', 'Strawberries', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas'] },
      6:  { season: 'Summer', products: ['Strawberries', 'Peas', 'Lettuce', 'New potatoes', 'Cucumbers', 'Broad beans', 'Radishes'] },
      7:  { season: 'Summer', products: ['Raspberries', 'Blueberries', 'Cherries', 'Tomatoes', 'Cucumbers', 'New potatoes', 'Peas'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Plums', 'Blueberries', 'Raspberries', 'Pears', 'Mushrooms'] },
      9:  { season: 'Autumn', products: ['Apples', 'Pears', 'Mushrooms', 'Squash', 'Plums', 'Pumpkins', 'Beets'] },
      10: { season: 'Autumn', products: ['Apples', 'Pears', 'Pumpkins', 'Cabbage', 'Beets', 'Mushrooms', 'Kale', 'Leeks'] },
      11: { season: 'Autumn', products: ['Kale', 'Leeks', 'Cabbage', 'Carrots', 'Beets', 'Parsnips', 'Apples', 'Pears'] },
      12: { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Leeks', 'Parsnips', 'Apples', 'Pears'] },
    },
  },

  // ── Germany ───────────────────────────────────────────────────────────────
  // Source: regional-saisonal.de
  germany: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Kale', 'Cabbage', 'Leeks', 'Carrots', 'Beets', 'Celeriac', 'Apples', 'Pears'] },
      2:  { season: 'Winter', products: ['Kale', 'Cabbage', 'Leeks', 'Carrots', 'Beets', 'Celeriac', 'Apples', 'Pears'] },
      3:  { season: 'Spring', products: ['Leeks', 'Carrots', 'Kale', 'Rhubarb', 'Spinach', 'Cabbage', 'Apples'] },
      4:  { season: 'Spring', products: ['Asparagus', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Cabbage', 'Apples'] },
      5:  { season: 'Spring', products: ['Asparagus', 'Strawberries', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas'] },
      6:  { season: 'Summer', products: ['Strawberries', 'Cherries', 'Peas', 'Broad beans', 'Cucumbers', 'Lettuce', 'Radishes'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Green beans', 'Raspberries', 'Cherries', 'Cucumbers', 'Peas'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Corn', 'Plums', 'Peaches', 'Green beans', 'Blueberries'] },
      9:  { season: 'Autumn', products: ['Pumpkins', 'Mushrooms', 'Apples', 'Pears', 'Grapes', 'Plums', 'Squash'] },
      10: { season: 'Autumn', products: ['Pumpkins', 'Cabbage', 'Beets', 'Apples', 'Pears', 'Chestnuts', 'Mushrooms', 'Kale'] },
      11: { season: 'Autumn', products: ['Kale', 'Leeks', 'Cabbage', 'Beets', 'Celeriac', 'Apples', 'Pears'] },
      12: { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Celeriac', 'Leeks', 'Apples', 'Pears'] },
    },
  },

  // ── Italy ─────────────────────────────────────────────────────────────────
  // Source: Slow Food Italia
  italy: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Fennel', 'Spinach', 'Cabbage', 'Oranges', 'Clementines', 'Lemons'] },
      2:  { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Fennel', 'Spinach', 'Cauliflower', 'Oranges', 'Lemons', 'Clementines'] },
      3:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Spinach', 'Lettuce', 'Strawberries', 'Oranges', 'Lemons'] },
      4:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Lettuce', 'Radishes', 'Strawberries', 'Cherries', 'Apricots'] },
      5:  { season: 'Spring', products: ['Tomatoes', 'Zucchini', 'Peas', 'Asparagus', 'Cucumbers', 'Strawberries', 'Cherries', 'Apricots'] },
      6:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Zucchini', 'Eggplant', 'Cucumbers', 'Peaches', 'Apricots', 'Cherries'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Zucchini', 'Corn', 'Watermelon', 'Melons', 'Peaches'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Corn', 'Grapes', 'Figs', 'Peaches', 'Watermelon'] },
      9:  { season: 'Autumn', products: ['Tomatoes', 'Eggplant', 'Mushrooms', 'Artichokes', 'Fennel', 'Grapes', 'Figs', 'Pears'] },
      10: { season: 'Autumn', products: ['Artichokes', 'Fennel', 'Mushrooms', 'Chestnuts', 'Squash', 'Grapes', 'Apples', 'Pears'] },
      11: { season: 'Autumn', products: ['Artichokes', 'Broccoli', 'Fennel', 'Cabbage', 'Chestnuts', 'Olives', 'Clementines', 'Pears'] },
      12: { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Fennel', 'Cabbage', 'Spinach', 'Clementines', 'Oranges', 'Lemons'] },
    },
  },

  // ── Netherlands ───────────────────────────────────────────────────────────
  // Source: Voedingscentrum
  netherlands: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Endives', 'Leeks', 'Brussels sprouts', 'Cabbage', 'Kale', 'Carrots', 'Apples', 'Pears'] },
      2:  { season: 'Winter', products: ['Endives', 'Leeks', 'Brussels sprouts', 'Cabbage', 'Kale', 'Carrots', 'Apples', 'Pears'] },
      3:  { season: 'Spring', products: ['Leeks', 'Kale', 'Cabbage', 'Rhubarb', 'Carrots', 'Spinach', 'Apples'] },
      4:  { season: 'Spring', products: ['Asparagus', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas'] },
      5:  { season: 'Spring', products: ['Asparagus', 'Strawberries', 'Radishes', 'Lettuce', 'Spinach', 'Rhubarb', 'Peas'] },
      6:  { season: 'Summer', products: ['Strawberries', 'Cherries', 'Peas', 'Broad beans', 'Lettuce', 'Cucumbers', 'Radishes'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Green beans', 'Raspberries', 'Blueberries', 'Cucumbers', 'Peas'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Peppers', 'Plums', 'Blueberries', 'Pears', 'Green beans'] },
      9:  { season: 'Autumn', products: ['Apples', 'Pears', 'Mushrooms', 'Squash', 'Grapes', 'Plums', 'Leeks'] },
      10: { season: 'Autumn', products: ['Apples', 'Pears', 'Pumpkins', 'Endives', 'Cabbage', 'Beets', 'Leeks', 'Kale'] },
      11: { season: 'Autumn', products: ['Endives', 'Leeks', 'Kale', 'Cabbage', 'Brussels sprouts', 'Beets', 'Apples', 'Pears'] },
      12: { season: 'Winter', products: ['Endives', 'Leeks', 'Kale', 'Cabbage', 'Brussels sprouts', 'Carrots', 'Apples', 'Pears'] },
    },
  },

  // ── Portugal ──────────────────────────────────────────────────────────────
  // Source: Alimentação Inteligente / DECO PROTESTE
  portugal: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Broccoli', 'Cabbage', 'Kale', 'Leeks', 'Carrots', 'Oranges', 'Clementines', 'Lemons'] },
      2:  { season: 'Winter', products: ['Broccoli', 'Spinach', 'Cabbage', 'Peas', 'Cauliflower', 'Oranges', 'Strawberries', 'Lemons'] },
      3:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Spinach', 'Lettuce', 'Strawberries', 'Oranges'] },
      4:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Lettuce', 'Radishes', 'Strawberries', 'Cherries'] },
      5:  { season: 'Spring', products: ['Tomatoes', 'Peas', 'Zucchini', 'Cucumbers', 'Broad beans', 'Strawberries', 'Cherries', 'Apricots'] },
      6:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Zucchini', 'Eggplant', 'Cucumbers', 'Peaches', 'Apricots', 'Melons'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Corn', 'Watermelon', 'Melons', 'Peaches', 'Figs'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Corn', 'Grapes', 'Figs', 'Peaches', 'Watermelon'] },
      9:  { season: 'Autumn', products: ['Tomatoes', 'Peppers', 'Mushrooms', 'Artichokes', 'Grapes', 'Figs', 'Pomegranates', 'Pears'] },
      10: { season: 'Autumn', products: ['Artichokes', 'Mushrooms', 'Squash', 'Chestnuts', 'Pomegranates', 'Quince', 'Apples', 'Pears'] },
      11: { season: 'Autumn', products: ['Broccoli', 'Kale', 'Leeks', 'Cabbage', 'Chestnuts', 'Olives', 'Clementines', 'Oranges'] },
      12: { season: 'Winter', products: ['Broccoli', 'Cabbage', 'Kale', 'Leeks', 'Carrots', 'Clementines', 'Oranges', 'Pomegranates'] },
    },
  },

  // ── Spain ─────────────────────────────────────────────────────────────────
  // Source: Ministerio de Agricultura, Pesca y Alimentación
  spain: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Leeks', 'Cauliflower', 'Spinach', 'Oranges', 'Clementines', 'Lemons'] },
      2:  { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Spinach', 'Cauliflower', 'Leeks', 'Oranges', 'Strawberries', 'Lemons'] },
      3:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Spinach', 'Lettuce', 'Strawberries', 'Oranges'] },
      4:  { season: 'Spring', products: ['Artichokes', 'Asparagus', 'Peas', 'Lettuce', 'Radishes', 'Strawberries', 'Cherries', 'Apricots'] },
      5:  { season: 'Spring', products: ['Tomatoes', 'Zucchini', 'Peas', 'Cucumbers', 'Broad beans', 'Strawberries', 'Cherries', 'Apricots'] },
      6:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Zucchini', 'Eggplant', 'Cucumbers', 'Peaches', 'Apricots', 'Melons'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Zucchini', 'Corn', 'Watermelon', 'Melons', 'Peaches'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Corn', 'Grapes', 'Figs', 'Peaches', 'Watermelon'] },
      9:  { season: 'Autumn', products: ['Tomatoes', 'Peppers', 'Eggplant', 'Mushrooms', 'Figs', 'Grapes', 'Pomegranates', 'Pears'] },
      10: { season: 'Autumn', products: ['Artichokes', 'Mushrooms', 'Squash', 'Chestnuts', 'Pomegranates', 'Quince', 'Apples', 'Olives'] },
      11: { season: 'Autumn', products: ['Artichokes', 'Broccoli', 'Leeks', 'Cauliflower', 'Chestnuts', 'Olives', 'Clementines', 'Pomegranates'] },
      12: { season: 'Winter', products: ['Artichokes', 'Broccoli', 'Cauliflower', 'Leeks', 'Spinach', 'Clementines', 'Oranges', 'Pomegranates'] },
    },
  },

  // ── Sweden ────────────────────────────────────────────────────────────────
  // Source: Naturskyddsföreningen / Köket
  sweden: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Parsnips', 'Leeks', 'Apples', 'Pears'] },
      2:  { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Parsnips', 'Leeks', 'Apples', 'Pears'] },
      3:  { season: 'Spring', products: ['Cabbage', 'Carrots', 'Leeks', 'Kale', 'Rhubarb', 'Parsnips', 'Apples'] },
      4:  { season: 'Spring', products: ['Asparagus', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Kale'] },
      5:  { season: 'Spring', products: ['Asparagus', 'Strawberries', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas'] },
      6:  { season: 'Summer', products: ['Strawberries', 'Peas', 'Lettuce', 'New potatoes', 'Broad beans', 'Radishes', 'Cucumbers'] },
      7:  { season: 'Summer', products: ['Raspberries', 'Blueberries', 'Cherries', 'Tomatoes', 'Cucumbers', 'New potatoes', 'Mushrooms'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Mushrooms', 'Blueberries', 'Raspberries', 'Plums', 'Apples', 'Pears'] },
      9:  { season: 'Autumn', products: ['Apples', 'Pears', 'Mushrooms', 'Pumpkins', 'Squash', 'Plums', 'Beets'] },
      10: { season: 'Autumn', products: ['Apples', 'Pears', 'Pumpkins', 'Cabbage', 'Beets', 'Mushrooms', 'Kale', 'Leeks'] },
      11: { season: 'Autumn', products: ['Kale', 'Leeks', 'Cabbage', 'Carrots', 'Beets', 'Parsnips', 'Apples', 'Pears'] },
      12: { season: 'Winter', products: ['Kale', 'Cabbage', 'Carrots', 'Beets', 'Parsnips', 'Leeks', 'Apples', 'Pears'] },
    },
  },

  // ── United Kingdom ────────────────────────────────────────────────────────
  // Source: Eat the Seasons / BBC Good Food
  uk: {
    hasRegions: false,
    data: {
      1:  { season: 'Winter', products: ['Kale', 'Leeks', 'Parsnips', 'Cabbage', 'Brussels sprouts', 'Carrots', 'Apples', 'Pears'] },
      2:  { season: 'Winter', products: ['Kale', 'Leeks', 'Parsnips', 'Cabbage', 'Brussels sprouts', 'Carrots', 'Apples', 'Pears'] },
      3:  { season: 'Spring', products: ['Leeks', 'Kale', 'Parsnips', 'Cabbage', 'Rhubarb', 'Spinach', 'Apples'] },
      4:  { season: 'Spring', products: ['Asparagus', 'Radishes', 'Spinach', 'Lettuce', 'Rhubarb', 'Peas', 'Broad beans'] },
      5:  { season: 'Spring', products: ['Asparagus', 'Peas', 'Broad beans', 'Radishes', 'Lettuce', 'Strawberries', 'Rhubarb'] },
      6:  { season: 'Summer', products: ['Strawberries', 'Cherries', 'Peas', 'Broad beans', 'Lettuce', 'Cucumbers', 'Radishes'] },
      7:  { season: 'Summer', products: ['Tomatoes', 'Zucchini', 'Green beans', 'Raspberries', 'Blueberries', 'Strawberries', 'Cucumbers'] },
      8:  { season: 'Summer', products: ['Tomatoes', 'Corn', 'Zucchini', 'Plums', 'Blackberries', 'Blueberries', 'Apples'] },
      9:  { season: 'Autumn', products: ['Apples', 'Pears', 'Mushrooms', 'Squash', 'Blackberries', 'Plums', 'Kale'] },
      10: { season: 'Autumn', products: ['Apples', 'Pears', 'Pumpkins', 'Mushrooms', 'Squash', 'Kale', 'Cabbage', 'Leeks'] },
      11: { season: 'Autumn', products: ['Parsnips', 'Leeks', 'Kale', 'Cabbage', 'Brussels sprouts', 'Beets', 'Apples', 'Pears'] },
      12: { season: 'Winter', products: ['Parsnips', 'Leeks', 'Kale', 'Cabbage', 'Brussels sprouts', 'Carrots', 'Apples', 'Pears'] },
    },
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

// ── Geolocation ──────────────────────────────────────────────────────────────

interface LocationPoint {
  lat: number; lng: number;
  country: CountryId; region?: RegionId;
}

const LOCATION_CENTROIDS: LocationPoint[] = [
  { lat: 48.5,  lng:  2.5,  country: 'france',        region: 'france_north' },
  { lat: 45.5,  lng: -0.5,  country: 'france',        region: 'france_south' },
  { lat: 43.5,  lng:  5.5,  country: 'france',        region: 'france_south' },
  { lat: 16.25, lng: -61.5, country: 'france_domtom', region: 'guadeloupe'   },
  { lat: 14.65, lng: -61.0, country: 'france_domtom', region: 'martinique'   },
  { lat: -21.1, lng:  55.5, country: 'france_domtom', region: 'reunion'      },
  { lat: 50.5,  lng:  4.5,  country: 'belgium'    },
  { lat: 56.3,  lng:  9.5,  country: 'denmark'    },
  { lat: 51.2,  lng: 10.4,  country: 'germany'    },
  { lat: 42.8,  lng: 12.6,  country: 'italy'      },
  { lat: 52.4,  lng:  5.3,  country: 'netherlands' },
  { lat: 39.4,  lng: -8.2,  country: 'portugal'   },
  { lat: 40.4,  lng: -3.7,  country: 'spain'      },
  { lat: 62.0,  lng: 17.0,  country: 'sweden'     },
  { lat: 54.0,  lng: -2.0,  country: 'uk'         },
];

export function getNearestLocation(lat: number, lng: number): { country: CountryId; region?: RegionId } {
  let nearest = LOCATION_CENTROIDS[0];
  let minDist = Infinity;
  for (const point of LOCATION_CENTROIDS) {
    const dlat = lat - point.lat;
    const dlng = (lng - point.lng) * Math.cos((lat * Math.PI) / 180);
    const dist = dlat * dlat + dlng * dlng;
    if (dist < minDist) { minDist = dist; nearest = point; }
  }
  return { country: nearest.country, region: nearest.region };
}

// ── Illustration & emoji maps ─────────────────────────────────────────────

// Maps product name → SVG filename in /illustrations/seasonal/ (Fluent Emoji Flat, MIT)
export const productIllustrationMap: Record<string, string> = {
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
  'Raspberries': 'blueberries',
  'Rhubarb': 'herb',
  'Runner beans': 'beans',
  'Soursop': 'green-apple',
  'Spinach': 'leafy-green',
  'Squash': 'jack-o-lantern',
  'Yams': 'roasted-sweet-potato',
  'Zucchini': 'cucumber',
};

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
