// ─── Smart Suggestions Engine ───────────────────────────────
// Recommends foods from the database to help users hit their targets

// Minimal food entry for suggestions (mirrors FOOD_NUTRITION_DB shape)
interface FoodItem {
  id: string;
  name: string;
  displayName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
  servingUnit: string;
  category: string;
}

export interface FoodSuggestion {
  food: FoodItem;
  reason: string;
  suggested_quantity_g: number;
  nutrition_at_suggested: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface SuggestionsResult {
  protein_suggestions: FoodSuggestion[];
  calorie_suggestions: FoodSuggestion[];
  general_recommendations: string[];
}

// Skip foods with placeholder or database-artifact names
function hasValidDisplayName(f: FoodItem): boolean {
  const raw = (f.displayName || '').trim();
  const dn  = raw.toLowerCase();

  if (raw === '') return false;
  if (dn === 'nan') return false;
  if (dn.startsWith('ifct ')) return false;

  // Reject names that are still unreasonably long (database artifacts)
  if (raw.length > 80) return false;

  //   Scientific binomial names like "(Amaranthus cruentus)"
  if (/\([A-Z][a-z]+ [a-z]+\)/.test(raw)) return false;

  //   Standalone "nan" token (Python NaN values e.g. "nan cruentus)")
  if (/\bnan\b/i.test(raw)) return false;

  return true;
}

// ─── Dietary filtering ───────────────────────────────────────
// Explicit ID blocklists cover every item in foodNutritionData.ts.
// Category + keyword checks handle anything added later.

// Excluded for vegetarian AND vegan (meat, poultry, seafood, shellfish)
const NON_VEG_IDS = new Set([
  'baby_back_ribs', 'beef_carpaccio', 'beef_tartare',
  'bibimbap',           // usually has beef + raw egg
  'caesar_salad',       // anchovy in dressing
  'ceviche', 'chicken_curry', 'chicken_quesadilla', 'chicken_wings',
  'clam_chowder', 'club_sandwich', 'crab_cakes', 'croque_madame',
  'dumplings', 'escargots', 'filet_mignon', 'fish_and_chips',
  'foie_gras', 'french_onion_soup',  // beef broth base
  'fried_calamari', 'grilled_chicken_breast', 'grilled_salmon',
  'gyoza', 'hamburger', 'hot_and_sour_soup', 'hot_dog',
  'kathi_roll',         // almost always chicken or egg
  'lasagna',            // meat (beef/pork) filling
  'lobster_bisque', 'lobster_roll_sandwich', 'mussels', 'oysters',
  'pad_thai', 'paella', 'peking_duck', 'pho', 'pork_chop',
  'poutine',            // meat gravy
  'prime_rib', 'pulled_pork_sandwich', 'ramen', 'ravioli',
  'sashimi', 'scallops', 'shrimp_and_grits',
  'biriyani',           // "fragrant rice with chicken or mutton"
  'spaghetti_bolognese', 'spaghetti_carbonara',  // pancetta/guanciale
  'spring_rolls',       // typically pork/shrimp filling
  'steak', 'sushi', 'takoyaki', 'tandoori_chicken', 'tacos',
  'tuna_tartare',
]);

// Additionally excluded for vegan (eggs, dairy, honey)
const DAIRY_EGG_IDS = new Set([
  'boiled_egg', 'bread_pudding',   // eggs + milk
  'breakfast_burrito', 'cannoli',  // ricotta/cream
  'caprese_salad', 'cheese_plate', 'cheesecake', 'creme_brulee',
  'dahi_vada',          // yogurt/curd base
  'deviled_eggs', 'eggs_benedict', 'french_toast', 'fried_rice',
  'frozen_yogurt', 'gnocchi',      // parmesan + egg
  'greek_salad',        // feta cheese
  'grilled_cheese_sandwich', 'gulab_jamun',  // milk solids
  'halwa',              // ghee
  'huevos_rancheros', 'ice_cream', 'macaroni_and_cheese',
  'nachos',             // cheese
  'omelette', 'pancakes', 'panna_cotta',
  'pizza',              // cheese
  'risotto',            // parmesan + butter
  'tiramisu', 'waffles',
]);

// Fallback category + keyword checks for foods not in the explicit lists
const NON_VEG_CATEGORIES = new Set(['non-veg', 'seafood']);
const NON_VEG_KEYWORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'fish', 'prawn', 'shrimp',
  'crab', 'lobster', 'meat', 'turkey', 'bacon', 'ham', 'sausage', 'tuna',
  'salmon', 'duck', 'goose', 'venison', 'anchovy',
];
const DAIRY_EGG_KEYWORDS = [
  ' egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt',
  'paneer', 'whey', 'curd', 'lassi', 'ghee', 'custard',
];

