// Nutrition data for the 20 Indian food categories in the Adaptify dataset
// Values are per standard serving size, based on IFCT 2017 and common references

export interface FoodNutritionInfo {
    id: string;
    name: string;
    displayName: string;
    calories: number;       // kcal per serving
    protein: number;        // grams
    carbs: number;          // grams
    fats: number;           // grams
    fiber: number;          // grams
    servingSize: number;    // grams
    servingUnit: string;
    category: string;
    description: string;
    imageKeywords: string[];
}
import ifctDataRaw from './ifctData.json';

// Type assertion for the imported JSON to match our interface
const ifctData: Record<string, FoodNutritionInfo> = ifctDataRaw as Record<string, FoodNutritionInfo>;

// Map folder names to nutrition info
export const FOOD_NUTRITION_DB: Record<string, FoodNutritionInfo> = {
    ...ifctData,
    'biriyani': {
        id: 'biriyani',
        name: 'biriyani',
        displayName: 'Biryani',
        calories: 290,
        protein: 12,
        carbs: 40,
        fats: 9,
        fiber: 1.5,
        servingSize: 200,
        servingUnit: 'g (1 plate)',
        category: 'Rice Dish',
        description: 'Fragrant rice dish with spices, often with chicken or mutton',
        imageKeywords: ['biryani', 'biriyani', 'rice'],
    },
    'bisibelebath': {
        id: 'bisibelebath',
        name: 'bisibelebath',
        displayName: 'Bisibele Bath',
        calories: 245,
        protein: 8,
        carbs: 38,
        fats: 7,
        fiber: 3,
        servingSize: 200,
        servingUnit: 'g (1 bowl)',
        category: 'Rice Dish',
        description: 'Karnataka-style rice, lentil and vegetable dish',
        imageKeywords: ['bisibelebath', 'bisi bele', 'rice lentil'],
    },
    'butternaan': {
        id: 'butternaan',
        name: 'butternaan',
        displayName: 'Butter Naan',
        calories: 310,
        protein: 8,
        carbs: 45,
        fats: 12,
        fiber: 2,
        servingSize: 100,
        servingUnit: 'g (1 piece)',
        category: 'Bread',
        description: 'Leavened bread baked in tandoor, topped with butter',
        imageKeywords: ['naan', 'butter naan', 'bread'],
    },
    'chaat': {
        id: 'chaat',
        name: 'chaat',
        displayName: 'Chaat',
        calories: 220,
        protein: 5,
        carbs: 32,
        fats: 9,
        fiber: 3,
        servingSize: 150,
        servingUnit: 'g (1 plate)',
        category: 'Snack',
        description: 'Savoury street snack with chutneys and crispy elements',
        imageKeywords: ['chaat', 'street food', 'papdi'],
    },
    'chappati': {
        id: 'chappati',
        name: 'chappati',
        displayName: 'Chapati',
        calories: 120,
        protein: 4,
        carbs: 20,
        fats: 3.5,
        fiber: 2.5,
        servingSize: 40,
        servingUnit: 'g (1 piece)',
        category: 'Bread',
        description: 'Whole wheat unleavened flatbread',
        imageKeywords: ['chapati', 'roti', 'flatbread'],
    },
    'dahi vada': {
        id: 'dahi_vada',
        name: 'dahi vada',
        displayName: 'Dahi Vada',
        calories: 180,
        protein: 7,
        carbs: 22,
        fats: 8,
        fiber: 2,
        servingSize: 150,
        servingUnit: 'g (2 vadas)',
        category: 'Snack',
        description: 'Lentil fritters soaked in spiced yogurt, topped with chutneys',
        imageKeywords: ['dahi vada', 'dahi bhalla', 'yogurt', 'chaat'],
    },
    'dhokla': {
        id: 'dhokla',
        name: 'dhokla',
        displayName: 'Dhokla',
        calories: 160,
        protein: 6,
        carbs: 28,
        fats: 3,
        fiber: 1.5,
        servingSize: 100,
        servingUnit: 'g (3-4 pieces)',
        category: 'Snack',
        description: 'Steamed Gujarati snack made from gram flour',
        imageKeywords: ['dhokla', 'steamed', 'gujarati'],
    },
    'dosa': {
        id: 'dosa',
        name: 'dosa',
        displayName: 'Dosa',
        calories: 168,
        protein: 4,
        carbs: 27,
        fats: 5,
        fiber: 1,
        servingSize: 100,
        servingUnit: 'g (1 dosa)',
        category: 'Crepe',
        description: 'Thin crispy crepe made from rice and lentil batter',
        imageKeywords: ['dosa', 'crepe', 'south indian'],
    },
    'gulab jamun': {
        id: 'gulab_jamun',
        name: 'gulab jamun',
        displayName: 'Gulab Jamun',
        calories: 175,
        protein: 2,
        carbs: 25,
        fats: 8,
        fiber: 0.3,
        servingSize: 50,
        servingUnit: 'g (2 pieces)',
        category: 'Dessert',
        description: 'Deep-fried milk solid balls soaked in sugar syrup',
        imageKeywords: ['gulab jamun', 'sweet', 'dessert'],
    },
    'halwa': {
        id: 'halwa',
        name: 'halwa',
        displayName: 'Halwa',
        calories: 260,
        protein: 3,
        carbs: 35,
        fats: 13,
        fiber: 1,
        servingSize: 100,
        servingUnit: 'g (1 serving)',
        category: 'Dessert',
        description: 'Dense sweet made from flour/semolina/carrot with ghee',
        imageKeywords: ['halwa', 'halva', 'sweet'],
    },
    'idly': {
        id: 'idly',
        name: 'idly',
        displayName: 'Idli',
        calories: 78,
        protein: 2,
        carbs: 15,
        fats: 0.5,
        fiber: 0.8,
        servingSize: 40,
        servingUnit: 'g (1 idli)',
        category: 'Steamed',
        description: 'Steamed rice and lentil cake, light and fluffy',
        imageKeywords: ['idli', 'idly', 'steamed'],
    },
    'kathi roll': {
        id: 'kathi_roll',
        name: 'kathi roll',
        displayName: 'Kathi Roll',
        calories: 330,
        protein: 14,
        carbs: 35,
        fats: 15,
        fiber: 2,
        servingSize: 180,
        servingUnit: 'g (1 roll)',
        category: 'Wrap',
        description: 'Paratha-wrapped street food with filling',
        imageKeywords: ['kathi roll', 'roll', 'wrap'],
    },
    'meduvadai': {
        id: 'meduvadai',
        name: 'meduvadai',
        displayName: 'Medu Vada',
        calories: 171,
        protein: 6,
        carbs: 18,
        fats: 9,
        fiber: 1.5,
        servingSize: 65,
        servingUnit: 'g (1 vada)',
        category: 'Fried',
        description: 'Deep-fried lentil-based donut-shaped fritter',
        imageKeywords: ['medu vada', 'vada', 'fritter'],
    },
    'noodles': {
        id: 'noodles',
        name: 'noodles',
        displayName: 'Noodles',
        calories: 250,
        protein: 6,
        carbs: 38,
        fats: 8,
        fiber: 2,
        servingSize: 200,
        servingUnit: 'g (1 plate)',
        category: 'Noodle',
        description: 'Stir-fried noodles with vegetables, Indian-Chinese style',
        imageKeywords: ['noodles', 'chow mein', 'hakka'],
    },
    'paniyaram': {
        id: 'paniyaram',
        name: 'paniyaram',
        displayName: 'Paniyaram',
        calories: 140,
        protein: 3,
        carbs: 22,
        fats: 4.5,
        fiber: 1,
        servingSize: 80,
        servingUnit: 'g (4 pieces)',
        category: 'Snack',
        description: 'Round dumplings made from idli/dosa batter',
        imageKeywords: ['paniyaram', 'paddu', 'appe'],
    },
    'poori': {
        id: 'poori',
        name: 'poori',
        displayName: 'Poori',
        calories: 190,
        protein: 4,
        carbs: 22,
        fats: 10,
        fiber: 1.5,
        servingSize: 60,
        servingUnit: 'g (2 pooris)',
        category: 'Bread',
        description: 'Deep-fried puffed wheat bread',
        imageKeywords: ['poori', 'puri', 'fried bread'],
    },
    'samosa': {
        id: 'samosa',
        name: 'samosa',
        displayName: 'Samosa',
        calories: 262,
        protein: 5,
        carbs: 28,
        fats: 15,
        fiber: 2,
        servingSize: 100,
        servingUnit: 'g (1 samosa)',
        category: 'Snack',
        description: 'Triangular deep-fried pastry with potato filling',
        imageKeywords: ['samosa', 'pastry', 'fried'],
    },
    'tandoori chicken': {
        id: 'tandoori_chicken',
        name: 'tandoori chicken',
        displayName: 'Tandoori Chicken',
        calories: 220,
        protein: 28,
        carbs: 4,
        fats: 10,
        fiber: 0.5,
        servingSize: 150,
        servingUnit: 'g (1 leg piece)',
        category: 'Non-Veg',
        description: 'Yogurt and spice marinated chicken cooked in tandoor oven',
        imageKeywords: ['tandoori', 'chicken', 'grilled'],
    },
    'upma': {
        id: 'upma',
        name: 'upma',
        displayName: 'Upma',
        calories: 195,
        protein: 5,
        carbs: 30,
        fats: 6,
        fiber: 2,
        servingSize: 200,
        servingUnit: 'g (1 bowl)',
        category: 'Breakfast',
        description: 'Semolina-based South Indian breakfast dish',
        imageKeywords: ['upma', 'rava', 'semolina'],
    },
    'vada pav': {
        id: 'vada_pav',
        name: 'vada pav',
        displayName: 'Vada Pav',
        calories: 290,
        protein: 6,
        carbs: 38,
        fats: 13,
        fiber: 2,
        servingSize: 130,
        servingUnit: 'g (1 piece)',
        category: 'Snack',
        description: 'Mumbai-style potato patty in bread bun',
        imageKeywords: ['vada pav', 'burger', 'mumbai'],
    },
    'ven pongal': {
        id: 'ven_pongal',
        name: 'ven pongal',
        displayName: 'Ven Pongal',
        calories: 215,
        protein: 6,
        carbs: 32,
        fats: 7,
        fiber: 1.5,
        servingSize: 200,
        servingUnit: 'g (1 bowl)',
        category: 'Breakfast',
        description: 'South Indian rice and lentil porridge with pepper and ghee',
        imageKeywords: ['pongal', 'ven pongal', 'khara pongal'],
    },
    'grilled chicken breast': {
        id: 'grilled_chicken_breast',
        name: 'grilled chicken breast',
        displayName: 'Grilled Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fats: 3.6,
        fiber: 0,
        servingSize: 100,
        servingUnit: 'g',
        category: 'Non-Veg',
        description: 'Plain grilled chicken breast without skin',
        imageKeywords: ['chicken', 'breast', 'grilled', 'poultry'],
    },
    'boiled egg': {
        id: 'boiled_egg',
        name: 'boiled egg',
        displayName: 'Boiled Egg',
        calories: 78,
        protein: 6.3,
        carbs: 0.6,
        fats: 5.3,
        fiber: 0,
        servingSize: 50,
        servingUnit: 'g (1 large egg)',
        category: 'Non-Veg',
        description: 'Hard boiled chicken egg',
        imageKeywords: ['egg', 'boiled', 'protein'],
    },
    'white rice': {
        id: 'white_rice',
        name: 'white rice',
        displayName: 'White Rice (Cooked)',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fats: 0.3,
        fiber: 0.4,
        servingSize: 100,
        servingUnit: 'g',
        category: 'Staple',
        description: 'Plain cooked white rice',
        imageKeywords: ['rice', 'white', 'cooked'],
    },
};

