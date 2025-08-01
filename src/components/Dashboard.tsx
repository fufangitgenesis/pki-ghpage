import { useState, useEffect } from "react";
import { KPICard } from "./KPICard";
import { ActivityLogForm } from "./ActivityLogForm";
import { VitalityChecklist } from "./VitalityChecklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  db, 
  ActivityCategory, 
  VitalityBonus, 
  ActivityLog, 
  VitalityEntry 
} from "@/lib/database";
import { 
  calculateDailyMetrics, 
  formatDuration, 
  getDateString,
  DailyMetrics 
} from "@/lib/calculations";
import { 
  Target, 
  Brain, 
  Zap, 
  Clock, 
  TrendingUp,
  Calendar,
  BarChart3,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [vitalityBonuses, setVitalityBonuses] = useState<VitalityBonus[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [vitalityEntries, setVitalityEntries] = useState<VitalityEntry[]>([]);
  const [metrics, setMetrics] = useState<DailyMetrics>({
    totalScore: 0,
    focusRatio: 0,
    distractionRatio: 0,
    productivityThroughput: 0,
    totalTimeLogged: 0,
    energyFocusCorrelation: { high: 0, medium: 0, low: 0 }
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadDayData();
    }
  }, [selectedDate, isLoading]);

  const initializeData = async () => {
    try {
      await db.init();
      await db.initializeDefaultData();
      
      const [categoriesData, vitalityData] = await Promise.all([
        db.getCategories(),
        db.getVitalityBonuses()
      ]);
      
      setCategories(categoriesData);
      setVitalityBonuses(vitalityData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      toast({
        title: "Database Error",
        description: "Failed to initialize the application. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const loadDayData = async () => {
    try {
      const dateString = getDateString(selectedDate);
      const [activitiesData, vitalityData] = await Promise.all([
        db.getActivitiesByDate(dateString),
        db.getVitalityEntriesByDate(dateString)
      ]);
      
      setActivities(activitiesData);
      setVitalityEntries(vitalityData);
      
      const dailyMetrics = calculateDailyMetrics(
        activitiesData,
        categories,
        vitalityData,
        vitalityBonuses
      );
      setMetrics(dailyMetrics);
    } catch (error) {
      console.error('Failed to load day data:', error);
      toast({
        title: "Error",
        description: "Failed to load daily data.",
        variant: "destructive"
      });
    }
  };

  const handleActivityLogged = async (activity: ActivityLog) => {
    try {
      await db.addActivity(activity);
      await loadDayData();
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  };

  const handleVitalityToggle = async (bonusId: string, completed: boolean) => {
    try {
      const dateString = getDateString(selectedDate);
      const existingEntry = vitalityEntries.find(
        entry => entry.bonusId === bonusId && entry.date === dateString
      );

      if (existingEntry) {
        const updatedEntry = { ...existingEntry, completed };
        await db.updateVitalityEntry(updatedEntry);
      } else {
        const newEntry: VitalityEntry = {
          id: crypto.randomUUID(),
          date: dateString,
          bonusId,
          completed
        };
        await db.addVitalityEntry(newEntry);
      }
      
      await loadDayData();
    } catch (error) {
      console.error('Failed to update vitality entry:', error);
      toast({
        title: "Error",
        description: "Failed to update vitality checklist.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Initializing Daily Effectiveness Logger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Daily Effectiveness Logger
              </h1>
              <p className="text-sm text-muted-foreground">
                Track, measure, and optimize your daily productivity
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                {selectedDate.toLocaleDateString()}
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Score"
              value={Math.round(metrics.totalScore)}
              unit="points"
              icon={Target}
              variant="primary"
            />
            <KPICard
              title="Focus Ratio"
              value={metrics.focusRatio.toFixed(1)}
              unit="%"
              icon={Brain}
              variant="secondary"
            />
            <KPICard
              title="Distraction Ratio"
              value={metrics.distractionRatio.toFixed(1)}
              unit="%"
              icon={Zap}
              variant="warning"
            />
            <KPICard
              title="Time Logged"
              value={formatDuration(metrics.totalTimeLogged)}
              icon={Clock}
              variant="accent"
            />
          </div>
        </section>

        {/* Daily Logging */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Daily Logging</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Log Activity</TabsTrigger>
                <TabsTrigger value="vitality">Vitality</TabsTrigger>
              </TabsList>
              <TabsContent value="activity">
                <ActivityLogForm
                  categories={categories}
                  onActivityLogged={handleActivityLogged}
                  selectedDate={selectedDate}
                />
              </TabsContent>
              <TabsContent value="vitality">
                <VitalityChecklist
                  bonuses={vitalityBonuses}
                  entries={vitalityEntries}
                  onEntryToggle={handleVitalityToggle}
                  selectedDate={selectedDate}
                />
              </TabsContent>
            </Tabs>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Today's Activities
                </CardTitle>
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
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {activity.points > 0 ? '+' : ''}{activity.points.toFixed(1)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDuration(activity.duration)}
                              </p>
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
        </section>
      </div>
    </div>
  );
}