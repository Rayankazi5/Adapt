import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Apple, Dumbbell, UserCircle } from 'lucide-react';
import { cn } from './ui/utils';
import { getXPProgress, getStreak } from '../lib/gamification';

export function Navigation() {
  const location = useLocation();
  const [xpData, setXpData] = useState(getXPProgress());
  const [streak, setStreak] = useState(getStreak());

  useEffect(() => {
    const onXP = () => setXpData(getXPProgress());
    const onStreak = () => setStreak(getStreak());
    window.addEventListener('xp_update', onXP);
    window.addEventListener('streak_update', onStreak);
    return () => {
      window.removeEventListener('xp_update', onXP);
      window.removeEventListener('streak_update', onStreak);
    };
  }, []);

  const links = [
    { to: '/',          label: 'Dashboard', icon: Home       },
    { to: '/calories',  label: 'Calories',  icon: Apple      },
    { to: '/workouts',  label: 'Workouts',  icon: Dumbbell   },
    { to: '/profile',   label: 'Profile',   icon: UserCircle },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Brand + Level + XP bar */}
          <div className="flex items-center gap-3">
            <Dumbbell className="size-6 text-primary animate-float" />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 leading-none">
                <span className="font-bold text-base tracking-tight">ADAPT</span>
                <span className="level-badge px-1.5 py-0.5 rounded-full text-[10px]">
                  LV {xpData.level}
                </span>
                {streak > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-500 text-xs font-bold">
                    <span className="animate-streak-fire inline-block">🔥</span>
                    {streak}
                  </span>
                )}
              </div>
              {/* XP progress bar */}
              <div className="h-1 w-28 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full xp-bar-fill rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${xpData.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm scale-[1.03]'
                      : 'hover:bg-accent hover:text-accent-foreground hover:scale-105 active:scale-95'
                  )}
                >
                  <Icon className={cn('size-4 transition-transform duration-200', isActive && 'scale-110')} />
                  <span className="hidden sm:inline text-sm">{link.label}</span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>

      {/* Thin XP accent line at the very bottom of nav */}
      <div className="h-[2px] w-full bg-muted overflow-hidden">
        <div
          className="h-full xp-bar-fill transition-[width] duration-700 ease-out"
          style={{ width: `${xpData.percent}%` }}
        />
      </div>
    </nav>
  );
}
