import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Droplets, Plus, Minus } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';

export function HydrationTracker() {
  const [goal, setGoal] = useState(8); // glasses
  const [consumed, setConsumed] = useState(6);
  const [glassSize, setGlassSize] = useState(250); // ml

  const progress = (consumed / goal) * 100;
  const remaining = Math.max(0, goal - consumed);

  const addGlass = () => {
    setConsumed((prev) => Math.min(prev + 1, goal + 5));
    toast.success('Added 1 glass of water!');
  };

  const removeGlass = () => {
    setConsumed((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="size-5 text-blue-500" />
          Hydration Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Daily Goal</span>
            <span className="text-sm text-muted-foreground">
              {consumed} / {goal} glasses
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {remaining === 0 
              ? '🎉 Goal achieved!' 
              : `${remaining} glass${remaining !== 1 ? 'es' : ''} remaining`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hydration-goal" className="text-xs">Daily Goal (glasses)</Label>
            <Input
              id="hydration-goal"
              type="number"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              min={4}
              max={16}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="glass-size" className="text-xs">Glass Size (ml)</Label>
            <Input
              id="glass-size"
              type="number"
              value={glassSize}
              onChange={(e) => setGlassSize(Number(e.target.value))}
              step={50}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={removeGlass}
            disabled={consumed === 0}
          >
            <Minus className="size-4 mr-2" />
            Remove
          </Button>
          <Button
            className="flex-1"
            onClick={addGlass}
          >
            <Plus className="size-4 mr-2" />
            Add Glass
          </Button>
        </div>

        <div className="pt-4 border-t space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total intake:</span>
            <span className="font-medium">{consumed * glassSize} ml</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target intake:</span>
            <span className="font-medium">{goal * glassSize} ml</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
