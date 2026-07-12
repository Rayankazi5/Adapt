import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Droplets, Plus, Minus, Thermometer, Wind, Dumbbell, Bell, MapPin, RefreshCw } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { dataService } from '../../lib/dataService';
import { getCurrentUserId, getUser } from '../../lib/apiClient';

type WeatherStatus = 'idle' | 'fetching' | 'live' | 'denied' | 'error';

async function fetchLiveWeather(): Promise<{ tempC: number; humidity: number }> {
  const { latitude, longitude } = await new Promise<GeolocationCoordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), reject, {
      timeout: 10_000,
      maximumAge: 5 * 60_000,
    });
  });
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}` +
    `&current=temperature_2m,relative_humidity_2m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API error');
  const json = await res.json();
  return {
    tempC:    Math.round(json.current.temperature_2m),
    humidity: Math.round(json.current.relative_humidity_2m),
  };
}

const GLASS_ML = 250; // 1 glass = 250 ml (spec)

type Intensity = 'none' | 'low' | 'moderate' | 'high';

interface HydroInputs {
  tempC: number;
  humidity: number;
  intensity: Intensity;
}

const INPUTS_KEY = 'adapt_hydro_inputs';

function loadInputs(): HydroInputs {
  try {
    const raw = localStorage.getItem(INPUTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tempC: 28, humidity: 60, intensity: 'none' };
}

function computeRecommendation(
  inputs: HydroInputs,
  workoutDurationMins: number,
  weightKg: number,
  consumedMl: number,
  workoutWaterMl: number,
): {
  totalMl: number;
  consumedMl: number;
  remainingMl: number;
  glasses: number;
  workoutReqMl: number;
  status: 'Normal' | 'Mild deficit' | 'High deficit';
  reminder: string;
  advice: string;
} {
  // 1. Base
  let totalMl = weightKg * 35;

  // 2. Weather
  if (inputs.tempC > 30) totalMl += 500;
  if (inputs.humidity > 70) totalMl += 300;

  // 3. Workout
  const intensityAdj: Record<Intensity, number> = { none: 0, low: 300, moderate: 500, high: 800 };
  totalMl += intensityAdj[inputs.intensity];
  totalMl += Math.floor(workoutDurationMins / 30) * 200;

  // 4. Workout water requirement (portion of total attributable to workout)
  const workoutReqMl = intensityAdj[inputs.intensity] + Math.floor(workoutDurationMins / 30) * 200;

  // 5. Deficit & status
  const remainingMl = Math.max(0, totalMl - consumedMl);
  const deficit = totalMl - consumedMl;
  const status: 'Normal' | 'Mild deficit' | 'High deficit' =
    deficit <= 500 ? 'Normal' : deficit <= 1000 ? 'Mild deficit' : 'High deficit';

  // 6. Reminder interval
  const reminder =
    deficit > 1000 ? 'Every 20 min' : deficit >= 500 ? 'Every 40 min' : 'Every 60 min';

  // 7. Glasses remaining
  const glasses = Math.ceil(remainingMl / GLASS_ML);

  // 8. Advice — specific, no fluff
  const workoutDehydrated =
    inputs.intensity !== 'none' && workoutReqMl > 0 && workoutWaterMl < workoutReqMl * 0.7;

  let advice: string;
  if (deficit <= 0) {
    advice = "You're fully hydrated. Keep sipping steadily through the rest of the day.";
  } else if (workoutDehydrated) {
    advice = `Workout hydration deficit — you drank ${workoutWaterMl} ml but needed ~${workoutReqMl} ml. Drink ${Math.ceil((workoutReqMl - workoutWaterMl) / GLASS_ML)} glasses now to recover.`;
  } else if (inputs.tempC > 30 && inputs.humidity > 70) {
    advice = `Hot and humid — sweat rate is high. Front-load ${glasses} glasses before evening; avoid waiting until thirsty.`;
  } else if (inputs.tempC > 30) {
    advice = `High heat adds ~500 ml extra demand. Spread ${glasses} glasses evenly over the next ${Math.round(glasses * 20)} min.`;
  } else if (inputs.intensity === 'high') {
    advice = `High-intensity session increases fluid loss significantly. Drink ${glasses} glasses within the next 2 hours.`;
  } else {
    advice = `${glasses} glass${glasses !== 1 ? 'es' : ''} remaining. Aim for one every ${reminder.split(' ').slice(-2).join(' ')}.`;
  }

  return { totalMl, consumedMl, remainingMl, glasses, workoutReqMl, status, reminder, advice };
}

export function HydrationTracker() {
  const [hydration, setHydration] = useState(() => dataService.getHydration());
  const [inputs, setInputs] = useState<HydroInputs>(loadInputs);
  const [weightKg, setWeightKg] = useState(70);
  const [workoutWaterMl, setWorkoutWaterMl] = useState(0);
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('idle');
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<string | null>(null);

  // Load user weight from profile
  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) return;
    getUser(userId).then(data => { if (data) setWeightKg(data.user.weight_kg); });
  }, []);

  // Fetch live weather and auto-apply to inputs
  const refreshWeather = useCallback(async () => {
    if (!navigator.geolocation) { setWeatherStatus('denied'); return; }
    setWeatherStatus('fetching');
    try {
      const { tempC, humidity } = await fetchLiveWeather();
      setInputs(prev => {
        const next = { ...prev, tempC, humidity };
        localStorage.setItem(INPUTS_KEY, JSON.stringify(next));
        return next;
      });
      setWeatherUpdatedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setWeatherStatus('live');
    } catch (err: any) {
      const isDenied = err?.code === 1;
      setWeatherStatus(isDenied ? 'denied' : 'error');
      if (isDenied) toast.error('Location access denied — enable it in browser settings to use live weather.');
      else toast.error('Could not fetch weather. Check your connection.');
    }
  }, []);

  // Auto-fetch on mount; refresh every 30 min
  useEffect(() => {
    refreshWeather();
    const id = setInterval(refreshWeather, 30 * 60_000);
    return () => clearInterval(id);
  }, [refreshWeather]);

  // Persist inputs
  const updateInputs = (next: HydroInputs) => {
    setInputs(next);
    localStorage.setItem(INPUTS_KEY, JSON.stringify(next));
  };

  const consumedMl = hydration.consumed * GLASS_ML;

  // Today's total workout duration in minutes
  const workoutDurationMins = useMemo(() => {
    const logs = dataService.getWorkoutLogs();
    return logs.reduce((sum, w) => sum + w.duration, 0) / 60;
  }, []);

  // Smart recommendation
  const rec = useMemo(
    () => computeRecommendation(inputs, workoutDurationMins, weightKg, consumedMl, workoutWaterMl),
    [inputs, workoutDurationMins, weightKg, consumedMl, workoutWaterMl],
  );

  // Sync goal to recommendation (in glasses, rounded up)
  const recommendedGoal = Math.ceil(rec.totalMl / GLASS_ML);

  const { consumed, goal } = hydration;
  const progress = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
  const remainingGlasses = Math.max(0, goal - consumed);

  const applyRecommendedGoal = () => {
    const next = { consumed, goal: recommendedGoal };
    setHydration(next);
    dataService.saveHydration(next.consumed, next.goal);
    toast.success(`Goal updated to ${recommendedGoal} glasses (${rec.totalMl} ml)`);
  };

  const updateHydration = (newConsumed: number, newGoal = goal) => {
    const next = { consumed: Math.max(0, Math.min(newConsumed, newGoal + 5)), goal: newGoal };
    setHydration(next);
    dataService.saveHydration(next.consumed, next.goal);
  };

  const addGlass = () => { updateHydration(consumed + 1); toast.success('Added 1 glass of water!'); };
  const removeGlass = () => updateHydration(consumed - 1);

  const statusColor = {
    Normal: 'text-green-500',
    'Mild deficit': 'text-yellow-500',
    'High deficit': 'text-red-500',
  }[rec.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="size-5 text-blue-500" />
          Hydration Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Current progress ── */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Today's Progress</span>
            <span className="text-sm text-muted-foreground">{consumed} / {goal} glasses</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {remainingGlasses === 0 ? '🎉 Goal achieved!' : `${remainingGlasses} glass${remainingGlasses !== 1 ? 'es' : ''} remaining`}
          </p>
        </div>

        {/* ── Add / Remove ── */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={removeGlass} disabled={consumed === 0}>
            <Minus className="size-4 mr-2" /> Remove
          </Button>
          <Button className="flex-1" onClick={addGlass}>
            <Plus className="size-4 mr-2" /> Add Glass
          </Button>
        </div>

        {/* ── Smart inputs ── */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Smart Recommendation Inputs</p>
            <div className="flex items-center gap-2">
              {weatherStatus === 'live' && weatherUpdatedAt && (
                <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                  <MapPin className="size-3" /> Live · {weatherUpdatedAt}
                </span>
              )}
              {weatherStatus === 'fetching' && (
                <span className="text-[10px] text-muted-foreground animate-pulse">Fetching weather…</span>
              )}
              {(weatherStatus === 'denied' || weatherStatus === 'error') && (
                <span className="text-[10px] text-yellow-500">Manual mode</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => refreshWeather()}
                disabled={weatherStatus === 'fetching'}
                title="Refresh weather"
              >
                <RefreshCw className={`size-3 ${weatherStatus === 'fetching' ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Thermometer className="size-3" /> Temperature (°C)
              </Label>
              <Input
                type="number"
                value={inputs.tempC}
                onChange={e => updateInputs({ ...inputs, tempC: Number(e.target.value) })}
                min={0} max={55}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Wind className="size-3" /> Humidity (%)
              </Label>
              <Input
                type="number"
                value={inputs.humidity}
                onChange={e => updateInputs({ ...inputs, humidity: Number(e.target.value) })}
                min={0} max={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Dumbbell className="size-3" /> Workout Intensity
              </Label>
              <Select value={inputs.intensity} onValueChange={v => updateInputs({ ...inputs, intensity: v as Intensity })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No workout</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Water during workout (ml)</Label>
              <Input
                type="number"
                value={workoutWaterMl}
                onChange={e => setWorkoutWaterMl(Number(e.target.value))}
                min={0} step={100}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* ── Recommendation output ── */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommendation</p>
            <span className={`text-xs font-bold ${statusColor}`}>{rec.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Target</p>
              <p className="font-semibold">{rec.totalMl} ml</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Consumed</p>
              <p className="font-semibold">{rec.consumedMl} ml</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Remaining</p>
              <p className="font-semibold">{rec.remainingMl} ml</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Glasses left</p>
              <p className="font-semibold">{rec.glasses}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <Bell className="size-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">Remind: <span className="font-medium text-foreground">{rec.reminder}</span></p>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{rec.advice}</p>

          {recommendedGoal !== goal && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={applyRecommendedGoal}>
              Apply recommended goal ({recommendedGoal} glasses)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
