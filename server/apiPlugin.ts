// ─── Vite Middleware Plugin: Tracking API ───────────────────
// Mounts REST endpoints on the Vite dev server for the intelligent tracking system

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import { getDb, ensureDailyLog, type UserRow, type MealRow } from './database.js';
import { getGoalTargets, getDailySummary, scaleNutrition } from './trackingEngine.js';
import { calculateFatigueScore } from './fatigueEngine.js';
import { getProteinSuggestions, getCalorieSuggestions, getGeneralRecommendations } from './suggestionsEngine.js';

// ─── Helper: Read JSON body ────────────────────────────────
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function error(res: ServerResponse, msg: string, status = 400) {
  json(res, { success: false, error: msg }, status);
}

// ─── Nutrition database loader (reads at startup) ──────────
// We import the food data dynamically since it's a .ts module
let foodDbCache: Record<string, any> | null = null;

async function getFoodDb(): Promise<Record<string, any>> {
  if (foodDbCache) return foodDbCache;
  // Dynamic import of the food nutrition data
  try {
    const mod = await import('../data/foodNutritionData.js');
    foodDbCache = mod.FOOD_NUTRITION_DB;
    return foodDbCache!;
  } catch {
    console.warn('⚠️ Could not load food nutrition DB for suggestions');
    return {};
  }
}

function lookupFood(foodDb: Record<string, any>, foodName: string) {
  // Try direct key match, then search by display name
  const directMatch = foodDb[foodName] || foodDb[foodName.toLowerCase()];
  if (directMatch) return directMatch;

  const cleanName = foodName.toLowerCase().replace(/[-_]/g, ' ');
  for (const food of Object.values(foodDb)) {
    if (
      (food as any).name?.toLowerCase() === cleanName ||
      (food as any).displayName?.toLowerCase() === cleanName ||
      (food as any).id === foodName
    ) {
      return food;
    }
  }
  return null;
}

