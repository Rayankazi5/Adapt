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
                  {(entry.vitamin_a || entry.vitamin_b1 || entry.vitamin_b2 || entry.vitamin_b3 || entry.vitamin_b6 || entry.vitamin_b9 || entry.vitamin_b12 || entry.vitamin_c || entry.vitamin_d || entry.vitamin_e || entry.vitamin_k) ? (
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/80">
                      {entry.vitamin_a ? <span>Vit A: {entry.vitamin_a.toFixed(1)}mcg</span> : null}
                      {entry.vitamin_b1 ? <span>Vit B1: {entry.vitamin_b1.toFixed(1)}mg</span> : null}
                      {entry.vitamin_b2 ? <span>Vit B2: {entry.vitamin_b2.toFixed(1)}mg</span> : null}
                      {entry.vitamin_b3 ? <span>Vit B3: {entry.vitamin_b3.toFixed(1)}mg</span> : null}
                      {entry.vitamin_b6 ? <span>Vit B6: {entry.vitamin_b6.toFixed(1)}mg</span> : null}
                      {entry.vitamin_b9 ? <span>Vit B9: {entry.vitamin_b9.toFixed(1)}mcg</span> : null}
                      {entry.vitamin_b12 ? <span>Vit B12: {entry.vitamin_b12.toFixed(1)}mcg</span> : null}
                      {entry.vitamin_c ? <span>Vit C: {entry.vitamin_c.toFixed(1)}mg</span> : null}
                      {entry.vitamin_d ? <span>Vit D: {entry.vitamin_d.toFixed(1)}mcg</span> : null}
                      {entry.vitamin_e ? <span>Vit E: {entry.vitamin_e.toFixed(1)}mg</span> : null}
                      {entry.vitamin_k ? <span>Vit K: {entry.vitamin_k.toFixed(1)}mcg</span> : null}
                    </div>
                  ) : null}
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
