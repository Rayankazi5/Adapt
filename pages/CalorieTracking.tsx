import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Clock, 
  Droplets, 
  Plus, 
  Coffee, 
  Sun, 
  Moon, 
  IceCream, 
  Pill,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { FoodLogCard } from '../components/calories/FoodLogCard';
import { FastingTracker } from '../components/calories/FastingTracker';
import { HydrationTracker } from '../components/calories/HydrationTracker';
import { MacroTracker } from '../components/calories/MacroTracker';
import { AbsorptionTracker } from '../components/calories/AbsorptionTracker';
import { AddFoodDialog } from '../components/calories/AddFoodDialog';

// Mock data types
export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
}

export interface MealLog {
  type: 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'supplement';
  entries: FoodEntry[];
}

export function CalorieTracking() {
  const [foodLogs, setFoodLogs] = useState<MealLog[]>([
    {
      type: 'breakfast',
      entries: [
        { id: '1', name: 'Oatmeal with Berries', calories: 350, protein: 12, carbs: 54, fats: 8, time: '08:30' },
        { id: '2', name: 'Greek Yogurt', calories: 120, protein: 15, carbs: 8, fats: 3, time: '08:35' },
      ],
    },
    {
      type: 'lunch',
      entries: [
        { id: '3', name: 'Grilled Chicken Salad', calories: 450, protein: 45, carbs: 25, fats: 18, time: '13:00' },
      ],
    },
    {
      type: 'dinner',
      entries: [
        { id: '4', name: 'Salmon with Vegetables', calories: 520, protein: 42, carbs: 35, fats: 22, time: '19:30' },
      ],
    },
    {
      type: 'dessert',
      entries: [],
    },
    {
      type: 'supplement',
      entries: [
        { id: '5', name: 'Whey Protein Shake', calories: 210, protein: 25, carbs: 8, fats: 4, time: '15:00' },
      ],
    },
  ]);

  const [selectedMealType, setSelectedMealType] = useState<MealLog['type'] | null>(null);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);

  const handleAddFood = (mealType: MealLog['type']) => {
    setSelectedMealType(mealType);
    setIsAddFoodOpen(true);
  };

  const handleFoodAdded = (food: Omit<FoodEntry, 'id'>) => {
    if (!selectedMealType) return;

    const newEntry: FoodEntry = {
      ...food,
      id: Date.now().toString(),
    };

    setFoodLogs((prev) =>
      prev.map((log) =>
        log.type === selectedMealType
          ? { ...log, entries: [...log.entries, newEntry] }
          : log
      )
    );

    setIsAddFoodOpen(false);
    setSelectedMealType(null);
  };

  const handleDeleteFood = (mealType: MealLog['type'], foodId: string) => {
    setFoodLogs((prev) =>
      prev.map((log) =>
        log.type === mealType
          ? { ...log, entries: log.entries.filter((e) => e.id !== foodId) }
          : log
      )
    );
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
    <div className="min-h-screen bg-background">
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
