import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityCategory, ActivityLog } from "@/lib/database";
import { getDateString } from "@/lib/calculations";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ActivityLogFormProps {
  categories: ActivityCategory[];
  activities: ActivityLog[];
  onActivityLogged: (activity: ActivityLog) => void;
  onActivityUpdated: (activity: ActivityLog) => void;
  onActivityDeleted: (activityId: string) => void;
  selectedDate: Date;
}

export function ActivityLogForm({ 
  categories, 
  activities, 
  onActivityLogged, 
  onActivityUpdated, 
  onActivityDeleted, 
  selectedDate 
}: ActivityLogFormProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [energyLevel, setEnergyLevel] = useState<"High" | "Medium" | "Low">("Medium");
  const [editingActivity, setEditingActivity] = useState<ActivityLog | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setCategoryId("");
    setStartTime("");
    setEndTime("");
    setEnergyLevel("Medium");
    setEditingActivity(null);
  };

  const startEdit = (activity: ActivityLog) => {
    setEditingActivity(activity);
    setName(activity.name);
    setCategoryId(activity.categoryId);
    setStartTime(activity.startTime.toTimeString().slice(0, 5));
    setEndTime(activity.endTime.toTimeString().slice(0, 5));
    setEnergyLevel(activity.energyLevel);
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !categoryId || !startTime || !endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      toast({
        title: "Error",
        description: "Invalid category selected.",
        variant: "destructive"
      });
      return;
    }

    const start = new Date(selectedDate);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);

    const end = new Date(selectedDate);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    end.setHours(endHour, endMinute, 0, 0);

    if (end <= start) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }

    const duration = end.getTime() - start.getTime();
    const hours = duration / (1000 * 60 * 60);
    const points = hours * category.points;

    const activity: ActivityLog = {
      id: editingActivity?.id || crypto.randomUUID(),
      name,
      categoryId,
      startTime: start,
      endTime: end,
      duration,
      points,
      energyLevel,
      date: getDateString(selectedDate)
    };

    try {
      if (editingActivity) {
        await onActivityUpdated(activity);
        toast({
          title: "Activity Updated",
          description: `Successfully updated ${name}.`
        });
      } else {
        await onActivityLogged(activity);
        toast({
          title: "Activity Logged",
          description: `Successfully logged ${name} for ${(duration / (1000 * 60 * 60)).toFixed(1)} hours.`
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingActivity ? 'update' : 'log'} activity. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (activityId: string) => {
    try {
      await onActivityDeleted(activityId);
      toast({
        title: "Activity Deleted",
        description: "Activity has been successfully deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" />
            {editingActivity ? 'Edit Activity' : 'Log Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Activity Name</Label>
              <Input
                id="name"
                placeholder="e.g., Writing report, Code review"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name} ({category.points > 0 ? '+' : ''}{category.points} pts/hr)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="energyLevel">Energy Level</Label>
              <Select value={energyLevel} onValueChange={(value: "High" | "Medium" | "Low") => setEnergyLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High Energy</SelectItem>
                  <SelectItem value="Medium">Medium Energy</SelectItem>
                  <SelectItem value="Low">Low Energy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                {editingActivity ? 'Update Activity' : 'Log Activity'}
              </Button>
              {editingActivity && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                .map((activity) => {
                  const category = categories.find(cat => cat.id === activity.categoryId);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category?.color }}
                        />
                        <div>
                          <p className="font-medium text-sm">{activity.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.startTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })} - {activity.endTime.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })} • Energy: {activity.energyLevel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {activity.points > 0 ? '+' : ''}{activity.points.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(activity.duration / (1000 * 60 * 60)).toFixed(1)}h
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(activity)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{activity.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(activity.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities logged today</p>
              <p className="text-sm text-muted-foreground">Start by logging your first activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}