function passesFilter(f: FoodItem, diet: string): boolean {
  if (diet === 'non-vegetarian') return true;

  const id   = (f.id || '').toLowerCase();
  const name = (f.displayName || f.name || '').toLowerCase();
  const cat  = (f.category || '').toLowerCase();

  // ID-based check (highest precision)
  if (NON_VEG_IDS.has(id)) return false;

  // Fallback: category and name keywords
  if (NON_VEG_CATEGORIES.has(cat)) return false;
  if (NON_VEG_KEYWORDS.some(k => name.includes(k))) return false;

  if (diet === 'vegan') {
    if (DAIRY_EGG_IDS.has(id)) return false;
    if (DAIRY_EGG_KEYWORDS.some(k => name.includes(k))) return false;
  }

  return true;
}

// Safely round a number, returning 0 for NaN/Infinity
const safeRound = (n: number, decimals = 0): number => {
  if (!Number.isFinite(n)) return 0;
  const m = 10 ** decimals;
  return Math.round(n * m) / m;
};

// ─── Get suggestions to hit protein target ──────────────────
export function getProteinSuggestions(
  remainingProtein: number,
  _remainingCalories: number,
  foodDb: Record<string, FoodItem>,
  diet = 'non-vegetarian',
): FoodSuggestion[] {
  if (remainingProtein <= 0) return [];

  // Find high-protein foods sorted by protein-per-calorie ratio
  const candidates = Object.values(foodDb)
    .filter(f => f.protein > 5 && f.servingSize > 0 && hasValidDisplayName(f) && passesFilter(f, diet))
    .map(f => ({
      food: f,
      proteinPerCal: f.calories > 0 ? f.protein / f.calories : 0,
      proteinPer100g: (f.protein / f.servingSize) * 100,
    }))
    .sort((a, b) => b.proteinPerCal - a.proteinPerCal)
    .slice(0, 10);

  return candidates.map(c => {
    // Calculate how much of this food to eat to close the protein gap
    const proteinPer1g = c.food.protein / c.food.servingSize;
    if (!Number.isFinite(proteinPer1g) || proteinPer1g <= 0) return null;
    const neededG = Math.min(
      Math.round(remainingProtein / proteinPer1g),
      c.food.servingSize * 3 // Max 3 servings
    );
    const suggestedG = Math.max(c.food.servingSize, Math.round(neededG / 10) * 10);
    const scale = suggestedG / c.food.servingSize;
    if (!Number.isFinite(scale)) return null;

    return {
      food: c.food,
      reason: `High protein density (${c.food.protein}g per serving)`,
      suggested_quantity_g: safeRound(suggestedG),
      nutrition_at_suggested: {
        calories: safeRound(c.food.calories * scale),
        protein: safeRound(c.food.protein * scale, 1),
        carbs: safeRound(c.food.carbs * scale, 1),
        fat: safeRound(c.food.fats * scale, 1),
      },
    };
  }).filter((s): s is FoodSuggestion => s !== null).slice(0, 5);
}