// ─── Plugin ─────────────────────────────────────────────────
export function trackingApiPlugin(): Plugin {
  return {
    name: 'tracking-api',
    configureServer(server) {
      // Initialize DB on server start
      try {
        getDb();
        console.log('✅ Tracking API: SQLite database initialized');
      } catch (err) {
        console.error('❌ Tracking API: Failed to initialize database', err);
      }

      // ─── POST /api/users ────────────────────────────────
      server.middlewares.use('/api/users', async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method === 'POST') {
          try {
            const body = JSON.parse(await readBody(req));
            const { name, age, weight_kg, height_cm, goal, activity_level, id } = body;

            if (!age || !weight_kg || !height_cm || !goal || !activity_level) {
              return error(res, 'Missing required fields: age, weight_kg, height_cm, goal, activity_level');
            }

            const db = getDb();

            if (id) {
              // Update existing user
              db.prepare(`UPDATE users SET name=?, age=?, weight_kg=?, height_cm=?, goal=?, activity_level=?, updated_at=datetime('now') WHERE id=?`)
                .run(name || 'User', age, weight_kg, height_cm, goal, activity_level, id);
              const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
              const targets = getGoalTargets(user);
              return json(res, { success: true, user, targets });
            } else {
              // Create new user
              const result = db.prepare('INSERT INTO users (name, age, weight_kg, height_cm, goal, activity_level) VALUES (?, ?, ?, ?, ?, ?)')
                .run(name || 'User', age, weight_kg, height_cm, goal, activity_level);
              const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
              const targets = getGoalTargets(user);
              return json(res, { success: true, user, targets }, 201);
            }
          } catch (err: any) {
            return error(res, err.message, 500);
          }
        }
        next();
      });

      // ─── GET /api/users/:id ─────────────────────────────
      server.middlewares.use('/api/user', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'GET') return next();
        const url = req.url || '/';
        const match = url.match(/^\/(\d+)/);
        if (!match) return next();

        try {
          const userId = parseInt(match[1]);
          const db = getDb();
          const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
          if (!user) return error(res, 'User not found', 404);

          const targets = getGoalTargets(user);
          return json(res, { success: true, user, targets });
        } catch (err: any) {
          return error(res, err.message, 500);
        }
      });

      // ─── POST /api/log-meal ────────────────────────────
      server.middlewares.use('/api/log-meal', async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));
          const { user_id, food_name, food_id, quantity_g, meal_type, date } = body;

          if (!user_id || !food_name || !quantity_g) {
            return error(res, 'Missing required fields: user_id, food_name, quantity_g');
          }

          const db = getDb();
          const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id) as UserRow | undefined;
          if (!user) return error(res, 'User not found', 404);

          const logDate = date || new Date().toISOString().split('T')[0];
          const logId = ensureDailyLog(user_id, logDate);

          // Look up nutrition from database
          const foodDb = await getFoodDb();
          const foodInfo = lookupFood(foodDb, food_name);

          let calories = 0, protein = 0, carbs = 0, fat = 0;

          if (foodInfo) {
            const scaled = scaleNutrition(foodInfo, quantity_g);
            calories = scaled.calories;
            protein = scaled.protein;
            carbs = scaled.carbs;
            fat = scaled.fat;
          } else if (body.calories !== undefined) {
            // Allow manual nutrition override if food not found in DB
            calories = body.calories || 0;
            protein = body.protein || 0;
            carbs = body.carbs || 0;
            fat = body.fat || 0;
          }

          const mealTypeVal = meal_type || 'lunch';

          const result = db.prepare(
            'INSERT INTO meals (log_id, food_id, food_name, quantity_g, calories, protein, carbs, fat, meal_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(logId, food_id || null, food_name, quantity_g, calories, protein, carbs, fat, mealTypeVal);

          const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid) as MealRow;

          return json(res, {
            success: true,
            meal,
            food_found_in_db: !!foodInfo,
          }, 201);
        } catch (err: any) {
          return error(res, err.message, 500);
        }
      });

      // ─── GET /api/daily-summary/:userId ────────────────
      server.middlewares.use('/api/daily-summary', (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'GET') return next();
        const url = req.url || '/';
        const match = url.match(/^\/(\d+)/);
        if (!match) return next();

        try {
          const userId = parseInt(match[1]);
          const urlObj = new URL(url, 'http://localhost');
          const date = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];

          const summary = getDailySummary(userId, date);
          if (!summary) return error(res, 'User not found', 404);

          // Prefer client-supplied values (from localStorage) — they reflect
          // what the UI actually shows and include hydration + workout count
          const clientCal      = urlObj.searchParams.get('client_cal');
          const clientPro      = urlObj.searchParams.get('client_pro');
          const clientHyd      = urlObj.searchParams.get('client_hyd');
          const clientHydGoal  = urlObj.searchParams.get('client_hyd_goal');
          const clientWorkouts = urlObj.searchParams.get('client_workouts');

          const calorieIntake = clientCal ? parseFloat(clientCal) : summary.totals.calories;
          const proteinIntake = clientPro ? parseFloat(clientPro) : summary.totals.protein;
          const hydrationConsumed = clientHyd     ? parseFloat(clientHyd)     : 0;
          const hydrationTarget   = clientHydGoal ? parseFloat(clientHydGoal) : 8;
          const workoutsCompleted = clientWorkouts ? parseFloat(clientWorkouts) : 0;

          const fatigue = calculateFatigueScore({
            calorieIntake,
            calorieTarget: summary.targets.calorieTarget,
            proteinIntake,
            proteinTarget: summary.targets.proteinTarget,
            hydrationConsumed,
            hydrationTarget,
            workoutsCompleted,
          });

          return json(res, {
            success: true,
            ...summary,
            fatigue,
          });
        } catch (err: any) {
          return error(res, err.message, 500);
        }
      });

      // ─── GET /api/recommendations/:userId ──────────────
      server.middlewares.use('/api/recommendations', async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'GET') return next();
        const url = req.url || '/';
        const match = url.match(/^\/(\d+)/);
        if (!match) return next();

        try {
          const userId = parseInt(match[1]);
          const urlObj = new URL(url, 'http://localhost');
          const date = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];

          const summary = getDailySummary(userId, date);
          if (!summary) return error(res, 'User not found', 404);

          // Prefer client-supplied remaining values (from localStorage) over
          // server-computed ones — they reflect exactly what the UI shows
          const remCal   = urlObj.searchParams.get('rem_cal');
          const remPro   = urlObj.searchParams.get('rem_pro');
          const remCarbs = urlObj.searchParams.get('rem_carbs');
          const remFat   = urlObj.searchParams.get('rem_fat');
          const remaining = (remCal !== null)
            ? {
                calories: parseFloat(remCal),
                protein:  parseFloat(remPro   ?? '0'),
                carbs:    parseFloat(remCarbs  ?? '0'),
                fat:      parseFloat(remFat    ?? '0'),
              }
            : summary.remaining;

          const foodDb = await getFoodDb();
          const diet = urlObj.searchParams.get('diet') || 'non-vegetarian';

          const protein_suggestions = getProteinSuggestions(
            remaining.protein,
            remaining.calories,
            foodDb,
            diet,
          );

          const calorie_suggestions = getCalorieSuggestions(
            remaining.calories,
            { protein: remaining.protein, carbs: remaining.carbs, fat: remaining.fat },
            foodDb,
            diet,
          );

          const general_recommendations = getGeneralRecommendations(remaining, diet);

          return json(res, {
            success: true,
            protein_suggestions,
            calorie_suggestions,
            general_recommendations,
            remaining: summary.remaining,
            targets: summary.targets,
          });
        } catch (err: any) {
          return error(res, err.message, 500);
        }
      });

      // ─── POST /api/workout-intensity ───────────────────
      server.middlewares.use('/api/workout-intensity', async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method !== 'POST') return next();

        try {
          const body = JSON.parse(await readBody(req));
          const { user_id, intensity, date } = body;

          if (!user_id || intensity === undefined) {
            return error(res, 'Missing required fields: user_id, intensity');
          }

          const logDate = date || new Date().toISOString().split('T')[0];
          const logId = ensureDailyLog(user_id, logDate);

          const db = getDb();
          db.prepare('UPDATE daily_logs SET workout_intensity = ? WHERE id = ?')
            .run(Math.min(10, Math.max(0, intensity)), logId);

          return json(res, { success: true, logId, intensity });
        } catch (err: any) {
          return error(res, err.message, 500);
        }
      });
    },
  };
}
