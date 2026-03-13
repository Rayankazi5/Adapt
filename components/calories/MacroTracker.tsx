import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import { MealLog } from '../../pages/CalorieTracking';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface MacroTrackerProps {
  foodLogs: MealLog[];
}

export function MacroTracker({ foodLogs }: MacroTrackerProps) {
  // User settings - in a real app, this would be based on user weight and goals
  const [userWeight, setUserWeight] = useState(75); // kg
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'moderate' | 'active'>('moderate');

  // Calculate recommended macros based on weight
  // Protein: 2g per kg for active individuals
  // Fats: 0.8-1g per kg
  // Carbs: remaining calories (using ~2000 kcal baseline adjusted for activity)
  const proteinTarget = Math.round(userWeight * 2);
  const fatsTarget = Math.round(userWeight * 0.9);
  
  const activityMultipliers = {
    sedentary: 1.2,
    moderate: 1.5,
    active: 1.8,
  };
  
  const baseCalories = userWeight * 24; // BMR approximation
  const totalCalorieTarget = Math.round(baseCalories * activityMultipliers[activityLevel]);
  
  // Calculate carbs from remaining calories
  const proteinCalories = proteinTarget * 4;
  const fatsCalories = fatsTarget * 9;
  const carbsCalories = totalCalorieTarget - proteinCalories - fatsCalories;
  const carbsTarget = Math.round(carbsCalories / 4);

  // Calculate consumed macros
  const consumed = foodLogs.reduce(
    (acc, mealLog) => {
      mealLog.entries.forEach((entry) => {
        acc.calories += entry.calories;
        acc.protein += entry.protein;
        acc.carbs += entry.carbs;
        acc.fats += entry.fats;
      });
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage < 70) return 'bg-yellow-500';
    if (percentage > 110) return 'bg-red-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Macro Tracker</CardTitle>
            <CardDescription>Based on your weight: {userWeight}kg</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="size-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Macro Settings</DialogTitle>
                <DialogDescription>
                  Adjust your weight and activity level to calculate recommended macros
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={userWeight}
                    onChange={(e) => setUserWeight(Number(e.target.value))}
                    min={40}
                    max={200}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity">Activity Level</Label>
                  <select
                    id="activity"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as typeof activityLevel)}
                  >
                    <option value="sedentary">Sedentary (little exercise)</option>
                    <option value="moderate">Moderate (3-5 days/week)</option>
                    <option value="active">Active (6-7 days/week)</option>
                  </select>
                </div>
                <div className="pt-4 space-y-2 border-t">
                  <p className="text-sm font-medium">Recommended Daily Targets:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span>Calories:</span>
                    <span className="font-medium text-foreground">{totalCalorieTarget} kcal</span>
                    <span>Protein:</span>
                    <span className="font-medium text-foreground">{proteinTarget}g</span>
                    <span>Carbs:</span>
                    <span className="font-medium text-foreground">{carbsTarget}g</span>
                    <span>Fats:</span>
                    <span className="font-medium text-foreground">{fatsTarget}g</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vertical Progress Bars */}
        <div className="grid grid-cols-4 gap-4">
          {/* Calories */}
          <div className="flex flex-col items-center space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Calories</p>
              <p className="text-xs text-muted-foreground">
                {consumed.calories} / {totalCalorieTarget}
              </p>
            </div>
            <div className="relative h-64 w-12 bg-secondary rounded-full overflow-hidden flex flex-col-reverse">
              <div
                className={`w-full transition-all duration-300 ${getProgressColor(consumed.calories, totalCalorieTarget)}`}
                style={{
                  height: `${Math.min((consumed.calories / totalCalorieTarget) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {totalCalorieTarget - consumed.calories > 0
                ? `${totalCalorieTarget - consumed.calories} left`
                : `${consumed.calories - totalCalorieTarget} over`}
            </p>
          </div>

          {/* Protein */}
          <div className="flex flex-col items-center space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Protein</p>
              <p className="text-xs text-muted-foreground">
                {consumed.protein}g / {proteinTarget}g
              </p>
            </div>
            <div className="relative h-64 w-12 bg-secondary rounded-full overflow-hidden flex flex-col-reverse">
              <div
                className={`w-full transition-all duration-300 ${getProgressColor(consumed.protein, proteinTarget)}`}
                style={{
                  height: `${Math.min((consumed.protein / proteinTarget) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {((consumed.protein / consumed.calories) * 100 || 0).toFixed(0)}% of cal
            </p>
          </div>

          {/* Carbs */}
          <div className="flex flex-col items-center space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Carbs</p>
              <p className="text-xs text-muted-foreground">
                {consumed.carbs}g / {carbsTarget}g
              </p>
            </div>
            <div className="relative h-64 w-12 bg-secondary rounded-full overflow-hidden flex flex-col-reverse">
              <div
                className={`w-full transition-all duration-300 ${getProgressColor(consumed.carbs, carbsTarget)}`}
                style={{
                  height: `${Math.min((consumed.carbs / carbsTarget) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {((consumed.carbs / consumed.calories) * 100 || 0).toFixed(0)}% of cal
            </p>
          </div>

          {/* Fats */}
          <div className="flex flex-col items-center space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium mb-1">Fats</p>
              <p className="text-xs text-muted-foreground">
                {consumed.fats}g / {fatsTarget}g
              </p>
            </div>
            <div className="relative h-64 w-12 bg-secondary rounded-full overflow-hidden flex flex-col-reverse">
              <div
                className={`w-full transition-all duration-300 ${getProgressColor(consumed.fats, fatsTarget)}`}
                style={{
                  height: `${Math.min((consumed.fats / fatsTarget) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {((consumed.fats / consumed.calories) * 100 || 0).toFixed(0)}% of cal
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}