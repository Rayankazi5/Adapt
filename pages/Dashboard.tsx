import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Apple, Droplets, Flame, Dumbbell, Calendar, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { dataService } from '../lib/dataService';
import { useState, useEffect, useMemo } from 'react';
import {
  getCurrentUserId,
  getDailySummary as fetchApiSummary,
  getRecommendations,
  type DailySummaryResponse,
  type RecommendationsResponse,
  type ClientFatigueData,
} from '../lib/apiClient';
import { FatigueCard } from '../components/calories/FatigueCard';
import { RecommendationsCard } from '../components/calories/RecommendationsCard';
import { getStreak, getXPProgress } from '../lib/gamification';
import { calculateFatigueScore } from '../server/fatigueEngine';

// Returns a clamped 0–100 percentage, never NaN/Infinity
const pct = (value: number, target: number) =>
  target > 0 && Number.isFinite(value) && Number.isFinite(target)
    ? Math.min((value / target) * 100, 100)
    : 0;

// Returns the number if finite, otherwise 0
const safe = (n: number) => (Number.isFinite(n) ? Math.round(n) : 0);

export function Dashboard() {
  const [summary, setSummary] = useState(() => dataService.getTodaySummary());
  const [hydration, setHydration] = useState(() => dataService.getHydration());
  const [fasting, setFasting] = useState(() => dataService.getFasting());
  const [apiSummary, setApiSummary] = useState<DailySummaryResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [streak, setStreak] = useState(getStreak());
  const [xpData, setXpData] = useState(getXPProgress());

  const refreshApiData = () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    const local    = dataService.getTodaySummary();
    const hyd      = dataService.getHydration();

    const clientData: ClientFatigueData = {
      calories:          local.consumed.calories,
      protein:           local.consumed.protein,
      hydrationConsumed: hyd.consumed,
      hydrationTarget:   hyd.goal,
      workoutsCompleted: local.workoutCount,
    };

    fetchApiSummary(userId, undefined, clientData).then(summaryData => {
      if (!summaryData) return;
      setApiSummary(summaryData);

      const remaining = {
        calories: summaryData.targets.calorieTarget - local.consumed.calories,
        protein:  summaryData.targets.proteinTarget - local.consumed.protein,
        carbs:    summaryData.targets.carbsTarget   - local.consumed.carbs,
        fat:      summaryData.targets.fatTarget     - local.consumed.fats,
      };
      const diet = dataService.getDietaryPreference();
      getRecommendations(userId, undefined, remaining, diet).then(rec => { if (rec) setRecommendations(rec); });
    });
  };

  useEffect(() => {
    const handleUpdate = () => {
      setSummary(dataService.getTodaySummary());
      setHydration(dataService.getHydration());
      setFasting(dataService.getFasting());
      refreshApiData(); // re-fetch suggestions whenever meals/workouts change
    };
    const onXP = () => setXpData(getXPProgress());
    const onStreak = () => setStreak(getStreak());

    window.addEventListener('storage_update', handleUpdate);
    window.addEventListener('xp_update', onXP);
    window.addEventListener('streak_update', onStreak);
    return () => {
      window.removeEventListener('storage_update', handleUpdate);
      window.removeEventListener('xp_update', onXP);
      window.removeEventListener('streak_update', onStreak);
    };
  }, []);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      setHasProfile(true);
      refreshApiData();
    }
  }, []);

  // Targets — fall back to localStorage defaults if API unavailable
  const calorieTarget = safe(apiSummary?.targets.calorieTarget ?? summary.stats.calorieTarget) || 2000;
  const proteinTarget = safe(apiSummary?.targets.proteinTarget ?? summary.stats.proteinTarget) || 150;
  const carbsTarget   = safe(apiSummary?.targets.carbsTarget   ?? summary.stats.carbsTarget)   || 250;
  const fatsTarget    = safe(apiSummary?.targets.fatTarget      ?? summary.stats.fatsTarget)    || 65;

  // Consumed — guard against NaN from corrupt stored entries
  const cCal     = safe(summary.consumed.calories);
  const cProtein = safe(summary.consumed.protein);
  const cCarbs   = safe(summary.consumed.carbs);
  const cFats    = safe(summary.consumed.fats);
  const cBurned  = safe(summary.burned);
  const cNet     = safe(summary.netCalories);
  const workoutsDone = safe(summary.workoutCount);

  const remainingCal = Math.max(calorieTarget - cCal, 0);
  const surplusDeficit = apiSummary ? safe(apiSummary.surplus_deficit) : null;

  // Compute fatigue locally so it updates instantly on every data change
  const localFatigue = useMemo(() => {
    const mealProgress = dataService.getMealProgress();
    return calculateFatigueScore({
      calorieIntake:     cCal,
      calorieTarget:     calorieTarget,
      proteinIntake:     cProtein,
      proteinTarget:     proteinTarget,
      hydrationConsumed: hydration.consumed,
      hydrationTarget:   hydration.goal,
      workoutsCompleted: workoutsDone,
      mealProgress,
    });
  }, [cCal, calorieTarget, cProtein, proteinTarget, hydration.consumed, hydration.goal, workoutsDone, summary]);

  return (
    <div className="min-h-screen bg-background page-enter">
      <Navigation />
      <div className="container mx-auto px-4 py-8">

        {/* Header with streak + XP */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold mb-1">Dashboard</h2>
              <p className="text-muted-foreground">Your daily fitness overview</p>
            </div>
            {/* XP progress pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-card shadow-sm min-w-[200px]">
              <Zap className="size-4 text-violet-500 shrink-0 glow-purple" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gradient-xp font-bold">Level {xpData.level}</span>
                  <span className="text-muted-foreground">{xpData.current}/{xpData.total} XP</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full xp-bar-fill rounded-full transition-[width] duration-700"
                    style={{ width: `${xpData.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Streak banner */}
          {streak > 0 && (
            <div className="mt-4 streak-banner rounded-xl px-4 py-2.5 flex items-center gap-2 animate-fade-in">
              <span className="text-xl animate-streak-fire inline-block">🔥</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {streak}-day streak!
              </span>
              <span className="text-sm text-muted-foreground">Keep it going — you&apos;re on fire.</span>
            </div>
          )}
        </div>

        {/* Profile prompt */}
        {!hasProfile && (
          <Card className="mb-6 border-primary/30 bg-primary/5 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Set up your profile for personalized targets</p>
                <p className="text-sm text-muted-foreground">
                  Get TDEE-based calorie targets, fatigue scoring, and smart recommendations
                </p>
              </div>
              <Link to="/profile">
                <Button size="sm">Set Up Profile</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Calories */}
          <Card
            className="stat-gradient-orange card-lift border-orange-200/50 dark:border-orange-800/30 animate-slide-up"
            style={{ animationDelay: '80ms' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories</CardTitle>
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                <Flame className="size-4 text-orange-500 glow-orange" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cCal}
                <span className="text-base font-normal text-muted-foreground"> / {calorieTarget}</span>
              </div>
              <Progress value={pct(cCal, calorieTarget)} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {remainingCal > 0 ? `${remainingCal} kcal remaining` : '🎯 Target reached!'}
              </p>
              {surplusDeficit !== null && (
                <p className={`text-xs mt-1 font-medium ${surplusDeficit > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {surplusDeficit > 0 ? `+${surplusDeficit} surplus` : `${surplusDeficit} deficit`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hydration */}
          <Card
            className="stat-gradient-blue card-lift border-blue-200/50 dark:border-blue-800/30 animate-slide-up"
            style={{ animationDelay: '130ms' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hydration</CardTitle>
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Droplets className="size-4 text-blue-500 glow-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hydration.consumed}
                <span className="text-base font-normal text-muted-foreground"> / {hydration.goal}</span>
              </div>
              <Progress value={pct(hydration.consumed, hydration.goal)} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {hydration.consumed >= hydration.goal
                  ? '💧 Goal reached!'
                  : `${hydration.goal - hydration.consumed} glass${hydration.goal - hydration.consumed !== 1 ? 'es' : ''} to go`}
              </p>
            </CardContent>
          </Card>

          {/* Fasting */}
          <Card
            className="stat-gradient-purple card-lift border-purple-200/50 dark:border-purple-800/30 animate-slide-up"
            style={{ animationDelay: '180ms' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fasting</CardTitle>
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                <Calendar className="size-4 text-purple-500 glow-purple" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fasting.startTime ? fasting.elapsedHours.toFixed(1) : '—'}
                <span className="text-base font-normal text-muted-foreground"> / {fasting.goalHours}h</span>
              </div>
              <Progress
                value={fasting.startTime ? Math.min((fasting.elapsedHours / fasting.goalHours) * 100, 100) : 0}
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {!fasting.startTime
                  ? 'No fast active'
                  : fasting.elapsedHours >= fasting.goalHours
                    ? '🎉 Goal reached!'
                    : `${Math.max(0, fasting.goalHours - fasting.elapsedHours).toFixed(1)}h remaining`}
              </p>
            </CardContent>
          </Card>

          {/* Workouts */}
          <Card
            className="stat-gradient-green card-lift border-green-200/50 dark:border-green-800/30 animate-slide-up"
            style={{ animationDelay: '230ms' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/40">
                <Dumbbell className="size-4 text-green-500 glow-green" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workoutsDone}
                <span className="text-base font-normal text-muted-foreground"> / 1</span>
              </div>
              <Progress value={pct(workoutsDone, 1)} className="mt-2 h-2" />
              <div className="flex justify-between items-end mt-2">
                <p className="text-xs text-muted-foreground">{cBurned} kcal burned</p>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net</p>
                  <p className="text-sm font-bold text-primary">{cNet} kcal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Macro Overview */}
        <Card className="mb-8 card-lift animate-slide-up" style={{ animationDelay: '280ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-yellow-500 glow-gold" />
              Today&apos;s Macros
            </CardTitle>
            <CardDescription>Track your macronutrient progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Protein */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2.5 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">Protein</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {cProtein}g
                    <span className="text-muted-foreground/60"> / {proteinTarget}g</span>
                  </span>
                </div>
                <div className="relative h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct(cProtein, proteinTarget)}%` }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2.5 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Carbs</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {cCarbs}g
                    <span className="text-muted-foreground/60"> / {carbsTarget}g</span>
                  </span>
                </div>
                <div className="relative h-2 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct(cCarbs, carbsTarget)}%` }}
                  />
                </div>
              </div>

              {/* Fats */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2.5 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">Fats</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {cFats}g
                    <span className="text-muted-foreground/60"> / {fatsTarget}g</span>
                  </span>
                </div>
                <div className="relative h-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-yellow-500 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct(cFats, fatsTarget)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fatigue & Recommendations */}
        {hasProfile && (
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-slide-up"
            style={{ animationDelay: '330ms' }}
          >
            <FatigueCard fatigue={localFatigue} />
            <RecommendationsCard
              proteinSuggestions={recommendations?.protein_suggestions ?? []}
              calorieSuggestions={recommendations?.calorie_suggestions ?? []}
              generalRecommendations={recommendations?.general_recommendations ?? []}
              diet={dataService.getDietaryPreference()}
            />
          </div>
        )}

        {/* Quick Actions */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up"
          style={{ animationDelay: '380ms' }}
        >
          <Card className="card-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="size-5" />
                Calorie Tracking
              </CardTitle>
              <CardDescription>Log your meals and track absorption</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/calories">
                <Button className="w-full">Go to Calorie Tracking</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="size-5" />
                Workout Tracking
              </CardTitle>
              <CardDescription>Plan and track your workouts</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/workouts">
                <Button className="w-full">Go to Workout Tracking</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
