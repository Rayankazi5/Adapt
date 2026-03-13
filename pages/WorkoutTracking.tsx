import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { WorkoutPrograms } from '../components/workout/WorkoutPrograms';
import { ActiveWorkout } from '../components/workout/ActiveWorkout';
import { WorkoutAnalytics } from '../components/workout/WorkoutAnalytics';
import { ExerciseLibrary } from '../components/workout/ExerciseLibrary';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets?: number;
  reps?: number;
  weight?: number;
  completed?: boolean;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  type: 'ppl' | 'fullbody' | 'brosplit' | 'custom' | 'suggested';
  description: string;
  exercises: Exercise[];
  duration?: number; // in minutes
}

export function WorkoutTracking() {
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const handleStartWorkout = (program: WorkoutProgram) => {
    setActiveProgram(program);
    setIsWorkoutActive(true);
  };

  const handleEndWorkout = () => {
    setIsWorkoutActive(false);
    // Keep activeProgram for history
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Workout Tracking</h2>
          <p className="text-muted-foreground">
            Plan your workouts, track progress, and optimize your training
          </p>
        </div>

        {isWorkoutActive && activeProgram ? (
          <ActiveWorkout 
            program={activeProgram} 
            onEndWorkout={handleEndWorkout}
          />
        ) : (
          <Tabs defaultValue="programs" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="exercises">Exercise Library</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="programs">
              <WorkoutPrograms onStartWorkout={handleStartWorkout} />
            </TabsContent>

            <TabsContent value="exercises">
              <ExerciseLibrary />
            </TabsContent>

            <TabsContent value="analytics">
              <WorkoutAnalytics />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
