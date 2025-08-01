import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyTimetable } from "@/components/analytics/WeeklyTimetable";
import { MonthlyOverview } from "@/components/analytics/MonthlyOverview";
import { TrendAnalysis } from "@/components/analytics/TrendAnalysis";
import { ActivityCategory, VitalityBonus, db } from "@/lib/database";

export function Analytics() {
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [vitalityBonuses, setVitalityBonuses] = useState<VitalityBonus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

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
    } catch (error) {
      console.error('Error initializing analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Analyze your productivity patterns and trends
        </p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Weekly Timetable</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyTimetable categories={categories} />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyOverview categories={categories} vitalityBonuses={vitalityBonuses} />
        </TabsContent>

        <TabsContent value="trends">
          <TrendAnalysis categories={categories} vitalityBonuses={vitalityBonuses} />
        </TabsContent>
      </Tabs>
    </div>
  );
}