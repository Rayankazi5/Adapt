import { getDb, type UserRow, type MealRow } from './database.js';

// ─── Activity Multipliers (Mifflin-St Jeor) ────────────────
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// ─── TDEE Calculation ───────────────────────────────────────
export function calculateTDEE(user: UserRow): number {
  // Mifflin-St Jeor Equation (assumes male; a gender field could refine this)
  const bmr = (10 * user.weight_kg) + (6.25 * user.height_cm) - (5 * user.age) + 5;
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[user.activity_level] || 1.55));
}

// ─── Goal-Based Calorie Targets ─────────────────────────────
export function getGoalTargets(user: UserRow) {
  const tdee = calculateTDEE(user);
  let calorieTarget: number;
  let proteinPerKg: number;

  switch (user.goal) {
    case 'cut':
      calorieTarget = tdee - 500;
      proteinPerKg = 2.0;
      break;
    case 'bulk':
      calorieTarget = tdee + 400;
      proteinPerKg = 1.8;
      break;
    case 'maintain':
    default:
      calorieTarget = tdee;
      proteinPerKg = 1.8;
      break;
  }

  const proteinTarget = Math.round(user.weight_kg * proteinPerKg);
  const fatCalories = Math.round(calorieTarget * 0.25);
  const fatTarget = Math.round(fatCalories / 9);
  const carbCalories = calorieTarget - (proteinTarget * 4) - fatCalories;
  const carbsTarget = Math.round(Math.max(0, carbCalories) / 4);

  return {
    tdee,
    calorieTarget,
    proteinTarget,
    carbsTarget,
    fatTarget,
    goal: user.goal,
  };
}

// ─── Portion Scaling ────────────────────────────────────────
// Given a food's per-serving nutrition and a quantity in grams, scale proportionally
export interface FoodNutritionBase {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize: number;
}

export function scaleNutrition(food: FoodNutritionBase, quantityG: number) {
  const scale = quantityG / food.servingSize;
  return {
    calories: Math.round(food.calories * scale),
    protein: Math.round(food.protein * scale * 10) / 10,
    carbs: Math.round(food.carbs * scale * 10) / 10,
    fat: Math.round(food.fats * scale * 10) / 10,
  };
}

// ─── Daily Summary ──────────────────────────────────────────
export interface DailySummary {
  date: string;
  meals: MealRow[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  targets: {
    tdee: number;
    calorieTarget: number;
    proteinTarget: number;
    carbsTarget: number;
    fatTarget: number;
    goal: string;
  };
  remaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  surplus_deficit: number; // positive = surplus, negative = deficit
}

export function getDailySummary(userId: number, date: string): DailySummary | null {
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) return null;

  const targets = getGoalTargets(user);
  const logRow = db.prepare('SELECT id FROM daily_logs WHERE user_id = ? AND date = ?').get(userId, date) as { id: number } | undefined;

  let meals: MealRow[] = [];
  if (logRow) {
    meals = db.prepare('SELECT * FROM meals WHERE log_id = ? ORDER BY created_at').all(logRow.id) as MealRow[];
  }

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Round totals
  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;

  return {
    date,
    meals,
    totals,
    targets,
    remaining: {
      calories: targets.calorieTarget - totals.calories,
      protein: targets.proteinTarget - totals.protein,
      carbs: targets.carbsTarget - totals.carbs,
      fat: targets.fatTarget - totals.fat,
    },
    surplus_deficit: totals.calories - targets.calorieTarget,
  };
}
