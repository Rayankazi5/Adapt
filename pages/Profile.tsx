import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { User, Target, Activity, Scale, Ruler, Leaf, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  createOrUpdateUser,
  getUser,
  getCurrentUserId,
  type UserProfile,
  type UserTargets,
} from '../lib/apiClient';
import { dataService, type DietaryPreference } from '../lib/dataService';
import type { ExperienceLevel } from '../lib/fastingEngine';

export function Profile() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    age: 25,
    weight_kg: 70,
    height_cm: 170,
    goal: 'maintain',
    activity_level: 'moderate',
  });
  const [targets, setTargets] = useState<UserTargets | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [dietaryPreference, setDietaryPreferenceState] = useState<DietaryPreference>(
    () => dataService.getDietaryPreference()
  );
  const [fastingPrefs, setFastingPrefsState] = useState(
    () => dataService.getFastingPrefs()
  );

  // Load existing user on mount
  useEffect(() => {
    const id = getCurrentUserId();
    if (id) {
      setUserId(id);
      getUser(id).then(data => {
        if (data) {
          setProfile({
            id: data.user.id,
            name: data.user.name,
            age: data.user.age,
            weight_kg: data.user.weight_kg,
            height_cm: data.user.height_cm,
            goal: data.user.goal as 'cut' | 'bulk' | 'maintain',
            activity_level: data.user.activity_level as UserProfile['activity_level'],
          });
          setTargets(data.targets);
        }
      });
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await createOrUpdateUser({
        ...profile,
        id: userId ?? undefined,
      });
      setUserId(data.user.id);
      setTargets(data.targets);
      dataService.saveDietaryPreference(dietaryPreference);
      dataService.saveFastingPrefs(fastingPrefs);
      toast.success(userId ? 'Profile updated!' : 'Profile created!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const goalDescriptions = {
    cut: 'Lose fat while preserving muscle (calorie deficit)',
    bulk: 'Build muscle with calorie surplus',
    maintain: 'Maintain current weight and composition',
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Profile</h2>
          <p className="text-muted-foreground">Set up your stats to get personalised nutrition targets</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your body stats and fitness goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="flex items-center gap-1">
                  <User className="size-3" /> Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-1">
                  <Scale className="size-3" /> Weight (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-1">
                <Ruler className="size-3" /> Height (cm)
              </Label>
              <Input
                id="height"
                type="number"
                value={profile.height_cm}
                onChange={(e) => setProfile({ ...profile, height_cm: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Target className="size-3" /> Goal
              </Label>
              <Select value={profile.goal} onValueChange={(v) => setProfile({ ...profile, goal: v as UserProfile['goal'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cut">Cut (Fat Loss)</SelectItem>
                  <SelectItem value="bulk">Bulk (Muscle Gain)</SelectItem>
                  <SelectItem value="maintain">Maintain</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{goalDescriptions[profile.goal]}</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Activity className="size-3" /> Activity Level
              </Label>
              <Select value={profile.activity_level} onValueChange={(v) => setProfile({ ...profile, activity_level: v as UserProfile['activity_level'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (desk job, little exercise)</SelectItem>
                  <SelectItem value="light">Light (1-2 days/week exercise)</SelectItem>
                  <SelectItem value="moderate">Moderate (3-5 days/week exercise)</SelectItem>
                  <SelectItem value="active">Active (6-7 days/week exercise)</SelectItem>
                  <SelectItem value="very_active">Very Active (hard training + physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Leaf className="size-3 text-green-500" /> Dietary Preference
              </Label>
              <Select
                value={dietaryPreference}
                onValueChange={(v) => setDietaryPreferenceState(v as DietaryPreference)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-vegetarian">
                    🍖 Non-Vegetarian — includes meat, poultry &amp; seafood
                  </SelectItem>
                  <SelectItem value="vegetarian">
                    🥚 Vegetarian — no meat or seafood, dairy &amp; eggs OK
                  </SelectItem>
                  <SelectItem value="vegan">
                    🌱 Vegan — no animal products whatsoever
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Smart meal suggestions will only show foods that match your preference.
              </p>
            </div>

            <Button onClick={handleSave} className="w-full mt-4" disabled={loading}>
              {loading ? 'Saving...' : (userId ? 'Update Profile' : 'Create Profile')}
            </Button>
          </CardContent>
        </Card>

        {/* Fasting Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Fasting Preferences
            </CardTitle>
            <CardDescription>Used to generate your personalised fasting plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Activity className="size-3" /> Fasting Experience
              </Label>
              <Select
                value={fastingPrefs.experience_level}
                onValueChange={(v) => setFastingPrefsState({ ...fastingPrefs, experience_level: v as ExperienceLevel })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner — never fasted or tried briefly</SelectItem>
                  <SelectItem value="intermediate">Intermediate — fasted consistently for 1–3 months</SelectItem>
                  <SelectItem value="advanced">Advanced — fasted for 3+ months regularly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wake-time" className="flex items-center gap-1 text-sm">
                  <Clock className="size-3" /> Wake Time
                </Label>
                <Input
                  id="wake-time"
                  type="time"
                  value={fastingPrefs.wake_time}
                  onChange={(e) => setFastingPrefsState({ ...fastingPrefs, wake_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleep-time" className="flex items-center gap-1 text-sm">
                  <Clock className="size-3" /> Sleep Time
                </Label>
                <Input
                  id="sleep-time"
                  type="time"
                  value={fastingPrefs.sleep_time}
                  onChange={(e) => setFastingPrefsState({ ...fastingPrefs, sleep_time: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your fasting plan eating window will be scheduled around these times.
            </p>
          </CardContent>
        </Card>

        {targets && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Your Personalized Targets
              </CardTitle>
              <CardDescription>
                Calculated from your stats using the Mifflin-St Jeor equation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">TDEE</p>
                  <p className="text-2xl font-bold">{targets.tdee} kcal</p>
                  <p className="text-xs text-muted-foreground">Total Daily Energy Expenditure</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Target</p>
                  <p className="text-2xl font-bold text-primary">{targets.calorieTarget} kcal</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.goal === 'cut' ? '−500 deficit' : profile.goal === 'bulk' ? '+400 surplus' : 'Maintenance'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10">
                  <p className="text-xs text-blue-400 uppercase tracking-wider">Protein</p>
                  <p className="text-xl font-bold text-blue-500">{targets.proteinTarget}g</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10">
                  <p className="text-xs text-green-400 uppercase tracking-wider">Carbs</p>
                  <p className="text-xl font-bold text-green-500">{targets.carbsTarget}g</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10">
                  <p className="text-xs text-yellow-400 uppercase tracking-wider">Fat</p>
                  <p className="text-xl font-bold text-yellow-500">{targets.fatTarget}g</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10">
                  <p className="text-xs text-purple-400 uppercase tracking-wider">Goal</p>
                  <p className="text-xl font-bold text-purple-500 capitalize">{targets.goal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
