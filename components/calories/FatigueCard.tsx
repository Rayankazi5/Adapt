import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Battery, AlertTriangle, CheckCircle, Heart } from 'lucide-react';
import type { FatigueResult } from '../../lib/apiClient';

interface FatigueCardProps {
  fatigue: FatigueResult | null;
  loading?: boolean;
}

// SVG ring gauge — radius 40, circumference ≈ 251
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function RingGauge({ score, colorClass }: { score: number; colorClass: string }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const offset = CIRCUMFERENCE - (animated ? score / 100 : 0) * CIRCUMFERENCE;

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90" aria-hidden>
      {/* Track */}
      <circle
        cx="48" cy="48" r={RADIUS}
        fill="none"
        strokeWidth="10"
        className="text-muted/30"
        stroke="currentColor"
      />
      {/* Fill */}
      <circle
        cx="48" cy="48" r={RADIUS}
        fill="none"
        strokeWidth="10"
        strokeLinecap="round"
        stroke="currentColor"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        className={colorClass}
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
      />
    </svg>
  );
}

export function FatigueCard({ fatigue, loading }: FatigueCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading fatigue data...
        </CardContent>
      </Card>
    );
  }

  if (!fatigue) return null;

  const score = fatigue.fatigue_score;

  let textColor: string, strokeColor: string, Icon: typeof Battery, label: string;
  if (score <= 20) {
    textColor = 'text-green-500';  strokeColor = 'text-green-500';
    Icon = CheckCircle; label = 'Well Recovered';
  } else if (score <= 40) {
    textColor = 'text-lime-500';   strokeColor = 'text-lime-500';
    Icon = Heart;        label = 'Mild Fatigue';
  } else if (score <= 60) {
    textColor = 'text-yellow-500'; strokeColor = 'text-yellow-500';
    Icon = Battery;      label = 'Moderate Fatigue';
  } else if (score <= 80) {
    textColor = 'text-orange-500'; strokeColor = 'text-orange-500';
    Icon = AlertTriangle; label = 'High Fatigue';
  } else {
    textColor = 'text-red-500';    strokeColor = 'text-red-500';
    Icon = AlertTriangle; label = 'Critical Fatigue';
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-5 ${textColor}`} />
          Fatigue &amp; Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ring gauge + score */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <RingGauge score={score} colorClass={strokeColor} />
            {/* Score in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold leading-none ${textColor}`}>{score}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-lg font-semibold ${textColor}`}>{label}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-3">
              {fatigue.recovery_recommendation}
            </p>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Calories</p>
            <p className="text-sm font-bold">{fatigue.breakdown.calorie_factor}
              <span className="text-muted-foreground font-normal">/35</span>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Protein</p>
            <p className="text-sm font-bold">{fatigue.breakdown.protein_factor}
              <span className="text-muted-foreground font-normal">/25</span>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Hydration</p>
            <p className="text-sm font-bold">{fatigue.breakdown.hydration_factor ?? 0}
              <span className="text-muted-foreground font-normal">/20</span>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Workout</p>
            <p className="text-sm font-bold">{fatigue.breakdown.workout_factor}
              <span className="text-muted-foreground font-normal">/20</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
