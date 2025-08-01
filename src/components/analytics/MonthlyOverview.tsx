import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActivityLog, ActivityCategory, VitalityEntry, VitalityBonus, db } from "@/lib/database";
import { calculateDailyMetrics, getDateString } from "@/lib/calculations";
import { addMonths, startOfMonth, endOfMonth, format, addDays, isSameMonth } from "date-fns";

interface MonthlyOverviewProps {
  categories: ActivityCategory[];
  vitalityBonuses: VitalityBonus[];
}

interface DayData {
  date: Date;
  dateString: string;
  totalScore: number;
  isCurrentMonth: boolean;
  activities: ActivityLog[];
}

export function MonthlyOverview({ categories, vitalityBonuses }: MonthlyOverviewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Generate calendar grid (42 days including prev/next month)
  const calendarStart = addDays(monthStart, -monthStart.getDay()); // Sunday start
  const calendarDays = Array.from({ length: 42 }, (_, i) => addDays(calendarStart, i));

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const startDate = getDateString(calendarStart);
      const endDate = getDateString(addDays(calendarStart, 41));
      
      const [activities, vitalityEntries] = await Promise.all([
        db.getActivitiesInRange(startDate, endDate),
        db.getVitalityEntriesInRange(startDate, endDate)
      ]);

      const dayDataMap = new Map<string, DayData>();
      
      // Initialize all days
      calendarDays.forEach(day => {
        const dateString = getDateString(day);
        dayDataMap.set(dateString, {
          date: day,
          dateString,
          totalScore: 0,
          isCurrentMonth: isSameMonth(day, currentMonth),
          activities: []
        });
      });

      // Group activities by date and calculate scores
      activities.forEach(activity => {
        const dayData = dayDataMap.get(activity.date);
        if (dayData) {
          dayData.activities.push(activity);
        }
      });

      // Calculate daily metrics for each day
      dayDataMap.forEach(dayData => {
        if (dayData.activities.length > 0) {
          const metrics = calculateDailyMetrics(
            dayData.activities,
            categories,
            vitalityEntries.filter(entry => entry.date === dayData.dateString),
            vitalityBonuses
          );
          dayData.totalScore = metrics.totalScore;
        }
      });

      setMonthData(Array.from(dayDataMap.values()));
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 20) return 'bg-emerald-500';
    if (score >= 15) return 'bg-green-500';
    if (score >= 10) return 'bg-yellow-500';
    if (score >= 5) return 'bg-orange-500';
    if (score > 0) return 'bg-red-500';
    return 'bg-gray-300';
  };

  const getScoreOpacity = (score: number) => {
    if (score >= 20) return 'opacity-100';
    if (score >= 15) return 'opacity-80';
    if (score >= 10) return 'opacity-60';
    if (score >= 5) return 'opacity-40';
    if (score > 0) return 'opacity-30';
    return 'opacity-10';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Overview</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Loading month data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">Daily Score:</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-300 opacity-10 rounded"></div>
                  <span>0</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 opacity-30 rounded"></div>
                  <span>1-4</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 opacity-40 rounded"></div>
                  <span>5-9</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 opacity-60 rounded"></div>
                  <span>10-14</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 opacity-80 rounded"></div>
                  <span>15-19</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 opacity-100 rounded"></div>
                  <span>20+</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {monthData.map((dayData, index) => (
                  <div
                    key={index}
                    className={`
                      relative aspect-square border border-border rounded cursor-pointer transition-all hover:border-primary
                      ${dayData.isCurrentMonth ? '' : 'opacity-40'}
                      ${selectedDay?.dateString === dayData.dateString ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setSelectedDay(dayData)}
                  >
                    <div className="p-1 h-full flex flex-col">
                      <div className="text-xs font-medium mb-1">
                        {format(dayData.date, 'd')}
                      </div>
                      {dayData.totalScore > 0 && (
                        <div 
                          className={`
                            flex-1 rounded text-white text-xs flex items-center justify-center font-medium
                            ${getScoreColor(dayData.totalScore)} ${getScoreOpacity(dayData.totalScore)}
                          `}
                        >
                          {dayData.totalScore}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Detail */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDay.date, 'EEEE, MMMM d, yyyy')} - Score: {selectedDay.totalScore}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDay.activities.length > 0 ? (
              <div className="space-y-2">
                {selectedDay.activities.map((activity, index) => {
                  const category = categories.find(cat => cat.id === activity.categoryId);
                  return (
                    <div key={index} className="flex items-center gap-3 p-2 border border-border rounded">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category?.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{activity.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {category?.name} • {activity.duration}m • {activity.points} pts • Energy: {activity.energyLevel}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No activities logged for this day.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}