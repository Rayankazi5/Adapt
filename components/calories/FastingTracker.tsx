import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock, Play, Square, TrendingUp, AlertTriangle, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '../../lib/dataService';
import { getCurrentUserId, getUser } from '../../lib/apiClient';
import {
  recommendFastingPlan,
  personalizeWindow,
  type UserFastingProfile,
  type AdherenceData,
  type FastingGoal,
  type ActivityLevel,
} from '../../lib/fastingEngine';

const STORAGE_KEY = 'adapt_fasting';
const PRESET_HOURS = [12, 14, 16, 18, 20];

interface FastingState {
  startTime: number | null;
  goalHours: number;
}

function loadFasting(): FastingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startTime: null, goalHours: 16 };
}

function saveFasting(s: FastingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function elapsedHours(startTime: number | null): number {
  if (!startTime) return 0;
  return Math.max(0, (Date.now() - startTime) / 3_600_000);
}

function fmtDuration(totalHours: number): string {
  const totalSecs = Math.floor(totalHours * 3600);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmt(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

const MODE_ICON = {
  normal:   <TrendingUp className="size-3.5 text-blue-500" />,
  upgrade:  <Zap className="size-3.5 text-yellow-500" />,
  recovery: <AlertTriangle className="size-3.5 text-orange-500" />,
};

const MODE_BORDER = {
  normal:   'border-blue-200/60 bg-blue-50/30 dark:bg-blue-950/20',
  upgrade:  'border-yellow-200/60 bg-yellow-50/30 dark:bg-yellow-950/20',
  recovery: 'border-orange-200/60 bg-orange-50/30 dark:bg-orange-950/20',
};

export function FastingTracker() {
  const [fasting, setFasting] = useState<FastingState>(loadFasting);
  const [elapsed, setElapsed] = useState(() => elapsedHours(loadFasting().startTime));
  const [profile, setProfile] = useState<UserFastingProfile | null>(null);
  const [customHours, setCustomHours] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load profile from stored prefs + user API
  useEffect(() => {
    const prefs = dataService.getFastingPrefs();
    const base: UserFastingProfile = {
      goal:             'maintenance',
      experience_level: prefs.experience_level ?? 'beginner',
      sleep_time:       prefs.sleep_time ?? '23:00',
      wake_time:        prefs.wake_time  ?? '07:00',
      activity_level:   'moderate',
    };
    const userId = getCurrentUserId();
    if (userId) {
      getUser(userId).then(data => {
        if (!data) { setProfile(base); return; }
        const goalMap: Record<string, FastingGoal> = {
          cut: 'fat_loss', bulk: 'muscle_gain', maintain: 'maintenance',
        };
        const actMap: Record<string, ActivityLevel> = {
          sedentary: 'low', light: 'low', moderate: 'moderate',
          active: 'high', very_active: 'high',
        };
        setProfile({
          ...base,
          goal:           goalMap[data.user.goal] ?? 'maintenance',
          activity_level: actMap[data.user.activity_level] ?? 'moderate',
          weight_kg:      data.user.weight_kg,
        });
      });
    } else {
      setProfile(base);
    }
  }, []);

  // Live timer tick every second while fasting
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (fasting.startTime) {
      setElapsed(elapsedHours(fasting.startTime));
      timerRef.current = setInterval(
        () => setElapsed(elapsedHours(fasting.startTime)),
        1_000,
      );
    } else {
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fasting.startTime]);

  // Adherence from history
  const adherence: AdherenceData = useMemo(() => {
    const sessions = dataService.getFastingHistory();
    return {
      sessions,
      missed_fast_count: sessions.filter(s => !s.completed).length,
      early_break_count: sessions.filter(s => !s.completed && s.actual_hours > 0).length,
    };
  }, []);

  // Engine recommendation
  const rec = useMemo(
    () => profile ? recommendFastingPlan(profile, adherence) : null,
    [profile, adherence],
  );

  // Eating window for the user's *selected* hours (may differ from recommendation)
  const selectedWindow = useMemo(() => {
    if (!profile) return null;
    return personalizeWindow(profile.wake_time, profile.sleep_time, fasting.goalHours);
  }, [profile, fasting.goalHours]);

  const isFasting = fasting.startTime !== null;
  const progress  = fasting.goalHours > 0
    ? Math.min((elapsed / fasting.goalHours) * 100, 100)
    : 0;
  const remaining = Math.max(0, fasting.goalHours - elapsed);
  const goalHit   = isFasting && elapsed >= fasting.goalHours;

  const update = (next: FastingState) => { setFasting(next); saveFasting(next); };

  // Select a preset or apply custom value
  const selectHours = (h: number) => {
    if (isFasting) return;
    const clamped = Math.min(23, Math.max(1, h));
    update({ ...fasting, goalHours: clamped });
    setCustomHours('');
  };

  const applyCustom = () => {
    const h = parseInt(customHours);
    if (!isNaN(h) && h >= 1 && h <= 23) selectHours(h);
  };

  const startFast = () => {
    update({ ...fasting, startTime: Date.now() });
    const win = selectedWindow;
    toast.success(
      `${fasting.goalHours}:${24 - fasting.goalHours} fast started!` +
      (win ? ` Eating window: ${win.start_time} – ${win.end_time}.` : ''),
    );
  };

  const endFast = () => {
    const actual    = elapsed;
    const completed = actual >= fasting.goalHours * 0.9;
    dataService.recordFastingSession({
      date:         todayKey(),
      completed,
      target_hours: fasting.goalHours,
      actual_hours: parseFloat(actual.toFixed(2)),
    });
    toast.success(
      completed
        ? `Fast complete — ${fmtDuration(actual)}. Great work!`
        : `Fast ended at ${fmtDuration(actual)} (target: ${fasting.goalHours} h).`,
    );
    update({ ...fasting, startTime: null });
  };

  const startedAt = fasting.startTime ? new Date(fasting.startTime) : null;

  // 7-day history dots
  const history    = adherence.sessions.slice(-7);
  const paddedDots = [...Array(Math.max(0, 7 - history.length)).fill(null), ...history];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-purple-500" />
          Fasting Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Recommendation banner ── */}
        {rec && (
          <div className={`rounded-xl border p-3 space-y-2 ${MODE_BORDER[rec.mode]}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {MODE_ICON[rec.mode]}
                <span className="text-sm font-semibold">
                  Recommended for you: {rec.recommended_plan}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  (fast {rec.end_time}–{rec.start_time})
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{rec.reasoning}</p>
            <div className="flex items-start gap-1.5 pt-1 border-t border-border/30">
              <TrendingUp className="size-3 mt-0.5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">{rec.next_step}</p>
            </div>
          </div>
        )}

        {/* ── Fasting hours selector ── */}
        {!isFasting && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Fasting Duration
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_HOURS.map(h => {
                const isSelected   = fasting.goalHours === h;
                const isRecHours   = rec?.fasting_hours === h;
                return (
                  <button
                    key={h}
                    onClick={() => selectHours(h)}
                    className={[
                      'relative px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/30 text-foreground border-border hover:bg-muted/60',
                    ].join(' ')}
                  >
                    {h}h
                    {isRecHours && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-3.5 rounded-full bg-yellow-400">
                        <Sparkles className="size-2 text-yellow-900" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Custom hours input */}
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  placeholder="Custom"
                  value={customHours}
                  onChange={e => setCustomHours(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCustom()}
                  min={1}
                  max={23}
                  className="w-20 h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={applyCustom}
                  disabled={!customHours}
                >
                  Set
                </Button>
              </div>
            </div>

            {/* Fasting window preview for selected hours */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span>
                {fasting.goalHours}h fast · {selectedWindow
                  ? `${selectedWindow.end_time} – ${selectedWindow.start_time}`
                  : '—'}
              </span>
            </div>
          </div>
        )}

        {/* ── Real-time clock ── */}
        {isFasting ? (
          <div className="rounded-xl bg-muted/40 p-4 space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {goalHit ? 'Goal reached!' : 'Elapsed'}
            </p>
            <p className={`text-4xl font-mono font-bold tabular-nums tracking-tight ${goalHit ? 'text-green-500' : 'text-foreground'}`}>
              {fmtDuration(elapsed)}
            </p>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fasting.goalHours}h goal</span>
              {!goalHit && <span>{fmtDuration(remaining)} remaining</span>}
              {goalHit && <span className="text-green-500 font-medium">🎉 Fasting goal reached!</span>}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Fasting Progress</span>
              <span className="text-sm text-muted-foreground">{fasting.goalHours}h selected</span>
            </div>
            <Progress value={0} className="h-2" />
            <p className="text-xs text-muted-foreground">Press Start Fast to begin.</p>
          </div>
        )}

        {/* ── Start / Finish ── */}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={isFasting} onClick={startFast}>
            <Play className="size-4 mr-2" />
            Start {fasting.goalHours}:{String(24 - fasting.goalHours).padStart(2, '0')} Fast
          </Button>
          <Button variant="outline" className="flex-1" disabled={!isFasting} onClick={endFast}>
            <Square className="size-4 mr-2" /> Finish Fast
          </Button>
        </div>

        {/* ── Active session info ── */}
        {isFasting && startedAt && (
          <div className="pt-3 border-t space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Started at:</span>
              <span className="font-medium">{fmt(startedAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Eating window opens:</span>
              <span className={`font-medium ${goalHit ? 'text-green-500' : ''}`}>
                {selectedWindow?.start_time ?? '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Eating window closes:</span>
              <span className="font-medium">{selectedWindow?.end_time ?? '—'}</span>
            </div>
          </div>
        )}

        {/* ── 7-day adherence dots ── */}
        {history.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">Last 7 days</p>
            <div className="flex gap-1.5 items-center">
              {paddedDots.map((s, i) =>
                s === null ? (
                  <div key={i} className="size-6 rounded-full bg-muted/30" />
                ) : (
                  <div
                    key={i}
                    title={`${s.date}: ${s.completed ? 'Completed' : 'Missed'} (${s.actual_hours.toFixed(1)}h)`}
                    className={`size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                      s.completed ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  >
                    {s.completed ? '✓' : '✗'}
                  </div>
                ),
              )}
              <span className="text-xs text-muted-foreground ml-1">
                {history.filter(s => s.completed).length}/{history.length} completed
              </span>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
