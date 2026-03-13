import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Dumbbell, 
  Clock, 
  Zap, 
  Target, 
  Users, 
  Plus,
  Play,
  ChevronRight,
  Info
} from 'lucide-react';
import { WorkoutProgram } from '../../pages/WorkoutTracking';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface WorkoutProgramsProps {
  onStartWorkout: (program: WorkoutProgram) => void;
}

export function WorkoutPrograms({ onStartWorkout }: WorkoutProgramsProps) {
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [customPrograms, setCustomPrograms] = useState<WorkoutProgram[]>([]);
  const [targetMuscle, setTargetMuscle] = useState<string>('fullbody');
  const [difficultyLevel, setDifficultyLevel] = useState<string>('intermediate');

  // Predefined workout programs
  const pplProgram: WorkoutProgram[] = [
    {
      id: 'ppl-push',
      name: 'Push Day',
      type: 'ppl',
      description: 'Chest, Shoulders, Triceps',
      duration: 60,
      exercises: [
        { id: '1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '2', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10 },
        { id: '3', name: 'Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '4', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
        { id: '5', name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', sets: 3, reps: 10 },
        { id: '6', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      ],
    },
    {
      id: 'ppl-pull',
      name: 'Pull Day',
      type: 'ppl',
      description: 'Back, Biceps',
      duration: 60,
      exercises: [
        { id: '7', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 6 },
        { id: '8', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', sets: 4, reps: 8 },
        { id: '9', name: 'Bent Over Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '10', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 15 },
        { id: '11', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 3, reps: 10 },
        { id: '12', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      ],
    },
    {
      id: 'ppl-legs',
      name: 'Leg Day',
      type: 'ppl',
      description: 'Quads, Hamstrings, Glutes, Calves',
      duration: 60,
      exercises: [
        { id: '13', name: 'Squat', muscleGroup: 'Quads', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '14', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 4, reps: 10 },
        { id: '15', name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', sets: 3, reps: 12 },
        { id: '16', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: 12 },
        { id: '17', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', sets: 4, reps: 15 },
        { id: '18', name: 'Bulgarian Split Squat', muscleGroup: 'Quads', equipment: 'Dumbbell', sets: 3, reps: 10 },
      ],
    },
  ];

  const fullBodyProgram: WorkoutProgram = {
    id: 'fullbody-1',
    name: 'Full Body Workout',
    type: 'fullbody',
    description: 'Complete full body routine',
    duration: 60,
    exercises: [
      { id: '19', name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '20', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '21', name: 'Bent Over Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
      { id: '22', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 3, reps: 10 },
      { id: '23', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 3, reps: 10 },
      { id: '24', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 60 },
    ],
  };

  const broSplitPrograms: WorkoutProgram[] = [
    {
      id: 'bro-chest',
      name: 'Chest Day',
      type: 'brosplit',
      description: 'Focused chest training',
      duration: 45,
      exercises: [
        { id: '25', name: 'Flat Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '26', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 4, reps: 10 },
        { id: '27', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', sets: 3, reps: 12 },
        { id: '28', name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10 },
      ],
    },
    {
      id: 'bro-back',
      name: 'Back Day',
      type: 'brosplit',
      description: 'Focused back training',
      duration: 45,
      exercises: [
        { id: '29', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 6 },
        { id: '30', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', sets: 4, reps: 8 },
        { id: '31', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '32', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12 },
      ],
    },
    {
      id: 'bro-legs',
      name: 'Leg Day',
      type: 'brosplit',
      description: 'Focused leg training',
      duration: 60,
      exercises: [
        { id: '33', name: 'Squat', muscleGroup: 'Quads', equipment: 'Barbell', sets: 5, reps: 6 },
        { id: '34', name: 'Leg Press', muscleGroup: 'Quads', equipment: 'Machine', sets: 4, reps: 10 },
        { id: '35', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 4, reps: 12 },
        { id: '36', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', sets: 4, reps: 15 },
      ],
    },
    {
      id: 'bro-shoulders',
      name: 'Shoulder Day',
      type: 'brosplit',
      description: 'Focused shoulder training',
      duration: 45,
      exercises: [
        { id: '37', name: 'Military Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 8 },
        { id: '38', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 12 },
        { id: '39', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15 },
        { id: '40', name: 'Shrugs', muscleGroup: 'Traps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      ],
    },
    {
      id: 'bro-arms',
      name: 'Arm Day',
      type: 'brosplit',
      description: 'Biceps and Triceps',
      duration: 45,
      exercises: [
        { id: '41', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 10 },
        { id: '42', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', sets: 4, reps: 10 },
        { id: '43', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
        { id: '44', name: 'Overhead Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
      ],
    },
  ];

  const getSuggestedWorkout = () => {
    // Exercise database organized by muscle group
    const exerciseDatabase = {
      fullbody: {
        beginner: [
          { id: 'fb1', name: 'Bodyweight Squats', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 12 },
          { id: 'fb2', name: 'Push-ups (Knees OK)', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10 },
          { id: 'fb3', name: 'Bent Over Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'fb4', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'fb5', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 30 },
        ],
        intermediate: [
          { id: 'fb6', name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'fb7', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'fb8', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'fb9', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 3, reps: 10 },
          { id: 'fb10', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 3, reps: 10 },
          { id: 'fb11', name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 12 },
        ],
        advanced: [
          { id: 'fb12', name: 'Back Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'fb13', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'fb14', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'fb15', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 6 },
          { id: 'fb16', name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 6 },
          { id: 'fb17', name: 'Weighted Pull-ups', muscleGroup: 'Back', equipment: 'Weighted', sets: 4, reps: 8 },
        ],
      },
      chest: {
        beginner: [
          { id: 'ch1', name: 'Push-ups', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 12 },
          { id: 'ch2', name: 'Dumbbell Chest Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'ch3', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'ch4', name: 'Dumbbell Flyes', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 3, reps: 12 },
        ],
        intermediate: [
          { id: 'ch5', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'ch6', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell', sets: 4, reps: 10 },
          { id: 'ch7', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', sets: 3, reps: 12 },
          { id: 'ch8', name: 'Dips', muscleGroup: 'Chest', equipment: 'Bodyweight', sets: 3, reps: 10 },
          { id: 'ch9', name: 'Decline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 3, reps: 10 },
        ],
        advanced: [
          { id: 'ch10', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'ch11', name: 'Weighted Dips', muscleGroup: 'Chest', equipment: 'Weighted', sets: 4, reps: 8 },
          { id: 'ch12', name: 'Incline Barbell Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 6 },
          { id: 'ch13', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', sets: 4, reps: 12 },
          { id: 'ch14', name: 'Decline Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 4, reps: 8 },
        ],
      },
      back: {
        beginner: [
          { id: 'bk1', name: 'Assisted Pull-ups', muscleGroup: 'Back', equipment: 'Machine', sets: 3, reps: 10 },
          { id: 'bk2', name: 'Dumbbell Row', muscleGroup: 'Back', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'bk3', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12 },
          { id: 'bk4', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 15 },
        ],
        intermediate: [
          { id: 'bk5', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', sets: 4, reps: 8 },
          { id: 'bk6', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'bk7', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 12 },
          { id: 'bk8', name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 3, reps: 10 },
          { id: 'bk9', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', sets: 3, reps: 15 },
        ],
        advanced: [
          { id: 'bk10', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'bk11', name: 'Weighted Pull-ups', muscleGroup: 'Back', equipment: 'Weighted', sets: 4, reps: 6 },
          { id: 'bk12', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'bk13', name: 'T-Bar Row', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'bk14', name: 'Rack Pulls', muscleGroup: 'Back', equipment: 'Barbell', sets: 4, reps: 6 },
        ],
      },
      legs: {
        beginner: [
          { id: 'lg1', name: 'Bodyweight Squats', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 15 },
          { id: 'lg2', name: 'Lunges', muscleGroup: 'Legs', equipment: 'Bodyweight', sets: 3, reps: 12 },
          { id: 'lg3', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', sets: 3, reps: 12 },
          { id: 'lg4', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: 12 },
          { id: 'lg5', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Bodyweight', sets: 3, reps: 15 },
        ],
        intermediate: [
          { id: 'lg6', name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'lg7', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 4, reps: 10 },
          { id: 'lg8', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', sets: 3, reps: 12 },
          { id: 'lg9', name: 'Leg Curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: 12 },
          { id: 'lg10', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'lg11', name: 'Calf Raises', muscleGroup: 'Calves', equipment: 'Machine', sets: 4, reps: 15 },
        ],
        advanced: [
          { id: 'lg12', name: 'Barbell Back Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'lg13', name: 'Front Squat', muscleGroup: 'Legs', equipment: 'Barbell', sets: 4, reps: 6 },
          { id: 'lg14', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'lg15', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 4, reps: 8 },
          { id: 'lg16', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', sets: 4, reps: 10 },
          { id: 'lg17', name: 'Walking Lunges', muscleGroup: 'Legs', equipment: 'Dumbbell', sets: 4, reps: 12 },
        ],
      },
      shoulders: {
        beginner: [
          { id: 'sh1', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10 },
          { id: 'sh2', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
          { id: 'sh3', name: 'Front Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
          { id: 'sh4', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15 },
        ],
        intermediate: [
          { id: 'sh5', name: 'Barbell Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'sh6', name: 'Dumbbell Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 12 },
          { id: 'sh7', name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 12 },
          { id: 'sh8', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 3, reps: 15 },
          { id: 'sh9', name: 'Arnold Press', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 3, reps: 10 },
        ],
        advanced: [
          { id: 'sh10', name: 'Military Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 5, reps: 5 },
          { id: 'sh11', name: 'Push Press', muscleGroup: 'Shoulders', equipment: 'Barbell', sets: 4, reps: 6 },
          { id: 'sh12', name: 'Dumbbell Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 15 },
          { id: 'sh13', name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', equipment: 'Dumbbell', sets: 4, reps: 12 },
          { id: 'sh14', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', sets: 4, reps: 20 },
        ],
      },
      arms: {
        beginner: [
          { id: 'ar1', name: 'Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
          { id: 'ar2', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', sets: 3, reps: 12 },
          { id: 'ar3', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
          { id: 'ar4', name: 'Overhead Tricep Extension', muscleGroup: 'Triceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
        ],
        intermediate: [
          { id: 'ar5', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 10 },
          { id: 'ar6', name: 'Close Grip Bench Press', muscleGroup: 'Triceps', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'ar7', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
          { id: 'ar8', name: 'Tricep Dips', muscleGroup: 'Triceps', equipment: 'Bodyweight', sets: 3, reps: 10 },
          { id: 'ar9', name: 'Cable Curl', muscleGroup: 'Biceps', equipment: 'Cable', sets: 3, reps: 12 },
        ],
        advanced: [
          { id: 'ar10', name: 'Barbell Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 8 },
          { id: 'ar11', name: 'Weighted Dips', muscleGroup: 'Triceps', equipment: 'Weighted', sets: 4, reps: 8 },
          { id: 'ar12', name: 'Preacher Curl', muscleGroup: 'Biceps', equipment: 'Barbell', sets: 4, reps: 10 },
          { id: 'ar13', name: 'Skull Crushers', muscleGroup: 'Triceps', equipment: 'Barbell', sets: 4, reps: 10 },
          { id: 'ar14', name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', sets: 3, reps: 12 },
        ],
      },
      core: {
        beginner: [
          { id: 'co1', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 30 },
          { id: 'co2', name: 'Crunches', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 15 },
          { id: 'co3', name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 12 },
          { id: 'co4', name: 'Bird Dog', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 10 },
        ],
        intermediate: [
          { id: 'co5', name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 4, reps: 12 },
          { id: 'co6', name: 'Cable Crunches', muscleGroup: 'Core', equipment: 'Cable', sets: 3, reps: 15 },
          { id: 'co7', name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 20 },
          { id: 'co8', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 60 },
          { id: 'co9', name: 'Mountain Climbers', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 20 },
        ],
        advanced: [
          { id: 'co10', name: 'Hanging Leg Raises', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 4, reps: 15 },
          { id: 'co11', name: 'Ab Wheel Rollouts', muscleGroup: 'Core', equipment: 'Ab Wheel', sets: 4, reps: 12 },
          { id: 'co12', name: 'Dragon Flags', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 8 },
          { id: 'co13', name: 'Weighted Cable Crunches', muscleGroup: 'Core', equipment: 'Cable', sets: 4, reps: 15 },
          { id: 'co14', name: 'L-Sit Hold', muscleGroup: 'Core', equipment: 'Bodyweight', sets: 3, reps: 30 },
        ],
      },
      cardio: {
        beginner: [
          { id: 'cd1', name: 'Walking', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 1, reps: 20 },
          { id: 'cd2', name: 'Jumping Jacks', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 20 },
          { id: 'cd3', name: 'Step-ups', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 15 },
          { id: 'cd4', name: 'March in Place', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 3, reps: 30 },
        ],
        intermediate: [
          { id: 'cd5', name: 'Jump Rope', muscleGroup: 'Cardio', equipment: 'Jump Rope', sets: 4, reps: 60 },
          { id: 'cd6', name: 'Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 4, reps: 10 },
          { id: 'cd7', name: 'High Knees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 4, reps: 30 },
          { id: 'cd8', name: 'Mountain Climbers', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 4, reps: 20 },
        ],
        advanced: [
          { id: 'cd9', name: 'Sprints', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 6, reps: 30 },
          { id: 'cd10', name: 'Burpees', muscleGroup: 'Cardio', equipment: 'Bodyweight', sets: 5, reps: 15 },
          { id: 'cd11', name: 'Box Jumps', muscleGroup: 'Cardio', equipment: 'Box', sets: 4, reps: 12 },
          { id: 'cd12', name: 'Battle Ropes', muscleGroup: 'Cardio', equipment: 'Battle Ropes', sets: 4, reps: 30 },
        ],
      },
    };

    // Get exercises based on selections
    const selectedExercises = exerciseDatabase[targetMuscle as keyof typeof exerciseDatabase]?.[difficultyLevel as keyof typeof exerciseDatabase.fullbody] || [];
    
    // Calculate number of exercises based on time limit
    // Assume ~5 minutes per exercise (including rest)
    const maxExercises = Math.floor(timeLimit / 5);
    const exercises = selectedExercises.slice(0, Math.max(3, Math.min(maxExercises, selectedExercises.length)));

    // Create descriptive name
    const muscleNames = {
      fullbody: 'Full Body',
      chest: 'Chest',
      back: 'Back',
      legs: 'Legs',
      shoulders: 'Shoulders',
      arms: 'Arms',
      core: 'Core',
      cardio: 'Cardio'
    };

    const difficultyNames = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };

    return {
      id: 'suggested-custom',
      name: `${muscleNames[targetMuscle as keyof typeof muscleNames]} Workout - ${difficultyNames[difficultyLevel as keyof typeof difficultyNames]}`,
      type: 'suggested' as const,
      description: `${timeLimit} min ${difficultyNames[difficultyLevel as keyof typeof difficultyNames]} level ${muscleNames[targetMuscle as keyof typeof muscleNames].toLowerCase()} workout`,
      duration: timeLimit,
      exercises: exercises,
    };
  };

  const ProgramCard = ({ program }: { program: WorkoutProgram }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="size-5" />
              {program.name}
            </CardTitle>
            <CardDescription className="mt-1">{program.description}</CardDescription>
          </div>
          <Badge variant="outline">{program.type.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {program.duration} minutes
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="size-4" />
            {program.exercises.length} exercises
          </div>
          <Button onClick={() => onStartWorkout(program)} className="w-full mt-2">
            <Play className="size-4 mr-2" />
            Start Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Suggested Workout Based on Time */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            Suggested Workout
          </CardTitle>
          <CardDescription>Get a workout tailored to your available time and goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="time-limit">How much time do you have? (minutes)</Label>
            <Input
              id="time-limit"
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              min={15}
              max={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-muscle">What do you wanna train?</Label>
            <Select value={targetMuscle} onValueChange={setTargetMuscle}>
              <SelectTrigger id="target-muscle">
                <SelectValue placeholder="Select target muscle group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fullbody">Full Body</SelectItem>
                <SelectItem value="chest">Chest</SelectItem>
                <SelectItem value="back">Back</SelectItem>
                <SelectItem value="legs">Legs</SelectItem>
                <SelectItem value="shoulders">Shoulders</SelectItem>
                <SelectItem value="arms">Arms (Biceps & Triceps)</SelectItem>
                <SelectItem value="core">Core / Abs</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Difficulty Level</Label>
            <RadioGroup value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="beginner" className="cursor-pointer font-medium">
                      Beginner
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      New to fitness. Focus on learning proper form with lighter weights and basic movements.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="intermediate" className="cursor-pointer font-medium">
                      Intermediate
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      6+ months of consistent training. Comfortable with compound movements and moderate weights.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="advanced" className="cursor-pointer font-medium">
                      Advanced
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      2+ years of training. Strong technique, pushing heavy weights with advanced exercises.
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={() => onStartWorkout(getSuggestedWorkout())} className="w-full">
            <Zap className="size-4 mr-2" />
            Get Suggested Workout
          </Button>
        </CardContent>
      </Card>

      {/* Workout Programs Tabs */}
      <Tabs defaultValue="ppl" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ppl">Push/Pull/Legs</TabsTrigger>
          <TabsTrigger value="fullbody">Full Body</TabsTrigger>
          <TabsTrigger value="brosplit">Bro Split</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="ppl" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Classic 3-day split focusing on push muscles, pull muscles, and legs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pplProgram.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fullbody" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Complete full body workout hitting all major muscle groups
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ProgramCard program={fullBodyProgram} />
          </div>
        </TabsContent>

        <TabsContent value="brosplit" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            5-day split focusing on one muscle group per day
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {broSplitPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create your own custom workout programs
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Program</CardTitle>
              <CardDescription>
                Build a personalized workout from the exercise library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="size-4 mr-2" />
                Create New Program
              </Button>
            </CardContent>
          </Card>
          
          {customPrograms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="size-12 mx-auto mb-2 opacity-50" />
              <p>No custom programs yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}