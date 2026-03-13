import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Clock, Play, Pause } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function FastingTracker() {
  const [fastingGoal, setFastingGoal] = useState(16);
  const [currentHours, setCurrentHours] = useState(14);
  const [isFasting, setIsFasting] = useState(true);
  const [lastMealTime, setLastMealTime] = useState('20:00');

  const progress = (currentHours / fastingGoal) * 100;
  const hoursRemaining = Math.max(0, fastingGoal - currentHours);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-purple-500" />
          Fasting Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fasting Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentHours}h / {fastingGoal}h
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {isFasting
              ? `${hoursRemaining.toFixed(1)} hours until goal`
              : 'Not currently fasting'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fasting-goal" className="text-xs">Fasting Goal (hours)</Label>
            <Input
              id="fasting-goal"
              type="number"
              value={fastingGoal}
              onChange={(e) => setFastingGoal(Number(e.target.value))}
              min={12}
              max={24}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-meal" className="text-xs">Last Meal Time</Label>
            <Input
              id="last-meal"
              type="time"
              value={lastMealTime}
              onChange={(e) => setLastMealTime(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isFasting ? 'secondary' : 'default'}
            className="flex-1"
            onClick={() => setIsFasting(true)}
          >
            <Play className="size-4 mr-2" />
            Start Fast
          </Button>
          <Button
            variant={!isFasting ? 'secondary' : 'outline'}
            className="flex-1"
            onClick={() => setIsFasting(false)}
          >
            <Pause className="size-4 mr-2" />
            End Fast
          </Button>
        </div>

        <div className="pt-4 border-t space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Started:</span>
            <span className="font-medium">{lastMealTime}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Window closes:</span>
            <span className="font-medium">
              {new Date(new Date().setHours(Number(lastMealTime.split(':')[0]) + fastingGoal, Number(lastMealTime.split(':')[1]))).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