// Class labels matching folder names (in order)
export const CLASS_LABELS: string[] = [
    'biriyani',
    'bisibelebath',
    'butternaan',
    'chaat',
    'chappati',
    'dhokla',
    'dosa',
    'gulab jamun',
    'halwa',
    'idly',
    'kathi roll',
    'meduvadai',
    'noodles',
    'paniyaram',
    'poori',
    'samosa',
    'tandoori chicken',
    'upma',
    'vada pav',
    'ven pongal',
    'dahi vada',
];

export function getNutritionByLabel(label: string): FoodNutritionInfo | undefined {
    // Normalize the label: strip "food indian_food " prefix from folder names
    const cleanLabel = label
        .replace(/^food indian_food\s+/, '')
        .replace(/_indian_food$/, '')
        .toLowerCase()
        .trim();

    // First try direct key lookup
    if (FOOD_NUTRITION_DB[cleanLabel]) {
        return FOOD_NUTRITION_DB[cleanLabel];
    }

    // Replace spaces with underscores for ID check
    const idFriendlyLabel = cleanLabel.replace(/\s+/g, '_');
    if (FOOD_NUTRITION_DB[idFriendlyLabel]) {
        return FOOD_NUTRITION_DB[idFriendlyLabel];
    }

    // Then try matching exactly by displayName or name
    const allFoods = Object.values(FOOD_NUTRITION_DB);
    const exactMatch = allFoods.find(
        f => f.displayName.toLowerCase() === cleanLabel || f.name.toLowerCase() === cleanLabel
    );
    if (exactMatch) return exactMatch;

    // Third try: Prioritize name containing the string rather than description matches
    if (cleanLabel.length > 2) {
        // Try strict subset in name first
        const nameMatch = allFoods.find(
            f => f.displayName.toLowerCase().includes(cleanLabel) || f.name.toLowerCase().includes(cleanLabel)
        );
        if (nameMatch) return nameMatch;

        // Final fallback: fuzzy match on description/keywords but this is risky
        const fuzzyMatch = allFoods.find(
            f => f.description?.toLowerCase().includes(cleanLabel) ||
                (f.imageKeywords && f.imageKeywords.some(k => k.includes(cleanLabel)))
        );
        if (fuzzyMatch) return fuzzyMatch;
    }

    return undefined;
}

export function getAllFoodNames(): string[] {
    return Object.values(FOOD_NUTRITION_DB).map(f => f.displayName);
}

export function searchFoods(query: string): FoodNutritionInfo[] {
    const q = query.toLowerCase();
    return Object.values(FOOD_NUTRITION_DB).filter(
        f =>
            f.displayName.toLowerCase().includes(q) ||
            f.name.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.imageKeywords.some(k => k.includes(q))
    );
}
