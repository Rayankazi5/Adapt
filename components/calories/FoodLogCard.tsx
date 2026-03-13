import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Trash2, LucideIcon } from 'lucide-react';
import { FoodEntry } from '../../pages/CalorieTracking';

interface FoodLogCardProps {
  mealType: string;
  label: string;
  icon: LucideIcon;
  entries: FoodEntry[];
  onAddFood: () => void;
  onDeleteFood: (foodId: string) => void;
}

export function FoodLogCard({ 
  label, 
  icon: Icon, 
  entries, 
  onAddFood, 
  onDeleteFood 
}: FoodLogCardProps) {
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const totalFats = entries.reduce((sum, entry) => sum + entry.fats, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="size-5" />
            {label}
          </CardTitle>
          <Button onClick={onAddFood} size="sm">
            <Plus className="size-4 mr-2" />
            Add Food
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No items logged yet. Click "Add Food" to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-3 bg-accent rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{entry.name}</h4>
                    <span className="text-xs text-muted-foreground">{entry.time}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{entry.calories} kcal</span>
                    <span>P: {entry.protein}g</span>
                    <span>C: {entry.carbs}g</span>
                    <span>F: {entry.fats}g</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteFood(entry.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            
            {/* Total Summary */}
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <div className="flex gap-4 text-sm">
                  <span className="font-medium">{totalCalories} kcal</span>
                  <span className="text-muted-foreground">P: {totalProtein}g</span>
                  <span className="text-muted-foreground">C: {totalCarbs}g</span>
                  <span className="text-muted-foreground">F: {totalFats}g</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
