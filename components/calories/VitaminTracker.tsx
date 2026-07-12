import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { MealLog } from '../../pages/CalorieTracking';

interface VitaminTrackerProps {
  foodLogs: MealLog[];
}

export function VitaminTracker({ foodLogs }: VitaminTrackerProps) {
  // Recommended Daily Values (RDV) for adults
  const vitaminTargets = {
    vitamin_a: { label: 'Vitamin A', rdv: 900, unit: 'mcg' },
    vitamin_b1: { label: 'Vitamin B1 (Thiamin)', rdv: 1.2, unit: 'mg' },
    vitamin_b2: { label: 'Vitamin B2 (Riboflavin)', rdv: 1.3, unit: 'mg' },
    vitamin_b3: { label: 'Vitamin B3 (Niacin)', rdv: 16, unit: 'mg' },
    vitamin_b6: { label: 'Vitamin B6', rdv: 1.7, unit: 'mg' },
    vitamin_b9: { label: 'Vitamin B9 (Folate)', rdv: 400, unit: 'mcg' },
    vitamin_b12: { label: 'Vitamin B12', rdv: 2.4, unit: 'mcg' },
    vitamin_c: { label: 'Vitamin C', rdv: 90, unit: 'mg' },
    vitamin_d: { label: 'Vitamin D', rdv: 20, unit: 'mcg' },
    vitamin_e: { label: 'Vitamin E', rdv: 15, unit: 'mg' },
    vitamin_k: { label: 'Vitamin K', rdv: 120, unit: 'mcg' },
  };

  // Calculate consumed vitamins
  const consumed = foodLogs.reduce(
    (acc, mealLog) => {
      mealLog.entries.forEach((entry) => {
        acc.vitamin_a += (entry.vitamin_a || 0);
        acc.vitamin_b1 += (entry.vitamin_b1 || 0);
        acc.vitamin_b2 += (entry.vitamin_b2 || 0);
        acc.vitamin_b3 += (entry.vitamin_b3 || 0);
        acc.vitamin_b6 += (entry.vitamin_b6 || 0);
        acc.vitamin_b9 += (entry.vitamin_b9 || 0);
        acc.vitamin_b12 += (entry.vitamin_b12 || 0);
        acc.vitamin_c += (entry.vitamin_c || 0);
        acc.vitamin_d += (entry.vitamin_d || 0);
        acc.vitamin_e += (entry.vitamin_e || 0);
        acc.vitamin_k += (entry.vitamin_k || 0);
      });
      return acc;
    },
    {
      vitamin_a: 0, vitamin_b1: 0, vitamin_b2: 0, vitamin_b3: 0,
      vitamin_b6: 0, vitamin_b9: 0, vitamin_b12: 0,
      vitamin_c: 0, vitamin_d: 0, vitamin_e: 0, vitamin_k: 0
    }
  );

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    if (percentage <= 150) return 'bg-green-500';
    return 'bg-blue-500'; // Excess/Surplus
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Micronutrients & Vitamins</CardTitle>
        <CardDescription>Track your essential daily vitamins from logged foods</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Object.keys(vitaminTargets) as Array<keyof typeof vitaminTargets>).map((key) => {
            const { label, rdv, unit } = vitaminTargets[key];
            const amount = consumed[key];
            const percentage = Math.min((amount / rdv) * 100, 100);
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {amount.toFixed(1)}{unit} / {rdv}{unit}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getProgressColor((amount / rdv) * 100)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-right text-muted-foreground">
                  {((amount / rdv) * 100).toFixed(0)}% RDV
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
