import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Apple, Droplets, Flame, Dumbbell, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export function Dashboard() {
  // Mock data for dashboard overview
  const todayStats = {
    calories: { consumed: 1650, target: 2000 },
    macros: {
      protein: { consumed: 120, target: 150 },
      carbs: { consumed: 180, target: 250 },
      fats: { consumed: 55, target: 65 },
    },
    hydration: { consumed: 6, target: 8 }, // glasses
    fasting: { current: 14, target: 16 }, // hours
    workouts: { completed: 1, planned: 1 },
    caloriesBurned: 450,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Your daily fitness overview</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories</CardTitle>
              <Flame className="size-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.calories.consumed} / {todayStats.calories.target}
              </div>
              <Progress 
                value={(todayStats.calories.consumed / todayStats.calories.target) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {todayStats.calories.target - todayStats.calories.consumed} kcal remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hydration</CardTitle>
              <Droplets className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.hydration.consumed} / {todayStats.hydration.target}
              </div>
              <Progress 
                value={(todayStats.hydration.consumed / todayStats.hydration.target) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {todayStats.hydration.target - todayStats.hydration.consumed} glasses to go
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fasting</CardTitle>
              <Calendar className="size-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.fasting.current} / {todayStats.fasting.target}h
              </div>
              <Progress 
                value={(todayStats.fasting.current / todayStats.fasting.target) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {todayStats.fasting.target - todayStats.fasting.current} hours remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workouts</CardTitle>
              <Dumbbell className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.workouts.completed} / {todayStats.workouts.planned}
              </div>
              <Progress 
                value={(todayStats.workouts.completed / todayStats.workouts.planned) * 100} 
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {todayStats.caloriesBurned} kcal burned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Macro Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Today's Macros</CardTitle>
            <CardDescription>Track your macronutrients progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm text-muted-foreground">
                    {todayStats.macros.protein.consumed}g / {todayStats.macros.protein.target}g
                  </span>
                </div>
                <Progress 
                  value={(todayStats.macros.protein.consumed / todayStats.macros.protein.target) * 100}
                  className="bg-blue-100"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Carbs</span>
                  <span className="text-sm text-muted-foreground">
                    {todayStats.macros.carbs.consumed}g / {todayStats.macros.carbs.target}g
                  </span>
                </div>
                <Progress 
                  value={(todayStats.macros.carbs.consumed / todayStats.macros.carbs.target) * 100}
                  className="bg-green-100"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Fats</span>
                  <span className="text-sm text-muted-foreground">
                    {todayStats.macros.fats.consumed}g / {todayStats.macros.fats.target}g
                  </span>
                </div>
                <Progress 
                  value={(todayStats.macros.fats.consumed / todayStats.macros.fats.target) * 100}
                  className="bg-yellow-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="size-5" />
                Calorie Tracking
              </CardTitle>
              <CardDescription>Log your meals and track absorption</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/calories">
                <Button className="w-full">Go to Calorie Tracking</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="size-5" />
                Workout Tracking
              </CardTitle>
              <CardDescription>Plan and track your workouts</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/workouts">
                <Button className="w-full">Go to Workout Tracking</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
