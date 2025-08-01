import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActivityLog, ActivityCategory, db } from "@/lib/database";
import { getDateString, formatTime } from "@/lib/calculations";
import { addWeeks, startOfWeek, format, addDays } from "date-fns";

interface WeeklyTimetableProps {
  categories: ActivityCategory[];
}

interface ActivityBlock {
  activity: ActivityLog;
  category: ActivityCategory;
  startHour: number;
  duration: number;
  top: number;
  height: number;
}

export function WeeklyTimetable({ categories }: WeeklyTimetableProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    loadWeekData();
  }, [currentWeek]);

  const loadWeekData = async () => {
    setLoading(true);
    try {
      const startDate = getDateString(weekStart);
      const endDate = getDateString(addDays(weekStart, 6));
      const weekActivities = await db.getActivitiesInRange(startDate, endDate);
      setActivities(weekActivities);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityBlocksForDay = (day: Date): ActivityBlock[] => {
    const dayString = getDateString(day);
    const dayActivities = activities.filter(activity => activity.date === dayString);
    
    return dayActivities.map(activity => {
      const category = categories.find(cat => cat.id === activity.categoryId);
      if (!category) return null;

      const startTime = new Date(activity.startTime);
      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
      const duration = activity.duration / 60; // Convert to hours
      
      return {
        activity,
        category,
        startHour,
        duration,
        top: startHour * 60, // 60px per hour
        height: Math.max(duration * 60, 30) // Minimum 30px height
      };
    }).filter(Boolean) as ActivityBlock[];
  };

  const getEnergyLevelIndicator = (energyLevel: string) => {
    switch (energyLevel) {
      case 'High': return '⚡';
      case 'Medium': return '🔋';
      case 'Low': return '🔋';
      default: return '';
    }
  };

  const getEnergyLevelBorder = (energyLevel: string) => {
    switch (energyLevel) {
      case 'High': return 'border-l-4 border-yellow-400';
      case 'Medium': return 'border-l-4 border-blue-400';
      case 'Low': return 'border-l-4 border-gray-400';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Timetable</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading week data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1 text-xs">
            {/* Time column */}
            <div className="space-y-1">
              <div className="h-8 flex items-center justify-center font-medium text-muted-foreground">
                Time
              </div>
              {hours.map(hour => (
                <div key={hour} className="h-[60px] flex items-start justify-center border-t border-border pt-1">
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIndex) => (
              <div key={dayIndex} className="relative">
                <div className="h-8 flex items-center justify-center font-medium border-b border-border">
                  <div className="text-center">
                    <div>{format(day, 'EEE')}</div>
                    <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
                  </div>
                </div>
                
                <div className="relative" style={{ height: 24 * 60 }}>
                  {/* Hour grid lines */}
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="absolute w-full h-[60px] border-t border-border/30"
                      style={{ top: hour * 60 }}
                    />
                  ))}
                  
                  {/* Activity blocks */}
                  {getActivityBlocksForDay(day).map((block, blockIndex) => (
                    <div
                      key={blockIndex}
                      className={`absolute w-full px-1 cursor-pointer group ${getEnergyLevelBorder(block.activity.energyLevel)}`}
                      style={{
                        top: block.top,
                        height: block.height,
                        backgroundColor: block.category.color + '20',
                        borderColor: block.category.color,
                      }}
                      title={`${block.activity.name} (${formatTime(new Date(block.activity.startTime))} - ${formatTime(new Date(block.activity.endTime))}) - ${block.activity.points} pts - Energy: ${block.activity.energyLevel}`}
                    >
                      <div 
                        className="h-full rounded px-1 py-1 text-[10px] font-medium overflow-hidden"
                        style={{ 
                          backgroundColor: block.category.color + '40',
                          color: block.category.color,
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <span className="truncate flex-1">
                            {block.activity.name}
                          </span>
                          <span className="ml-1">
                            {getEnergyLevelIndicator(block.activity.energyLevel)}
                          </span>
                        </div>
                        <div className="text-[9px] opacity-80">
                          {Math.round(block.duration * 60)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}