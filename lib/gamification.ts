// XP, level, and daily streak system stored in localStorage
const XP_KEY = 'adapt_xp';
const STREAK_KEY = 'adapt_streak';
const STREAK_DATE_KEY = 'adapt_streak_date';

export const XP_REWARDS = {
  LOG_MEAL: 10,
  COMPLETE_EXERCISE: 25,
  COMPLETE_WORKOUT: 100,
  HIT_CALORIE_TARGET: 50,
  HIT_PROTEIN_TARGET: 50,
} as const;

const XP_PER_LEVEL = 500;

export function getXP(): number {
  return parseInt(localStorage.getItem(XP_KEY) ?? '0', 10);
}

export function addXP(amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
  const current = getXP();
  const oldLevel = getLevelFromXP(current);
  const newXP = current + amount;
  const newLevel = getLevelFromXP(newXP);
  localStorage.setItem(XP_KEY, String(newXP));
  window.dispatchEvent(new CustomEvent('xp_update', { detail: { xp: newXP, gained: amount } }));
  return { newXP, newLevel, leveledUp: newLevel > oldLevel };
}

function getLevelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getLevel(): number {
  return getLevelFromXP(getXP());
}

export function getXPProgress(): { current: number; total: number; percent: number; level: number } {
  const xp = getXP();
  const level = getLevelFromXP(xp);
  const levelXP = xp % XP_PER_LEVEL;
  return { current: levelXP, total: XP_PER_LEVEL, percent: (levelXP / XP_PER_LEVEL) * 100, level };
}

export function getStreak(): number {
  const streak = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
  const streakDate = localStorage.getItem(STREAK_DATE_KEY);
  if (!streakDate || streak === 0) return 0;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const last = new Date(streakDate).toDateString();

  if (last === today || last === yesterday) return streak;
  return 0; // streak broken
}

export function recordActivity(): void {
  const today = new Date();
  const todayStr = today.toDateString();
  const streakDate = localStorage.getItem(STREAK_DATE_KEY);

  if (streakDate) {
    const lastStr = new Date(streakDate).toDateString();
    const yesterdayStr = new Date(Date.now() - 86_400_000).toDateString();

    if (lastStr === todayStr) return; // already recorded today

    const current = parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10);
    if (lastStr === yesterdayStr) {
      localStorage.setItem(STREAK_KEY, String(current + 1)); // extend streak
    } else {
      localStorage.setItem(STREAK_KEY, '1'); // reset streak
    }
  } else {
    localStorage.setItem(STREAK_KEY, '1');
  }

  localStorage.setItem(STREAK_DATE_KEY, today.toISOString());
  window.dispatchEvent(new Event('streak_update'));
}
