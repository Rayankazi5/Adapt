// ─── Frontend API Client ────────────────────────────────────
// Typed wrappers for all tracking API endpoints

const API_BASE = '';

export interface UserProfile {
  id?: number;
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goal: 'cut' | 'bulk' | 'maintain';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface UserTargets {
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  goal: string;
}

export interface MealEntry {
  id: number;
  log_id: number;
  food_id: string | null;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  created_at: string;
}

export interface FatigueResult {
  fatigue_score: number;
  recovery_recommendation: string;
  breakdown: {
    calorie_factor: number;
    protein_factor: number;
    hydration_factor: number;
    workout_factor: number;
  };
}

export interface DailySummaryResponse {
  success: boolean;
  date: string;
  meals: MealEntry[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets: UserTargets;
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  surplus_deficit: number;
  fatigue: FatigueResult;
}

export interface FoodSuggestion {
  food: {
    id: string;
    displayName: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    servingSize: number;
    category: string;
  };
  reason: string;
  suggested_quantity_g: number;
  nutrition_at_suggested: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface RecommendationsResponse {
  success: boolean;
  protein_suggestions: FoodSuggestion[];
  calorie_suggestions: FoodSuggestion[];
  general_recommendations: string[];
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  targets: UserTargets;
}

// ─── Storage ────────────────────────────────────────────────
const USER_ID_KEY = 'adapt_current_user_id';

export function getCurrentUserId(): number | null {
  const id = localStorage.getItem(USER_ID_KEY);
  return id ? parseInt(id) : null;
}

export function setCurrentUserId(id: number) {
  localStorage.setItem(USER_ID_KEY, String(id));
}

// ─── API Calls ──────────────────────────────────────────────

export async function createOrUpdateUser(profile: UserProfile): Promise<{ user: UserProfile & { id: number }; targets: UserTargets }> {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  setCurrentUserId(data.user.id);
  return data;
}

export async function getUser(userId: number): Promise<{ user: UserProfile & { id: number }; targets: UserTargets } | null> {
  const res = await fetch(`${API_BASE}/api/user/${userId}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.success) return null;
  return data;
}

export async function logMeal(params: {
  user_id: number;
  food_name: string;
  food_id?: string;
  quantity_g: number;
  meal_type?: string;
  date?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}): Promise<{ meal: MealEntry; food_found_in_db: boolean }> {
  const res = await fetch(`${API_BASE}/api/log-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data;
}

export interface ClientFatigueData {
  calories: number;
  protein: number;
  hydrationConsumed: number;
  hydrationTarget: number;
  workoutsCompleted: number;
}

export async function getDailySummary(
  userId: number,
  date?: string,
  clientData?: ClientFatigueData,
): Promise<DailySummaryResponse | null> {
  const dateParam = date || new Date().toISOString().split('T')[0];
  let url = `${API_BASE}/api/daily-summary/${userId}?date=${dateParam}`;
  if (clientData) {
    url += `&client_cal=${clientData.calories}&client_pro=${clientData.protein}` +
           `&client_hyd=${clientData.hydrationConsumed}&client_hyd_goal=${clientData.hydrationTarget}` +
           `&client_workouts=${clientData.workoutsCompleted}`;
  }
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? data : null;
}

export async function getRecommendations(
  userId: number,
  date?: string,
  remaining?: { calories: number; protein: number; carbs: number; fat: number },
  diet?: string,
): Promise<RecommendationsResponse | null> {
  const dateParam = date || new Date().toISOString().split('T')[0];
  let url = `${API_BASE}/api/recommendations/${userId}?date=${dateParam}`;
  if (remaining) {
    url += `&rem_cal=${remaining.calories}&rem_pro=${remaining.protein}&rem_carbs=${remaining.carbs}&rem_fat=${remaining.fat}`;
  }
  if (diet) url += `&diet=${encodeURIComponent(diet)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.success ? data : null;
}

export async function setWorkoutIntensity(userId: number, intensity: number, date?: string): Promise<void> {
  await fetch(`${API_BASE}/api/workout-intensity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      intensity,
      date: date || new Date().toISOString().split('T')[0],
    }),
  });
}
