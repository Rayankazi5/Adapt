import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Lightbulb, Utensils, TrendingUp } from 'lucide-react';
import type { FoodSuggestion } from '../../lib/apiClient';
import type { DietaryPreference } from '../../lib/dataService';

const n = (v: number) => (Number.isFinite(v) ? Math.round(v) : 0);

const DIET_BADGE: Record<DietaryPreference, { label: string; color: string }> = {
  'non-vegetarian': { label: '🍖 Non-Veg',    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  'vegetarian':     { label: '🥚 Vegetarian', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  'vegan':          { label: '🌱 Vegan',       color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const PROTEIN_EMPTY: Record<DietaryPreference, string> = {
  'non-vegetarian': 'No protein suggestions — you\'re on track!',
  'vegetarian':     'No vegetarian protein sources needed — great job!',
  'vegan':          'No vegan protein sources needed — great job!',
};

const BALANCE_EMPTY: Record<DietaryPreference, string> = {
  'non-vegetarian': 'Calorie target met — nothing more needed.',
  'vegetarian':     'Calorie target met with vegetarian foods.',
  'vegan':          'Calorie target met with plant-based foods.',
};

interface RecommendationsCardProps {
  proteinSuggestions: FoodSuggestion[];
  calorieSuggestions: FoodSuggestion[];
  generalRecommendations: string[];
  diet?: DietaryPreference;
  loading?: boolean;
  onQuickAdd?: (foodName: string, quantityG: number) => void;
}

export function RecommendationsCard({
  proteinSuggestions,
  calorieSuggestions,
  generalRecommendations,
  diet = 'non-vegetarian',
  loading,
  onQuickAdd,
}: RecommendationsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading recommendations...
        </CardContent>
      </Card>
    );
  }

  const badge = DIET_BADGE[diet];
  const hasAnything = proteinSuggestions.length > 0 || calorieSuggestions.length > 0 || generalRecommendations.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="size-5 text-yellow-500" />
            Smart Suggestions
          </CardTitle>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* General tips */}
        {generalRecommendations.length > 0 && (
          <div className="space-y-2">
            {generalRecommendations.map((tip, i) => (
              <div key={i} className="flex gap-2 p-2 rounded-md bg-muted/30">
                <TrendingUp className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Protein suggestions */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <span className="text-blue-500">●</span>
            Hit Your Protein Target
            {diet !== 'non-vegetarian' && (
              <span className="text-[10px] font-normal text-muted-foreground">
                ({diet === 'vegan' ? 'plant-based only' : 'vegetarian only'})
              </span>
            )}
          </h4>
          {proteinSuggestions.length > 0 ? (
            <div className="space-y-2">
              {proteinSuggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <Utensils className="size-3 inline mr-1" />
                      {s.food.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {n(s.suggested_quantity_g)}g → {n(s.nutrition_at_suggested.protein)}g protein, {n(s.nutrition_at_suggested.calories)} kcal
                    </p>
                  </div>
                  {onQuickAdd && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs ml-2 shrink-0"
                      onClick={() => onQuickAdd(s.food.displayName, s.suggested_quantity_g)}
                    >
                      + Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-1">{PROTEIN_EMPTY[diet]}</p>
          )}
        </div>

        {/* Calorie balance suggestions */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <span className="text-green-500">●</span>
            Balance Your Day
            {diet !== 'non-vegetarian' && (
              <span className="text-[10px] font-normal text-muted-foreground">
                ({diet === 'vegan' ? 'plant-based only' : 'vegetarian only'})
              </span>
            )}
          </h4>
          {calorieSuggestions.length > 0 ? (
            <div className="space-y-2">
              {calorieSuggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <Utensils className="size-3 inline mr-1" />
                      {s.food.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {n(s.suggested_quantity_g)}g → {n(s.nutrition_at_suggested.calories)} kcal ({n(s.nutrition_at_suggested.protein)}g P / {n(s.nutrition_at_suggested.carbs)}g C / {n(s.nutrition_at_suggested.fat)}g F)
                    </p>
                  </div>
                  {onQuickAdd && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs ml-2 shrink-0"
                      onClick={() => onQuickAdd(s.food.displayName, s.suggested_quantity_g)}
                    >
                      + Add
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-1">{BALANCE_EMPTY[diet]}</p>
          )}
        </div>

        {!hasAnything && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Set up your profile and log some meals to get personalized suggestions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
