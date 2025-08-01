import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityCategory, ActivityLog } from "@/lib/database";
import { getDateString, parseTimeToMinutes, minutesToTimeString } from "@/lib/calculations";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityLogFormProps {
  categories: ActivityCategory[];
  onActivityLogged: (activity: ActivityLog) => void;
  selectedDate?: Date;
}

export function ActivityLogForm({ categories, onActivityLogged, selectedDate = new Date() }: ActivityLogFormProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [energyLevel, setEnergyLevel] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !categoryId || !startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive"
      });
      return;
    }

    const duration = endMinutes - startMinutes;
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) {
      toast({
        title: "Invalid Category",
        description: "Please select a valid category.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
      
      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

      const activity: ActivityLog = {
        id: crypto.randomUUID(),
        name,
        categoryId,
        startTime: startDateTime,
        endTime: endDateTime,
        date: getDateString(selectedDate),
        energyLevel,
        duration,
        points: category.points * (duration / 60) // Points per hour
      };

      await onActivityLogged(activity);
      
      // Reset form
      setName("");
      setCategoryId("");
      setStartTime("");
      setEndTime("");
      setEnergyLevel('Medium');

      toast({
        title: "Activity Logged",
        description: `${name} has been logged successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log activity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Log Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity Name</Label>
            <Input
              id="activity-name"
              placeholder="e.g., Writing report, Reading emails"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="energy-level">Energy Level</Label>
            <Select value={energyLevel} onValueChange={(value: 'High' | 'Medium' | 'Low') => setEnergyLevel(value)}>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging..." : "Log Activity"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}