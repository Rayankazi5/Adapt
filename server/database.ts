import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', 'public', 'adapt_tracking.sqlite');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'User',
      age INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      height_cm REAL NOT NULL,
      goal TEXT NOT NULL CHECK(goal IN ('cut', 'bulk', 'maintain')),
      activity_level TEXT NOT NULL CHECK(activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      workout_intensity REAL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL,
      food_id TEXT,
      food_name TEXT NOT NULL,
      quantity_g REAL NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'dessert', 'supplement')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_meals_log_id ON meals(log_id);
  `);
}

// ─── Helper: ensure a daily_log row exists for a user + date ──
export function ensureDailyLog(userId: number, date: string): number {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM daily_logs WHERE user_id = ? AND date = ?').get(userId, date) as { id: number } | undefined;
  if (existing) return existing.id;
  const result = db.prepare('INSERT INTO daily_logs (user_id, date) VALUES (?, ?)').run(userId, date);
  return Number(result.lastInsertRowid);
}

export interface UserRow {
  id: number;
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goal: 'cut' | 'bulk' | 'maintain';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at: string;
  updated_at: string;
}

export interface MealRow {
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
