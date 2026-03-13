import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Flame, 
  TrendingUp,
  Moon,
  Wind,
  Heart,
  Target,
  BarChart3,
  Brain,
  Watch,
  Smartphone,
  CheckCircle,
  XCircle,
  Link2,
  Unlink,
  Bluetooth,
  Radio,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useState } from 'react';

interface Device {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  lastSync?: string;
  battery?: number;
}

interface BluetoothDevice {
  id: string;
  name: string;
  type: string;
  signalStrength: number;
  pairing?: boolean;
  paired?: boolean;
}

export function WorkoutAnalytics() {
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'Apple Watch', type: 'smartwatch', connected: false },
    { id: '2', name: 'Fitbit', type: 'smartwatch', connected: false },
    { id: '3', name: 'Garmin', type: 'smartwatch', connected: false },
    { id: '4', name: 'Samsung Galaxy Watch', type: 'smartwatch', connected: false },
    { id: '5', name: 'Whoop', type: 'fitness tracker', connected: false },
    { id: '6', name: 'Oura Ring', type: 'fitness tracker', connected: false },
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([]);
  const [showBluetoothDialog, setShowBluetoothDialog] = useState(false);

  const handleConnectDevice = (deviceId: string) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { 
            ...device, 
            connected: !device.connected,
            lastSync: device.connected ? undefined : new Date().toLocaleString(),
            battery: device.connected ? undefined : Math.floor(Math.random() * 40) + 60
          }
        : device
    ));
  };

  const handleScanBluetooth = () => {
    setIsScanning(true);
    setBluetoothDevices([]);
    
    // Simulate device discovery over time
    const discoveredDevices: BluetoothDevice[] = [
      { id: 'bt-1', name: 'Apple Watch Series 8', type: 'smartwatch', signalStrength: 95 },
      { id: 'bt-2', name: 'Garmin Forerunner 945', type: 'smartwatch', signalStrength: 78 },
      { id: 'bt-3', name: 'Fitbit Sense 2', type: 'smartwatch', signalStrength: 85 },
      { id: 'bt-4', name: 'Samsung Galaxy Watch 6', type: 'smartwatch', signalStrength: 68 },
      { id: 'bt-5', name: 'Whoop 4.0', type: 'fitness tracker', signalStrength: 72 },
    ];

    // Simulate gradual device discovery
    discoveredDevices.forEach((device, index) => {
      setTimeout(() => {
        setBluetoothDevices(prev => [...prev, device]);
      }, (index + 1) * 800);
    });

    // Stop scanning after all devices found
    setTimeout(() => {
      setIsScanning(false);
    }, discoveredDevices.length * 800 + 500);
  };

  const handlePairDevice = (bluetoothDevice: BluetoothDevice) => {
    // Start pairing process
    setBluetoothDevices(bluetoothDevices.map(d =>
      d.id === bluetoothDevice.id ? { ...d, pairing: true } : d
    ));

    // Simulate pairing delay
    setTimeout(() => {
      setBluetoothDevices(bluetoothDevices.map(d =>
        d.id === bluetoothDevice.id ? { ...d, pairing: false, paired: true } : d
      ));

      // Add to connected devices after a short delay
      setTimeout(() => {
        const newDevice: Device = {
          id: `connected-${Date.now()}`,
          name: bluetoothDevice.name,
          type: bluetoothDevice.type,
          connected: true,
          lastSync: new Date().toLocaleString(),
          battery: Math.floor(Math.random() * 40) + 60
        };
        setDevices([...devices, newDevice]);
        setShowBluetoothDialog(false);
        setBluetoothDevices([]);
      }, 1000);
    }, 2000);
  };

  // Mock data for muscle group training frequency (days since last workout)
  const muscleGroupData = [
    { group: 'Chest', daysSince: 2, frequency: 2, status: 'good' },
    { group: 'Back', daysSince: 1, frequency: 3, status: 'good' },
    { group: 'Legs', daysSince: 5, frequency: 1, status: 'neglected' },
    { group: 'Shoulders', daysSince: 3, frequency: 2, status: 'good' },
    { group: 'Arms', daysSince: 1, frequency: 3, status: 'overtraining' },
    { group: 'Core', daysSince: 7, frequency: 0.5, status: 'neglected' },
  ];

  // Weekly workout data
  const weeklyData = [
    { day: 'Mon', calories: 420, duration: 65, intensity: 8 },
    { day: 'Tue', calories: 0, duration: 0, intensity: 0 },
    { day: 'Wed', calories: 380, duration: 60, intensity: 7 },
    { day: 'Thu', calories: 450, duration: 70, intensity: 9 },
    { day: 'Fri', calories: 0, duration: 0, intensity: 0 },
    { day: 'Sat', calories: 520, duration: 75, intensity: 8 },
    { day: 'Sun', calories: 0, duration: 0, intensity: 0 },
  ];

  // Muscle balance radar data
  const muscleBalanceData = muscleGroupData.map(m => ({
    muscle: m.group,
    development: m.frequency * 20,
    fullMark: 100,
  }));

  // Rest recommendations
  const restRecommendations = muscleGroupData.map((muscle) => {
    if (muscle.status === 'overtraining') {
      return {
        group: muscle.group,
        recommendation: `Take 2-3 days rest. You've trained ${muscle.group.toLowerCase()} ${muscle.frequency}x this week.`,
        severity: 'high',
      };
    } else if (muscle.daysSince < 2) {
      return {
        group: muscle.group,
        recommendation: `Allow 1 more day of rest for optimal recovery.`,
        severity: 'medium',
      };
    }
    return null;
  }).filter(Boolean);

  const neglectedGroups = muscleGroupData.filter(m => m.status === 'neglected');
  const overtrainedGroups = muscleGroupData.filter(m => m.status === 'overtraining');

  const totalCaloriesBurned = weeklyData.reduce((sum, day) => sum + day.calories, 0);
  const totalWorkoutTime = weeklyData.reduce((sum, day) => sum + day.duration, 0);
  const workoutDays = weeklyData.filter(day => day.duration > 0).length;

  const connectedDevices = devices.filter(d => d.connected);

  return (
    <div className="space-y-6">
      {/* Connected Devices Section */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="size-5 text-primary" />
            Connected Devices
          </CardTitle>
          <CardDescription>
            Sync your smartwatch and fitness trackers to automatically track workouts, heart rate, and calories burned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedDevices.length > 0 && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="size-5" />
                <span className="font-medium">
                  {connectedDevices.length} device{connectedDevices.length > 1 ? 's' : ''} connected
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`p-4 rounded-lg border transition-all ${
                  device.connected
                    ? 'bg-primary/5 border-primary'
                    : 'bg-background hover:bg-accent'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {device.type === 'smartwatch' ? (
                        <Watch className="size-5 text-muted-foreground" />
                      ) : (
                        <Smartphone className="size-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{device.type}</p>
                      </div>
                    </div>
                    {device.connected ? (
                      <CheckCircle className="size-5 text-green-600" />
                    ) : (
                      <XCircle className="size-5 text-muted-foreground" />
                    )}
                  </div>

                  {device.connected && device.lastSync && (
                    <div className="space-y-2 pt-2 border-t text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Last synced:</span>
                        <span>{device.lastSync}</span>
                      </div>
                      {device.battery !== undefined && (
                        <div className="flex justify-between items-center">
                          <span>Battery:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={device.battery} className="w-16 h-1.5" />
                            <span>{device.battery}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant={device.connected ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnectDevice(device.id)}
                  >
                    {device.connected ? (
                      <>
                        <Unlink className="size-4 mr-2" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Link2 className="size-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {connectedDevices.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Heart className="size-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Automatic Data Sync</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Your workout data, heart rate, and calories burned will be automatically synced from your connected devices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bluetooth Scanner Button */}
          <Dialog open={showBluetoothDialog} onOpenChange={setShowBluetoothDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowBluetoothDialog(true)}
              >
                <Bluetooth className="size-4 mr-2" />
                Scan for Bluetooth Devices
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bluetooth className="size-5" />
                  Bluetooth Devices
                </DialogTitle>
                <DialogDescription>
                  Scan and pair your smartwatch or fitness tracker via Bluetooth. Make sure your device is in pairing mode.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  variant={isScanning ? "outline" : "default"}
                  className="w-full"
                  onClick={handleScanBluetooth}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Scanning for devices...
                    </>
                  ) : (
                    <>
                      <Radio className="size-4 mr-2" />
                      Start Scanning
                    </>
                  )}
                </Button>

                {bluetoothDevices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Available Devices</p>
                    {bluetoothDevices.map(device => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Bluetooth className="size-5 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">{device.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground capitalize">{device.type}</p>
                              <span className="text-xs">•</span>
                              <div className="flex items-center gap-1">
                                <Radio className="size-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{device.signalStrength}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          {device.pairing ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" />
                              <span>Pairing...</span>
                            </div>
                          ) : device.paired ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="size-4" />
                              <span>Paired!</span>
                            </div>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePairDevice(device)}
                            >
                              Pair
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isScanning && bluetoothDevices.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bluetooth className="size-12 mx-auto mb-2 opacity-50" />
                    <p>No devices found. Click "Start Scanning" to search for nearby devices.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Calories</CardTitle>
            <Flame className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCaloriesBurned}</div>
            <p className="text-xs text-muted-foreground">kcal burned this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workout Time</CardTitle>
            <Activity className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkoutTime}</div>
            <p className="text-xs text-muted-foreground">minutes this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workout Days</CardTitle>
            <Target className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workoutDays} / 7</div>
            <p className="text-xs text-muted-foreground">days trained</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Intensity</CardTitle>
            <TrendingUp className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workoutDays > 0 
                ? (weeklyData.reduce((sum, day) => sum + day.intensity, 0) / workoutDays).toFixed(1)
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground">out of 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(neglectedGroups.length > 0 || overtrainedGroups.length > 0) && (
        <div className="space-y-3">
          {neglectedGroups.length > 0 && (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertTitle>Neglected Muscle Groups</AlertTitle>
              <AlertDescription>
                You haven't trained these muscle groups recently: {' '}
                <strong>{neglectedGroups.map(g => g.group).join(', ')}</strong>. 
                Consider adding exercises for balanced development.
              </AlertDescription>
            </Alert>
          )}

          {overtrainedGroups.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Overtraining Warning</AlertTitle>
              <AlertDescription>
                You may be overtraining: {' '}
                <strong>{overtrainedGroups.map(g => g.group).join(', ')}</strong>. 
                Consider taking rest days to prevent injury and optimize recovery.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Tabs defaultValue="muscle-groups" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="muscle-groups">Muscle Groups</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="muscle-groups" className="space-y-4">
          {/* Muscle Group Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Muscle Group Training Status
              </CardTitle>
              <CardDescription>
                Track which muscle groups need attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {muscleGroupData.map((muscle) => (
                <div key={muscle.group} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{muscle.group}</span>
                      {muscle.status === 'neglected' && (
                        <Badge variant="destructive">Neglected</Badge>
                      )}
                      {muscle.status === 'overtraining' && (
                        <Badge variant="destructive">Overtraining</Badge>
                      )}
                      {muscle.status === 'good' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          On Track
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {muscle.daysSince === 0 ? 'Today' : `${muscle.daysSince}d ago`}
                    </span>
                  </div>
                  <Progress 
                    value={muscle.status === 'neglected' ? 20 : muscle.status === 'overtraining' ? 100 : 70}
                    className={
                      muscle.status === 'neglected' 
                        ? 'bg-red-100 [&>div]:bg-red-500'
                        : muscle.status === 'overtraining'
                        ? 'bg-orange-100 [&>div]:bg-orange-500'
                        : 'bg-green-100 [&>div]:bg-green-500'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Trained {muscle.frequency}x this week
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Muscle Balance Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Muscle Balance
              </CardTitle>
              <CardDescription>
                Visual representation of muscle development balance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={muscleBalanceData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="muscle" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Development"
                    dataKey="development"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {/* Weekly Calories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="size-5" />
                Weekly Calories Burned
              </CardTitle>
              <CardDescription>Track your calorie expenditure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calories" fill="#f97316" name="Calories Burned" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Workout Duration Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Workout Duration Trend
              </CardTitle>
              <CardDescription>Track your workout consistency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="duration" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Duration (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          {/* Rest Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="size-5" />
                Rest & Recovery Recommendations
              </CardTitle>
              <CardDescription>
                Optimize your recovery for best results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {restRecommendations.length > 0 ? (
                restRecommendations.map((rec: any, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      rec.severity === 'high'
                        ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`size-5 mt-0.5 ${
                        rec.severity === 'high' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <div>
                        <p className="font-medium">{rec.group}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {rec.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No rest warnings - You're recovering well! 💪</p>
                </div>
              )}

              {/* Recovery Tips */}
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Brain className="size-4" />
                  Recovery Best Practices
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Moon className="size-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Sleep</p>
                      <p>Aim for 7-9 hours per night for optimal muscle recovery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wind className="size-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Breathing</p>
                      <p>Exhale during exertion, inhale during relaxation. Keep breathing steady.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Activity className="size-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Stretching</p>
                      <p>5-10 minutes post-workout. Focus on muscles worked. Hold each stretch 15-30 seconds.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Heart className="size-4 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Cool Down</p>
                      <p>5-10 minutes of light cardio to gradually lower heart rate and prevent soreness.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Muscle Group Rest Times */}
          <Card>
            <CardHeader>
              <CardTitle>Muscle Group Rest Requirements</CardTitle>
              <CardDescription>
                Recommended rest periods between training sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { group: 'Large Muscles (Legs, Back, Chest)', rest: '48-72 hours' },
                  { group: 'Small Muscles (Arms, Shoulders)', rest: '24-48 hours' },
                  { group: 'Core', rest: '24-48 hours' },
                  { group: 'Cardio (Light)', rest: '24 hours' },
                  { group: 'Cardio (Intense)', rest: '48 hours' },
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-accent rounded-lg">
                    <span className="text-sm font-medium">{item.group}</span>
                    <Badge variant="outline">{item.rest}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}