import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { PenLine, Scan, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { FoodEntry, MealLog } from '../../pages/CalorieTracking';
import { AIFoodScanner } from './AIFoodScanner';
import { BarcodeScanner } from './BarcodeScanner';
import { getNutritionByLabel, getAllFoodNames } from '../../data/foodNutritionData';

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodAdded: (food: Omit<FoodEntry, 'id'>) => void;
  mealType: MealLog['type'] | null;
}

export function AddFoodDialog({ open, onOpenChange, onFoodAdded, mealType }: AddFoodDialogProps) {
  const [manualEntry, setManualEntry] = useState({
    name: '',
    amount: '',
    unit: 'grams',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  });


  const [isSearching, setIsSearching] = useState(false);

  // Auto-calculate macros when food name, amount, or unit change
  useEffect(() => {
    const nutrition = getNutritionByLabel(manualEntry.name);
    const amountVal = Number(manualEntry.amount);
    if (nutrition && amountVal > 0) {
      let g = amountVal;
      if (manualEntry.unit === 'servings') {
        g = amountVal * nutrition.servingSize;
      }

      const scale = g / nutrition.servingSize;
      setManualEntry(prev => ({
        ...prev,
        calories: String(Math.round(nutrition.calories * scale)),
        protein: String(Math.round(nutrition.protein * scale)),
        carbs: String(Math.round(nutrition.carbs * scale)),
        fats: String(Math.round(nutrition.fats * scale)),
      }));
    } else {
      // Clear auto-calculated calories if we don't have nutrition data
      setManualEntry(prev => ({ ...prev, calories: '' }));
    }
  }, [manualEntry.name, manualEntry.amount, manualEntry.unit]);

  const handleManualSubmit = () => {
    if (!manualEntry.name || !manualEntry.amount) {
      toast.error('Please fill in food name and amount');
      return;
    }

    const amountEntered = Number(manualEntry.amount);
    // Try to look up nutrition from our DB and scale based on unit
    const nutrition = getNutritionByLabel(manualEntry.name);
    let calories: number;
    let protein: number;
    let carbs: number;
    let fats: number;

    if (nutrition) {
      let g = amountEntered;
      if (manualEntry.unit === 'servings') {
        g = amountEntered * nutrition.servingSize;
      }
      const scale = g / nutrition.servingSize;
      calories = Math.round(nutrition.calories * scale);
      protein = Math.round(nutrition.protein * scale);
      carbs = Math.round(nutrition.carbs * scale);
      fats = Math.round(nutrition.fats * scale);

      onFoodAdded({
        name: manualEntry.name,
        calories,
        protein,
        carbs,
        fats,
        time: new Date().toTimeString().slice(0, 5),
        vitamin_a: nutrition.vitamin_a ? (nutrition.vitamin_a * scale) : 0,
        vitamin_b1: nutrition.vitamin_b1 ? (nutrition.vitamin_b1 * scale) : 0,
        vitamin_b2: nutrition.vitamin_b2 ? (nutrition.vitamin_b2 * scale) : 0,
        vitamin_b3: nutrition.vitamin_b3 ? (nutrition.vitamin_b3 * scale) : 0,
        vitamin_b6: nutrition.vitamin_b6 ? (nutrition.vitamin_b6 * scale) : 0,
        vitamin_b9: nutrition.vitamin_b9 ? (nutrition.vitamin_b9 * scale) : 0,
        vitamin_b12: nutrition.vitamin_b12 ? (nutrition.vitamin_b12 * scale) : 0,
        vitamin_c: nutrition.vitamin_c ? (nutrition.vitamin_c * scale) : 0,
        vitamin_d: nutrition.vitamin_d ? (nutrition.vitamin_d * scale) : 0,
        vitamin_e: nutrition.vitamin_e ? (nutrition.vitamin_e * scale) : 0,
        vitamin_k: nutrition.vitamin_k ? (nutrition.vitamin_k * scale) : 0,
      });
    } else {
      // Fallback: use manually entered macros, estimate calories from macros
      protein = Number(manualEntry.protein) || 0;
      carbs = Number(manualEntry.carbs) || 0;
      fats = Number(manualEntry.fats) || 0;
      calories = (protein * 4) + (carbs * 4) + (fats * 9);

      onFoodAdded({
        name: manualEntry.name,
        calories,
        protein,
        carbs,
        fats,
        time: new Date().toTimeString().slice(0, 5),
      });
    }

    // Reset form
    setManualEntry({
      name: '',
      amount: '',
      unit: 'grams',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
    });

    toast.success(`Food added: ${amountEntered} ${manualEntry.unit}${nutrition ? ` (${calories} kcal)` : ''}!`);
  };



  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    dessert: 'Dessert',
    supplement: 'Supplement',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add Food to {mealType ? mealLabels[mealType] : 'Meal'}
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to log your food
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <PenLine className="size-4 mr-2" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="size-4 mr-2" />
              AI Track
            </TabsTrigger>
            <TabsTrigger value="barcode">
              <Scan className="size-4 mr-2" />
              Barcode
            </TabsTrigger>
          </TabsList>

          {/* Manual Entry */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="food-name">Food Name *</Label>
              <div className="relative">
                <Input
                  id="food-name"
                  placeholder="e.g., Dahi Vada or Grilled Chicken"
                  value={manualEntry.name}
                  onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                  onFocus={() => setIsSearching(true)}
                  onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                />
                {isSearching && manualEntry.name.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 max-h-40 overflow-auto rounded-lg border bg-popover shadow-lg">
                    {getAllFoodNames()
                      .filter(n => n.toLowerCase().includes(manualEntry.name.toLowerCase()))
                      .slice(0, 5)
                      .map(name => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur before click
                            setManualEntry({ ...manualEntry, name });
                            setIsSearching(false);
                          }}
                          onClick={() => {
                            setManualEntry({ ...manualEntry, name });
                            setIsSearching(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 200"
                  value={manualEntry.amount}
                  onChange={(e) => setManualEntry({ ...manualEntry, amount: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={manualEntry.unit}
                  onValueChange={(value) => setManualEntry({ ...manualEntry, unit: value })}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">Grams</SelectItem>
                    <SelectItem value="servings">Servings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Calories</span>
                <span className="text-sm font-medium">
                  {manualEntry.calories || (Number(manualEntry.protein) * 4 + Number(manualEntry.carbs) * 4 + Number(manualEntry.fats) * 9 || 0)} kcal
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Protein</span>
                <span className="text-sm font-medium">{manualEntry.protein || '0'}g</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Carbs</span>
                <span className="text-sm font-medium">{manualEntry.carbs || '0'}g</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Fats</span>
                <span className="text-sm font-medium">{manualEntry.fats || '0'}g</span>
              </div>
            </div>

            <Button onClick={handleManualSubmit} className="w-full">
              Add Food
            </Button>
          </TabsContent>

          {/* AI Tracking */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <AIFoodScanner
              onFoodRecognized={(food) => {
                onFoodAdded(food);
                toast.success('AI analysis complete! Food added.');
              }}
            />
          </TabsContent>

          {/* Barcode Scanner */}
          <TabsContent value="barcode" className="space-y-4 mt-4">
            <BarcodeScanner 
              onFoodRecognized={(food) => {
                onFoodAdded(food);
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
