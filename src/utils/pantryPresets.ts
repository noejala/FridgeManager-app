export interface PantryPresetItem {
  key: string;   // i18n key suffix (settings.pantry.items.<key>)
  en: string;    // English name sent to Mistral
  group: 'starches' | 'fats' | 'condiments' | 'canned' | 'spices';
}

export const PANTRY_PRESET_ITEMS: PantryPresetItem[] = [
  // Starches
  { key: 'pasta',           en: 'pasta',           group: 'starches' },
  { key: 'rice',            en: 'rice',            group: 'starches' },
  { key: 'bread',           en: 'bread',           group: 'starches' },
  { key: 'couscous',        en: 'couscous',        group: 'starches' },
  { key: 'lentils',         en: 'lentils',         group: 'starches' },
  { key: 'chickpeas',       en: 'chickpeas',       group: 'starches' },
  // Fats
  { key: 'olive_oil',       en: 'olive oil',       group: 'fats' },
  { key: 'butter',          en: 'butter',          group: 'fats' },
  { key: 'vegetable_oil',   en: 'vegetable oil',   group: 'fats' },
  // Condiments & seasonings
  { key: 'salt',            en: 'salt',            group: 'condiments' },
  { key: 'pepper',          en: 'pepper',          group: 'condiments' },
  { key: 'sugar',           en: 'sugar',           group: 'condiments' },
  { key: 'vinegar',         en: 'vinegar',         group: 'condiments' },
  { key: 'soy_sauce',       en: 'soy sauce',       group: 'condiments' },
  { key: 'mustard',         en: 'mustard',         group: 'condiments' },
  { key: 'honey',           en: 'honey',           group: 'condiments' },
  // Canned & preserved
  { key: 'canned_tomatoes', en: 'canned tomatoes', group: 'canned' },
  { key: 'tomato_paste',    en: 'tomato paste',    group: 'canned' },
  { key: 'bouillon_cubes',  en: 'bouillon cubes',  group: 'canned' },
  // Herbs & spices
  { key: 'dried_herbs',     en: 'dried herbs',     group: 'spices' },
  { key: 'paprika',         en: 'paprika',         group: 'spices' },
  { key: 'cumin',           en: 'cumin',           group: 'spices' },
  { key: 'cinnamon',        en: 'cinnamon',        group: 'spices' },
];

/** All preset English names as a Set, for quick lookup */
export const PRESET_EN_SET = new Set(PANTRY_PRESET_ITEMS.map(i => i.en));
