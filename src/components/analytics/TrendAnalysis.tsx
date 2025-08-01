import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLog, ActivityCategory, VitalityEntry, VitalityBonus, db } from "@/lib/database";
import { calculateDailyMetrics, getDateString, formatDuration } from "@/lib/calculations";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { subDays, format } from "date-fns";

interface TrendAnalysisProps {
  categories: ActivityCategory[];
  vitalityBonuses: VitalityBonus[];
}

interface DailyTrendData {
  date: string;
  totalScore: number;
  focusRatio: number;
  distractionRatio: number;
  productivityThroughput: number;
  totalTimeLogged: number;
}

interface EnergyFocusData {
  energyLevel: string;
  deepWorkHours: number;
  color: string;
}

interface CategoryTimeData {
  name: string;
  minutes: number;
  color: string;
}

export function TrendAnalysis({ categories, vitalityBonuses }: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<DailyTrendData[]>([]);
  const [energyFocusData, setEnergyFocusData] = useState<EnergyFocusData[]>([]);
  const [categoryTimeData, setCategoryTimeData] = useState<CategoryTimeData[]>([]);
  const [loading, setLoading] = useState(false);

  const chartConfig = {
    totalScore: {
      label: "Total Score",
      color: "hsl(var(--primary))",
    },
    focusRatio: {
      label: "Focus Ratio",
      color: "hsl(var(--secondary))",
    },
    distractionRatio: {
      label: "Distraction Ratio",
      color: "hsl(var(--destructive))",
    },
    productivityThroughput: {
      label: "Productivity Throughput",
      color: "hsl(var(--accent))",
    },
  };

  useEffect(() => {
    loadTrendData();
  }, [categories, vitalityBonuses]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 29); // Last 30 days
      
      const startDateString = getDateString(startDate);
      const endDateString = getDateString(endDate);
      
      const activities = await db.getActivitiesInRange(startDateString, endDateString);
      
      // Group activities by date
      const dailyData = new Map<string, ActivityLog[]>();
      activities.forEach(activity => {
        if (!dailyData.has(activity.date)) {
          dailyData.set(activity.date, []);
        }
        dailyData.get(activity.date)!.push(activity);
      });

      // Calculate daily metrics
      const trends: DailyTrendData[] = [];
      const energyCorrelation = { High: 0, Medium: 0, Low: 0 };
      const categoryTime = new Map<string, number>();

      for (let i = 0; i < 30; i++) {
        const currentDate = subDays(endDate, 29 - i);
        const dateString = getDateString(currentDate);
        const dayActivities = dailyData.get(dateString) || [];
        
        // Get vitality entries for this day
        const dayVitalityEntries = await db.getVitalityEntriesByDate(dateString);
        
        // Calculate metrics for this day
        const metrics = calculateDailyMetrics(
          dayActivities,
          categories,
          dayVitalityEntries,
          vitalityBonuses
        );

        trends.push({
          date: format(currentDate, 'MMM d'),
          totalScore: metrics.totalScore,
          focusRatio: metrics.focusRatio,
          distractionRatio: metrics.distractionRatio,
          productivityThroughput: metrics.productivityThroughput,
          totalTimeLogged: metrics.totalTimeLogged,
        });

        // Aggregate energy-focus correlation
        energyCorrelation.High += metrics.energyFocusCorrelation.high;
        energyCorrelation.Medium += metrics.energyFocusCorrelation.medium;
        energyCorrelation.Low += metrics.energyFocusCorrelation.low;

        // Aggregate category time
        dayActivities.forEach(activity => {
          const category = categories.find(cat => cat.id === activity.categoryId);
          if (category) {
            categoryTime.set(category.name, (categoryTime.get(category.name) || 0) + activity.duration);
          }
        });
      }

      setTrendData(trends);

      // Set energy-focus correlation data
      setEnergyFocusData([
        { energyLevel: 'High', deepWorkHours: energyCorrelation.High / 60, color: '#FFD700' },
        { energyLevel: 'Medium', deepWorkHours: energyCorrelation.Medium / 60, color: '#87CEEB' },
        { energyLevel: 'Low', deepWorkHours: energyCorrelation.Low / 60, color: '#D3D3D3' },
      ]);

      // Set category time data
      const categoryData = Array.from(categoryTime.entries()).map(([name, minutes]) => {
        const category = categories.find(cat => cat.name === name);
        return {
          name,
          minutes,
          color: category?.color || '#999999',
        };
      }).sort((a, b) => b.minutes - a.minutes);

      setCategoryTimeData(categoryData);

    } catch (error) {
      console.error('Error loading trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading trend analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Daily Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Total Daily Score Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="totalScore" 
                  stroke="var(--color-totalScore)" 
                  strokeWidth={2}
                  dot={{ fill: "var(--color-totalScore)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Focus vs Distraction Ratios */}
      <Card>
        <CardHeader>
          <CardTitle>Focus vs Distraction Ratios</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="focusRatio" 
                  stroke="var(--color-focusRatio)" 
                  strokeWidth={2}
                  name="Focus Ratio (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="distractionRatio" 
                  stroke="var(--color-distractionRatio)" 
                  strokeWidth={2}
                  name="Distraction Ratio (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Productivity Throughput */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Throughput (Points per Hour)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="productivityThroughput" 
                  stroke="var(--color-productivityThroughput)" 
                  strokeWidth={2}
                  dot={{ fill: "var(--color-productivityThroughput)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Energy-Focus Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Energy-Focus Correlation (Deep Work Hours by Energy Level)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyFocusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="energyLevel" />
                <YAxis />
                <ChartTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = typeof payload[0].value === 'number' ? payload[0].value : 0;
                      return (
                        <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                          <p className="font-medium">{`Energy Level: ${label}`}</p>
                          <p className="text-sm">{`Deep Work: ${value.toFixed(1)} hours`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="deepWorkHours" 
                  name="Deep Work Hours"
                >
                  {energyFocusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Time Allocation by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Time Allocation by Category (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTimeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="minutes"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded-lg p-2 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">{formatDuration(data.minutes)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {categoryTimeData.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-border rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(category.minutes)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}