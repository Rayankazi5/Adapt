import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Search, 
  Dumbbell,
  Filter,
  BookOpen,
  Info
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';

interface ExerciseData {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions?: string;
  isCustom?: boolean;
}

export function ExerciseLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscleGroup, setFilterMuscleGroup] = useState('all');
  const [filterEquipment, setFilterEquipment] = useState('all');

  const [exercises, setExercises] = useState<ExerciseData[]>([
    { id: '1', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate' },
    { id: '2', name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate' },
    { id: '3', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Advanced' },
    { id: '4', name: 'Pull-ups', muscleGroup: 'Back', equipment: 'Bodyweight', difficulty: 'Intermediate' },
    { id: '5', name: 'Shoulder Press', muscleGroup: 'Shoulders', equipment: 'Barbell', difficulty: 'Intermediate' },
    { id: '6', name: 'Bicep Curl', muscleGroup: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner' },
    { id: '7', name: 'Tricep Dips', muscleGroup: 'Arms', equipment: 'Bodyweight', difficulty: 'Intermediate' },
    { id: '8', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', difficulty: 'Beginner' },
    { id: '9', name: 'Lateral Raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner' },
    { id: '10', name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate' },
    { id: '11', name: 'Cable Flyes', muscleGroup: 'Chest', equipment: 'Cable', difficulty: 'Intermediate' },
    { id: '12', name: 'Face Pulls', muscleGroup: 'Back', equipment: 'Cable', difficulty: 'Beginner' },
    { id: '13', name: 'Hammer Curl', muscleGroup: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner' },
    { id: '14', name: 'Leg Curl', muscleGroup: 'Legs', equipment: 'Machine', difficulty: 'Beginner' },
    { id: '15', name: 'Push-ups', muscleGroup: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner' },
    { id: '16', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner' },
    { id: '17', name: 'Russian Twists', muscleGroup: 'Core', equipment: 'Bodyweight', difficulty: 'Intermediate' },
    { id: '18', name: 'Calf Raises', muscleGroup: 'Legs', equipment: 'Machine', difficulty: 'Beginner' },
    { id: '19', name: 'Lunges', muscleGroup: 'Legs', equipment: 'Bodyweight', difficulty: 'Beginner' },
    { id: '20', name: 'Bent Over Row', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Intermediate' },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroup: '',
    equipment: '',
    difficulty: 'Beginner' as ExerciseData['difficulty'],
    instructions: '',
  });

  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];
  const equipmentTypes = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight'];

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = filterMuscleGroup === 'all' || exercise.muscleGroup === filterMuscleGroup;
    const matchesEquipment = filterEquipment === 'all' || exercise.equipment === filterEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const handleAddExercise = () => {
    if (!newExercise.name || !newExercise.muscleGroup || !newExercise.equipment) {
      toast.error('Please fill in all required fields');
      return;
    }

    const exercise: ExerciseData = {
      id: Date.now().toString(),
      ...newExercise,
      isCustom: true,
    };

    setExercises([...exercises, exercise]);
    setNewExercise({
      name: '',
      muscleGroup: '',
      equipment: '',
      difficulty: 'Beginner',
      instructions: '',
    });
    setIsAddDialogOpen(false);
    toast.success('Custom exercise added!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5" />
                Exercise Library
              </CardTitle>
              <CardDescription>
                Browse {exercises.length} exercises or create custom ones
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add Custom Exercise
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Exercise</DialogTitle>
                  <DialogDescription>
                    Create a new exercise for your workout library
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="exercise-name">Exercise Name *</Label>
                    <Input
                      id="exercise-name"
                      placeholder="e.g., Weighted Pull-ups"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="muscle-group">Muscle Group *</Label>
                      <Select
                        value={newExercise.muscleGroup}
                        onValueChange={(value) => setNewExercise({ ...newExercise, muscleGroup: value })}
                      >
                        <SelectTrigger id="muscle-group">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {muscleGroups.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="equipment">Equipment *</Label>
                      <Select
                        value={newExercise.equipment}
                        onValueChange={(value) => setNewExercise({ ...newExercise, equipment: value })}
                      >
                        <SelectTrigger id="equipment">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={newExercise.difficulty}
                      onValueChange={(value) => setNewExercise({ ...newExercise, difficulty: value as ExerciseData['difficulty'] })}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions (Optional)</Label>
                    <Textarea
                      id="instructions"
                      placeholder="Describe how to perform this exercise..."
                      value={newExercise.instructions}
                      onChange={(e) => setNewExercise({ ...newExercise, instructions: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleAddExercise} className="w-full">
                    Add Exercise
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-muscle">Muscle Group</Label>
              <Select value={filterMuscleGroup} onValueChange={setFilterMuscleGroup}>
                <SelectTrigger id="filter-muscle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {muscleGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-equipment">Equipment</Label>
              <Select value={filterEquipment} onValueChange={setFilterEquipment}>
                <SelectTrigger id="filter-equipment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Equipment</SelectItem>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Dumbbell className="size-4" />
                  {exercise.name}
                </CardTitle>
                {exercise.isCustom && (
                  <Badge variant="secondary">Custom</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{exercise.muscleGroup}</Badge>
                  <Badge variant="outline">{exercise.equipment}</Badge>
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty}
                  </Badge>
                </div>
                
                {exercise.instructions && (
                  <div className="text-sm text-muted-foreground">
                    <Info className="size-3 inline mr-1" />
                    {exercise.instructions.slice(0, 80)}
                    {exercise.instructions.length > 80 && '...'}
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <Dumbbell className="size-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">
            No exercises found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}
