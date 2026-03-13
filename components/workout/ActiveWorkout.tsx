import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { 
  Check, 
  X, 
  Timer, 
  Dumbbell,
  ChevronRight,
  Trophy,
  Flame
} from 'lucide-react';
import { WorkoutProgram, Exercise } from '../../pages/WorkoutTracking';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';

interface ActiveWorkoutProps {
  program: WorkoutProgram;
  onEndWorkout: () => void;
}

export function ActiveWorkout({ program, onEndWorkout }: ActiveWorkoutProps) {
  const [exercises, setExercises] = useState<Exercise[]>(
    program.exercises.map(ex => ({ ...ex, completed: false, weight: 0 }))
  );
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteExercise = () => {
    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex].completed = true;
    setExercises(updatedExercises);
    
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      toast.success('Exercise completed! Moving to next.');
    } else {
      toast.success('Workout complete! Great job! 💪');
    }
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      toast('Exercise skipped');
    }
  };

  const handleUpdateWeight = (exerciseId: string, weight: number) => {
    setExercises(exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, weight } : ex
    ));
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const progress = (completedCount / exercises.length) * 100;
  const currentExercise = exercises[currentExerciseIndex];
  const isWorkoutComplete = completedCount === exercises.length;

  // Estimate calories burned (rough approximation: 5 kcal per minute of resistance training)
  const estimatedCalories = Math.round((elapsedTime / 60) * 5);

  const handleFinishWorkout = () => {
    setIsTimerRunning(false);
    toast.success(`Workout completed! You burned ~${estimatedCalories} calories!`);
    setTimeout(() => {
      onEndWorkout();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="size-6 text-primary" />
                {program.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Timer className="size-5" />
                {formatTime(elapsedTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                ~{estimatedCalories} kcal burned
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">
                {completedCount} / {exercises.length} exercises
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      {!isWorkoutComplete ? (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Exercise</CardTitle>
              <Badge>
                {currentExerciseIndex + 1} of {exercises.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">{currentExercise.name}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {currentExercise.muscleGroup}
                </Badge>
                <Badge variant="outline">
                  {currentExercise.equipment}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sets</p>
                <p className="text-2xl font-bold">{currentExercise.sets}</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Reps</p>
                <p className="text-2xl font-bold">{currentExercise.reps}</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Weight (kg)</p>
                <Input
                  type="number"
                  value={currentExercise.weight || ''}
                  onChange={(e) => handleUpdateWeight(currentExercise.id, Number(e.target.value))}
                  className="text-center text-xl font-bold h-auto p-1 mt-1"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSkipExercise}
              >
                <X className="size-4 mr-2" />
                Skip
              </Button>
              <Button
                className="flex-1"
                onClick={handleCompleteExercise}
              >
                <Check className="size-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Trophy className="size-16 mx-auto text-green-600" />
              <div>
                <h3 className="text-2xl font-bold">Workout Complete!</h3>
                <p className="text-muted-foreground mt-1">
                  Great job! You completed all exercises.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-xl font-bold">{formatTime(elapsedTime)}</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground">Calories</p>
                  <p className="text-xl font-bold flex items-center justify-center gap-1">
                    <Flame className="size-5 text-orange-500" />
                    {estimatedCalories}
                  </p>
                </div>
              </div>
              <Button onClick={handleFinishWorkout} size="lg" className="mt-4">
                Finish Workout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>Exercise List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  exercise.completed
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                    : index === currentExerciseIndex
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-accent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-full flex items-center justify-center ${
                    exercise.completed
                      ? 'bg-green-500 text-white'
                      : index === currentExerciseIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {exercise.completed ? (
                      <Check className="size-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>
                </div>
                {index === currentExerciseIndex && !exercise.completed && (
                  <Badge>In Progress</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
