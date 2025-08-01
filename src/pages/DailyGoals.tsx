import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, Plus, Edit2, Save, X } from "lucide-react";
import { db, ActivityCategory } from "@/lib/database";
import { getDateString } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";

interface DailyGoal {
  id: string;
  categoryId: string;
  targetMinutes: number;
  date: string;
}

interface GoalProgress {
  goal: DailyGoal;
  category: ActivityCategory;
  actualMinutes: number;
  progressPercentage: number;
}

export function DailyGoals() {
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const categoriesData = await db.getCategories();
      setCategories(categoriesData);

      const dateString = getDateString(selectedDate);
      const storedGoals = JSON.parse(localStorage.getItem('dailyGoals') || '[]') as DailyGoal[];
      const todaysGoals = storedGoals.filter(goal => goal.date === dateString);
      setGoals(todaysGoals);

      // Calculate progress
      const activities = await db.getActivitiesByDate(dateString);
      const progress = todaysGoals.map(goal => {
        const category = categoriesData.find(cat => cat.id === goal.categoryId)!;
        const actualMinutes = activities
          .filter(activity => activity.categoryId === goal.categoryId)
          .reduce((sum, activity) => sum + activity.duration, 0) / 60000;
        
        return {
          goal,
          category,
          actualMinutes,
          progressPercentage: Math.min((actualMinutes / goal.targetMinutes) * 100, 100)
        };
      });
      setGoalProgress(progress);
    } catch (error) {
      console.error('Failed to load goals data:', error);
    }
  };

  const saveGoals = (updatedGoals: DailyGoal[]) => {
    const allGoals = JSON.parse(localStorage.getItem('dailyGoals') || '[]') as DailyGoal[];
    const dateString = getDateString(selectedDate);
    const otherGoals = allGoals.filter(goal => goal.date !== dateString);
    const newGoals = [...otherGoals, ...updatedGoals];
    localStorage.setItem('dailyGoals', JSON.stringify(newGoals));
    setGoals(updatedGoals);
    loadData();
  };

  const addGoal = (categoryId: string) => {
    const dateString = getDateString(selectedDate);
    const newGoal: DailyGoal = {
      id: crypto.randomUUID(),
      categoryId,
      targetMinutes: 60,
      date: dateString
    };
    const updatedGoals = [...goals, newGoal];
    saveGoals(updatedGoals);
    toast({
      title: "Goal Added",
      description: "Daily goal has been set successfully."
    });
  };

  const updateGoal = (goalId: string, targetMinutes: number) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, targetMinutes } : goal
    );
    saveGoals(updatedGoals);
    setIsEditing(null);
    toast({
      title: "Goal Updated",
      description: "Daily goal has been updated successfully."
    });
  };

  const removeGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveGoals(updatedGoals);
    toast({
      title: "Goal Removed",
      description: "Daily goal has been removed."
    });
  };

  const availableCategories = categories.filter(cat => 
    !goals.some(goal => goal.categoryId === cat.id)
  );

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Daily Goals
          </h1>
          <p className="text-muted-foreground">
            Set and track your daily time goals for {selectedDate.toLocaleDateString()}
          </p>
        </div>
        <input
          type="date"
          value={getDateString(selectedDate)}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="px-3 py-2 border rounded-md"
        />
      </div>

      {/* Current Goals */}
      <div className="grid gap-4">
        {goalProgress.map(({ goal, category, actualMinutes, progressPercentage }) => (
          <Card key={goal.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-semibold">{category.name}</h3>
                  <Badge variant={progressPercentage >= 100 ? "default" : "secondary"}>
                    {Math.round(actualMinutes)}min / {goal.targetMinutes}min
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing === goal.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20"
                        min="1"
                      />
                      <Button
                        size="sm"
                        onClick={() => updateGoal(goal.id, parseInt(editValue))}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(goal.id);
                          setEditValue(goal.targetMinutes.toString());
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeGoal(goal.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {progressPercentage.toFixed(1)}% complete
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Goal */}
      {availableCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableCategories.map(category => (
                <Button
                  key={category.id}
                  variant="outline"
                  onClick={() => addGoal(category.id)}
                  className="justify-start"
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}