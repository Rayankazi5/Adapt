import { Link, useLocation } from 'react-router-dom';
import { Home, Apple, Dumbbell } from 'lucide-react';
import { cn } from './ui/utils';

export function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/calories', label: 'Calorie Tracking', icon: Apple },
    { to: '/workouts', label: 'Workout Tracking', icon: Dumbbell },
  ];

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-6 text-primary" />
            <h1 className="font-semibold text-lg">FitTrack Pro</h1>
          </div>
          <div className="flex gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
