import { MealLog } from '../pages/CalorieTracking';
import { getCurrentUserId, logMeal } from './apiClient';

export interface WorkoutLog {
  id: string;
  name: string;
  date: string;
  duration: number; // in seconds
  caloriesBurned: number;
}

export interface UserStats {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  waterTarget: number; // glasses
  fastingTarget: number; // hours
}

export type DietaryPreference = 'non-vegetarian' | 'vegetarian' | 'vegan';

const STORAGE_KEYS = {
  FOOD_LOGS: 'adapt_food_logs',
  WORKOUT_LOGS: 'adapt_workout_logs',
  USER_STATS: 'adapt_user_stats',
  HYDRATION: 'adapt_hydration',
  DIETARY_PREFERENCE: 'adapt_dietary_preference',
  FASTING_PREFS: 'adapt_fasting_prefs',
  FASTING_HISTORY: 'adapt_fasting_history',
};

// --- Daily Utilities ---
const getTodayKey = () => new Date().toISOString().split('T')[0];

const defaultStats: UserStats = {
  calorieTarget: 2000,
  proteinTarget: 150,
  carbsTarget: 250,
  fatsTarget: 65,
  waterTarget: 8,
  fastingTarget: 16
};

// --- Data Service Methods ---

export const dataService = {
  // Food Logs
  getFoodLogs: (date: string = getTodayKey()): MealLog[] => {
    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_LOGS) || '{}');
    return allLogs[date] || [
      { type: 'breakfast', entries: [] },
      { type: 'lunch', entries: [] },
      { type: 'dinner', entries: [] },
      { type: 'dessert', entries: [] },
      { type: 'supplement', entries: [] },
    ];
  },

  saveFoodLogs: (logs: MealLog[], date: string = getTodayKey()) => {
    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_LOGS) || '{}');
    allLogs[date] = logs;
    localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(allLogs));
    window.dispatchEvent(new Event('storage_update'));
  },

  // Sync a single meal entry to the server-side tracking API
  logMealToServer: async (foodName: string, quantityG: number, mealType: string, extras?: {
    calories?: number; protein?: number; carbs?: number; fat?: number;
  }) => {
    const userId = getCurrentUserId();
    if (!userId) return; // No profile set up, skip server sync

    try {
      await logMeal({
        user_id: userId,
        food_name: foodName,
        quantity_g: quantityG,
        meal_type: mealType,
        ...extras,
      });
    } catch (err) {
      console.warn('Failed to sync meal to server:', err);
    }
  },

  // Workout Logs
  getWorkoutLogs: (date: string = getTodayKey()): WorkoutLog[] => {
    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS) || '{}');
    return allLogs[date] || [];
  },

  addWorkoutLog: (log: Omit<WorkoutLog, 'date'>, date: string = getTodayKey()) => {
    const allLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKOUT_LOGS) || '{}');
    if (!allLogs[date]) allLogs[date] = [];
    allLogs[date].push({ ...log, date });
    localStorage.setItem(STORAGE_KEYS.WORKOUT_LOGS, JSON.stringify(allLogs));
    window.dispatchEvent(new Event('storage_update'));
  },

  // Hydration (persisted daily)
  getHydration: (date: string = getTodayKey()): { consumed: number; goal: number } => {
    const raw = localStorage.getItem(STORAGE_KEYS.HYDRATION);
    if (!raw) return { consumed: 0, goal: 8 };
    const data = JSON.parse(raw);
    // Reset if it's a different day
    if (data.date !== date) return { consumed: 0, goal: data.goal ?? 8 };
    return { consumed: data.consumed ?? 0, goal: data.goal ?? 8 };
  },

  // Fasting profile preferences (experience level, sleep/wake times)
  getFastingPrefs: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FASTING_PREFS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { experience_level: 'beginner', sleep_time: '23:00', wake_time: '07:00' };
  },

  saveFastingPrefs: (prefs: { experience_level: string; sleep_time: string; wake_time: string }) => {
    localStorage.setItem(STORAGE_KEYS.FASTING_PREFS, JSON.stringify(prefs));
  },

  // Fasting adherence history (last 14 days)
  getFastingHistory: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FASTING_HISTORY);
      if (raw) return JSON.parse(raw) as Array<{ date: string; completed: boolean; target_hours: number; actual_hours: number }>;
    } catch {}
    return [];
  },

  recordFastingSession: (session: { date: string; completed: boolean; target_hours: number; actual_hours: number }) => {
    const history = dataService.getFastingHistory();
    // Replace today's entry if it exists, otherwise append
    const idx = history.findIndex(s => s.date === session.date);
    if (idx >= 0) history[idx] = session;
    else history.push(session);
    // Keep only last 14 days
    const trimmed = history.slice(-14);
    localStorage.setItem(STORAGE_KEYS.FASTING_HISTORY, JSON.stringify(trimmed));
  },

  getFasting: (): { startTime: number | null; goalHours: number; elapsedHours: number } => {
    try {
      const raw = localStorage.getItem('adapt_fasting');
      if (raw) {
        const { startTime, goalHours } = JSON.parse(raw);
        const elapsedHours = startTime
          ? Math.max(0, (Date.now() - startTime) / 3_600_000)
          : 0;
        return { startTime: startTime ?? null, goalHours: goalHours ?? 16, elapsedHours };
      }
    } catch {}
    return { startTime: null, goalHours: 16, elapsedHours: 0 };
  },

  getDietaryPreference: (): DietaryPreference => {
    return (localStorage.getItem(STORAGE_KEYS.DIETARY_PREFERENCE) as DietaryPreference) || 'non-vegetarian';
  },

  saveDietaryPreference: (pref: DietaryPreference) => {
    localStorage.setItem(STORAGE_KEYS.DIETARY_PREFERENCE, pref);
  },

  saveHydration: (consumed: number, goal: number, date: string = getTodayKey()) => {
    localStorage.setItem(STORAGE_KEYS.HYDRATION, JSON.stringify({ consumed, goal, date }));
    window.dispatchEvent(new Event('storage_update'));
  },

  // User Stats / Targets
  getUserStats: (): UserStats => {
    const stats = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    return stats ? JSON.parse(stats) : defaultStats;
  },

  saveUserStats: (stats: UserStats) => {
    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    window.dispatchEvent(new Event('storage_update'));
  },

  // Meal progress (0–1): fraction of day's meals that have been logged.
  // Used to scale fatigue targets so early-day low intake isn't penalised.
  getMealProgress: (date: string = getTodayKey()): number => {
    const logs = dataService.getFoodLogs(date);
    const WEIGHTS: Partial<Record<string, number>> = {
      breakfast: 0.25,
      lunch:     0.50,
      dinner:    0.80,
      dessert:   1.00,
    };
    return logs.reduce((max, log) => {
      const w = WEIGHTS[log.type] ?? 0;
      return log.entries.length > 0 ? Math.max(max, w) : max;
    }, 0);
  },

  // Summary for Dashboard
  getTodaySummary: (date: string = getTodayKey()) => {
    const foodLogs = dataService.getFoodLogs(date);
    const workouts = dataService.getWorkoutLogs(date);
    const stats = dataService.getUserStats();

    const consumed = foodLogs.reduce((acc, meal) => {
      meal.entries.forEach(entry => {
        acc.calories += entry.calories;
        acc.protein += entry.protein;
        acc.carbs += entry.carbs;
        acc.fats += entry.fats;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const burned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);

    return {
      consumed,
      burned,
      workoutCount: workouts.length,
      stats,
      netCalories: consumed.calories - burned
    };
  }
};

