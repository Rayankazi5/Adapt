import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { MealLog } from '../../pages/CalorieTracking';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AbsorptionTrackerProps {
  foodLogs: MealLog[];
}

export function AbsorptionTracker({ foodLogs }: AbsorptionTrackerProps) {
  // Calculate total logged calories
  const totalLogged = foodLogs.reduce(
    (sum, mealLog) =>
      sum + mealLog.entries.reduce((mealSum, entry) => mealSum + entry.calories, 0),
    0
  );

  // Absorption rate varies by food type, digestion health, etc.
  // For this demo, we'll use ~85% absorption rate
  const absorptionRate = 0.85;
  const effectiveCalories = Math.round(totalLogged * absorptionRate);
  const unabsorbedCalories = totalLogged - effectiveCalories;

  // Mock weekly data
  const weeklyData = [
    { day: 'Mon', logged: 1950, effective: 1658, absorption: 85 },
    { day: 'Tue', logged: 2100, effective: 1785, absorption: 85 },
    { day: 'Wed', logged: 1850, effective: 1573, absorption: 85 },
    { day: 'Thu', logged: 2050, effective: 1743, absorption: 85 },
    { day: 'Fri', logged: 2200, effective: 1870, absorption: 85 },
    { day: 'Sat', logged: 2300, effective: 1955, absorption: 85 },
    { day: 'Sun', logged: totalLogged, effective: effectiveCalories, absorption: Math.round(absorptionRate * 100) },
  ];

  const weeklyAverage = {
    logged: Math.round(weeklyData.reduce((sum, d) => sum + d.logged, 0) / weeklyData.length),
    effective: Math.round(weeklyData.reduce((sum, d) => sum + d.effective, 0) / weeklyData.length),
    absorption: Math.round(weeklyData.reduce((sum, d) => sum + d.absorption, 0) / weeklyData.length),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="size-5 text-green-500" />
            Absorption Tracker
          </CardTitle>
          <CardDescription>
            Track the difference between consumed and absorbed calories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              {/* Daily Absorption */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Logged Calories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{totalLogged}</p>
                      <p className="text-xs text-muted-foreground mt-1">Total consumed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Effective Calories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">{effectiveCalories}</p>
                      <p className="text-xs text-muted-foreground mt-1">Actually absorbed</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Not Absorbed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-600">{unabsorbedCalories}</p>
                      <p className="text-xs text-muted-foreground mt-1">Passed through</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Absorption Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(absorptionRate * 100)}%
                    </span>
                  </div>
                  <Progress value={absorptionRate * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Your body is absorbing {Math.round(absorptionRate * 100)}% of consumed calories
                  </p>
                </div>

                <div className="p-4 bg-accent rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Factors Affecting Absorption:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Gut health and microbiome diversity</li>
                    <li>• Food processing and cooking methods</li>
                    <li>• Fiber content (high fiber reduces absorption)</li>
                    <li>• Meal timing and combinations</li>
                    <li>• Individual metabolic rate</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              {/* Weekly Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Logged
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{weeklyAverage.logged}</p>
                    <p className="text-xs text-muted-foreground mt-1">kcal/day</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Effective
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{weeklyAverage.effective}</p>
                    <p className="text-xs text-muted-foreground mt-1">kcal/day</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg Absorption
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{weeklyAverage.absorption}%</p>
                    <p className="text-xs text-muted-foreground mt-1">This week</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Weekly Absorption Trend</span>
                  <span className="text-sm text-muted-foreground">
                    {weeklyAverage.absorption}% average
                  </span>
                </div>
                <Progress value={weeklyAverage.absorption} className="h-3" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Graphs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Logged vs Effective Calories
          </CardTitle>
          <CardDescription>7-day comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="logged" fill="#3b82f6" name="Logged Calories" />
              <Bar dataKey="effective" fill="#10b981" name="Effective Calories" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            Absorption Rate Trend
          </CardTitle>
          <CardDescription>Weekly absorption percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[75, 95]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="absorption" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Absorption Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
