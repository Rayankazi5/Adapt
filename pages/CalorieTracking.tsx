import { useState, useEffect, useMemo } from 'react';
import { Navigation } from '../components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Coffee,
  Sun,
  Moon,
  IceCream,
  Pill,
} from 'lucide-react';
import { FoodLogCard } from '../components/calories/FoodLogCard';
import { FastingTracker } from '../components/calories/FastingTracker';
import { HydrationTracker } from '../components/calories/HydrationTracker';
import { MacroTracker } from '../components/calories/MacroTracker';
import { VitaminTracker } from '../components/calories/VitaminTracker';
import { AbsorptionTracker } from '../components/calories/AbsorptionTracker';
import { AddFoodDialog } from '../components/calories/AddFoodDialog';
import { FatigueCard } from '../components/calories/FatigueCard';
import { dataService } from '../lib/dataService';
import { getCurrentUserId, getDailySummary as fetchApiSummary, type UserTargets } from '../lib/apiClient';
import { calculateFatigueScore } from '../server/fatigueEngine';

// Mock data types
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  vitamin_a?: number;
  vitamin_b1?: number;
  vitamin_b2?: number;
  vitamin_b3?: number;
  vitamin_b6?: number;
  vitamin_b9?: number;
  vitamin_b12?: number;
  vitamin_c?: number;
  vitamin_d?: number;
  vitamin_e?: number;
  vitamin_k?: number;
}

export interface MealLog {
  type: 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'supplement';
  entries: FoodEntry[];
}

const safe = (n: number) => (Number.isFinite(n) ? n : 0);

export function CalorieTracking() {
  const [foodLogs, setFoodLogs] = useState<MealLog[]>(() => dataService.getFoodLogs());
  const [hydration, setHydration] = useState(() => dataService.getHydration());
  const [workoutCount, setWorkoutCount] = useState(() => dataService.getTodaySummary().workoutCount);
  const [targets, setTargets] = useState<UserTargets | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealLog['type'] | null>(null);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [hasProfile] = useState(() => !!getCurrentUserId());

  // Fetch personalized targets once on mount
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    fetchApiSummary(userId).then(data => {
      if (data) setTargets(data.targets);
    });
  }, []);

  // Keep hydration + workout count in sync when storage changes
  useEffect(() => {
    const handleUpdate = () => {
      setHydration(dataService.getHydration());
      setWorkoutCount(dataService.getTodaySummary().workoutCount);
    };
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  const MEAL_WEIGHTS: Partial<Record<MealLog['type'], number>> = {
    breakfast: 0.25,
    lunch:     0.50,
    dinner:    0.80,
    dessert:   1.00,
  };

  // Compute totals and meal progress from the live foodLogs state
  const { totals, mealProgress } = useMemo(() => {
    let calories = 0, protein = 0, carbs = 0, progress = 0;
    for (const meal of foodLogs) {
      for (const e of meal.entries) {
        calories += safe(e.calories);
        protein  += safe(e.protein);
        carbs    += safe(e.carbs);
      }
      const w = MEAL_WEIGHTS[meal.type] ?? 0;
      if (meal.entries.length > 0) progress = Math.max(progress, w);
    }
    return { totals: { calories, protein, carbs }, mealProgress: progress };
  }, [foodLogs]);

  // Compute fatigue live — workout factor only applies once a workout is completed
  const localFatigue = useMemo(() => calculateFatigueScore({
    calorieIntake:     totals.calories,
    calorieTarget:     targets?.calorieTarget ?? 2000,
    proteinIntake:     totals.protein,
    proteinTarget:     targets?.proteinTarget ?? 150,
    hydrationConsumed: hydration.consumed,
    hydrationTarget:   hydration.goal,
    workoutsCompleted: workoutCount,   // 0 until a workout session is saved
    mealProgress,                      // scales target to meals logged so far
  }), [totals, targets, hydration, workoutCount, mealProgress]);

  const handleAddFood = (mealType: MealLog['type']) => {
    setSelectedMealType(mealType);
    setIsAddFoodOpen(true);
  };

  const setAndSaveLogs = (updated: MealLog[]) => {
    setFoodLogs(updated);
    dataService.saveFoodLogs(updated);
  };

  const handleFoodAdded = (food: Omit<FoodEntry, 'id'>) => {
    if (!selectedMealType) return;

    const newEntry: FoodEntry = {
      ...food,
      id: Date.now().toString(),
    };

    const updated = foodLogs.map((log) =>
      log.type === selectedMealType
        ? { ...log, entries: [...log.entries, newEntry] }
        : log
    );
    setAndSaveLogs(updated);

    // Sync to server-side tracking API (non-blocking)
    dataService.logMealToServer(food.name, 100, selectedMealType, {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fats,
    });

    setIsAddFoodOpen(false);
    setSelectedMealType(null);
  };

  const handleDeleteFood = (mealType: MealLog['type'], foodId: string) => {
    const updated = foodLogs.map((log) =>
      log.type === mealType
        ? { ...log, entries: log.entries.filter((e) => e.id !== foodId) }
        : log
    );
    setAndSaveLogs(updated);
  };

  const mealIcons = {
    breakfast: Coffee,
    lunch: Sun,
    dinner: Moon,
    dessert: IceCream,
    supplement: Pill,
  };

  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    dessert: 'Dessert',
    supplement: 'Supplements',
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Calorie Tracking</h2>
          <p className="text-muted-foreground">Track your meals, macros, and absorption</p>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="absorption">Absorption Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {/* Fasting and Hydration Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FastingTracker />
              <HydrationTracker />
            </div>

            {/* Macro Tracker */}
            <MacroTracker foodLogs={foodLogs} />

            {/* Micronutrient/Vitamin Tracker */}
            <VitaminTracker foodLogs={foodLogs} />

            {/* Food Logs */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Food Logs</h3>
              {foodLogs.map((mealLog) => {
                const Icon = mealIcons[mealLog.type];
                return (
                  <FoodLogCard
                    key={mealLog.type}
                    mealType={mealLog.type}
                    label={mealLabels[mealLog.type]}
                    icon={Icon}
                    entries={mealLog.entries}
                    onAddFood={() => handleAddFood(mealLog.type)}
                    onDeleteFood={(foodId) => handleDeleteFood(mealLog.type, foodId)}
                  />
                );
              })}
            </div>

            {/* Live Fatigue Card — updates as each meal is logged */}
            {hasProfile && (
              <FatigueCard fatigue={localFatigue} />
            )}
          </TabsContent>

          <TabsContent value="absorption">
            <AbsorptionTracker foodLogs={foodLogs} />
          </TabsContent>
        </Tabs>
      </div>

      <AddFoodDialog
        open={isAddFoodOpen}
        onOpenChange={setIsAddFoodOpen}
        onFoodAdded={handleFoodAdded}
        mealType={selectedMealType}
      />
    </div>
  );
}