// ─── Get suggestions for calorie balance ────────────────────
export function getCalorieSuggestions(
  remainingCalories: number,
  remainingMacros: { protein: number; carbs: number; fat: number },
  foodDb: Record<string, FoodItem>,
  diet = 'non-vegetarian',
): FoodSuggestion[] {
  if (remainingCalories <= 50) return [];

  // Desserts and low-protein sweets are not suitable for "Balance Your Day"
  const EXCLUDE_BALANCE_CATEGORIES = new Set(['dessert']);
  // Minimum protein density: at least 1.5g protein per 100 kcal
  const MIN_PROTEIN_DENSITY = 0.015;

  // Find foods that fit within remaining calorie budget
  const candidates = Object.values(foodDb)
    .filter(f =>
      f.calories > 0 &&
      f.servingSize > 0 &&
      f.calories <= remainingCalories * 1.1 &&
      hasValidDisplayName(f) &&
      passesFilter(f, diet) &&
      !EXCLUDE_BALANCE_CATEGORIES.has((f.category || '').toLowerCase()) &&
      (f.protein / f.calories) >= MIN_PROTEIN_DENSITY
    )
    .map(f => {
      // Score by how well this food aligns with remaining macro needs
      const proteinScore = remainingMacros.protein > 0 ? Math.min(1, f.protein / remainingMacros.protein) : 0;
      const carbScore = remainingMacros.carbs > 0 ? Math.min(1, f.carbs / remainingMacros.carbs) : 0;
      const fatScore = remainingMacros.fat > 0 ? Math.min(1, f.fats / remainingMacros.fat) : 0;
      const balanceScore = (proteinScore + carbScore + fatScore) / 3;
      return { food: f, balanceScore };
    })
    .sort((a, b) => b.balanceScore - a.balanceScore)
    .slice(0, 5);

  return candidates.map(c => {
    const scale = Math.min(1, remainingCalories / c.food.calories);
    const suggestedG = Math.round((c.food.servingSize * scale) / 10) * 10 || c.food.servingSize;
    const actualScale = suggestedG / c.food.servingSize;
    if (!Number.isFinite(actualScale)) return null;

    return {
      food: c.food,
      reason: 'Balanced fit for your remaining daily macros',
      suggested_quantity_g: safeRound(suggestedG),
      nutrition_at_suggested: {
        calories: safeRound(c.food.calories * actualScale),
        protein: safeRound(c.food.protein * actualScale, 1),
        carbs: safeRound(c.food.carbs * actualScale, 1),
        fat: safeRound(c.food.fats * actualScale, 1),
      },
    };
  }).filter((s): s is FoodSuggestion => s !== null);
}

// ─── General Recommendations ────────────────────────────────
export function getGeneralRecommendations(
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  diet = 'non-vegetarian',
): string[] {
  const tips: string[] = [];

  if (remaining.calories > 500) {
    tips.push('You have significant calories remaining — consider adding a complete meal.');
  } else if (remaining.calories > 200) {
    const snack = diet === 'vegan'
      ? 'nuts, a smoothie, or a plant-based protein bar'
      : diet === 'vegetarian'
        ? 'nuts, yogurt, or a protein bar'
        : 'nuts, yogurt, or a protein bar';
    tips.push(`Room for a healthy snack — try ${snack}.`);
  } else if (remaining.calories < -200) {
    tips.push('You\'ve exceeded your calorie target. Consider lighter meals for the rest of the day or a longer workout.');
  }

  if (remaining.protein > 30) {
    const sources = diet === 'vegan'
      ? 'tofu, tempeh, lentils, or chickpeas'
      : diet === 'vegetarian'
        ? 'paneer, eggs, lentils, or Greek yogurt'
        : 'chicken breast, eggs, or lentils';
    tips.push(`You still need ${Math.round(remaining.protein)}g of protein. Try ${sources}.`);
  }

  if (remaining.fat < -10) {
    tips.push('You\'ve exceeded your fat target. Opt for leaner protein sources.');
  }

  if (remaining.carbs > 50 && remaining.calories > 200) {
    tips.push('You have room for carbs — rice, chapati, or fruits would be great options.');
  }

  if (tips.length === 0) {
    tips.push('You\'re on track! Great job hitting your targets today.');
  }

  return tips;
}
