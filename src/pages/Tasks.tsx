import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { db, Task } from "@/lib/database";
import { Plus, Calendar, Clock, AlertCircle, Inbox, Grid, List, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from "@/lib/calculations";
import { cn } from "@/lib/utils";

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'Today' | 'This Week' | 'This Month' | 'Inbox'>('Today');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    scope: 'Today' as 'Today' | 'This Week' | 'This Month' | 'Inbox',
    dueDate: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeTasks();
  }, []);

  const initializeTasks = async () => {
    try {
      await db.init();
      const tasksData = await db.getTasks();
      setTasks(tasksData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const getTasksForView = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (activeView) {
      case 'Today':
        return tasks.filter(task => 
          task.scope === 'Today' || 
          task.dueDate === today
        );
      case 'This Week':
        // Get tasks for current week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        return tasks.filter(task => {
          if (task.scope === 'This Week') return true;
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            return dueDate >= startOfWeek && dueDate <= endOfWeek;
          }
          return false;
        });
      case 'This Month':
        // Get tasks for current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        
        return tasks.filter(task => {
          if (task.scope === 'This Month') return true;
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            return dueDate >= startOfMonth && dueDate <= endOfMonth;
          }
          return false;
        });
      case 'Inbox':
        return tasks.filter(task => task.scope === 'Inbox');
      default:
        return tasks;
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a task title.",
        variant: "destructive"
      });
      return;
    }

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      priority: newTask.priority,
      scope: newTask.scope,
      dueDate: newTask.dueDate || undefined,
      completed: false,
      timeLogged: 0,
      createdDate: new Date().toISOString().split('T')[0]
    };

    try {
      await db.addTask(task);
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        priority: 'Medium',
        scope: 'Today',
        dueDate: ''
      });
      setShowAddForm(false);
      toast({
        title: "Task Added",
        description: `Successfully added "${task.title}".`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task.",
        variant: "destructive"
      });
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, completed };
    try {
      await db.updateTask(updatedTask);
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      toast({
        title: completed ? "Task Completed" : "Task Reopened",
        description: `"${task.title}" has been ${completed ? 'completed' : 'reopened'}.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return AlertCircle;
      case 'Medium': return Clock;
      case 'Low': return Calendar;
      default: return Calendar;
    }
  };

  const filteredTasks = getTasksForView();
  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const totalTasks = filteredTasks.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Tasks & Planning
              </h1>
              <p className="text-sm text-muted-foreground">
                Organize and track your daily tasks
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-semibold">
                      {completedTasks} / {totalTasks} Completed
                    </span>
                  </div>
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="Today" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="This Week">This Week</TabsTrigger>
            <TabsTrigger value="This Month">This Month</TabsTrigger>
            <TabsTrigger value="Inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeView} className="mt-6">
            {viewMode === 'list' ? (
              <div className="space-y-3">
                {filteredTasks.length > 0 ? (
                  filteredTasks
                    .sort((a, b) => {
                      if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                      }
                      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map((task) => {
                      const PriorityIcon = getPriorityIcon(task.priority);
                      return (
                        <Card key={task.id} className={cn(
                          "transition-all duration-200",
                          task.completed && "opacity-60"
                        )}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={(checked) => 
                                  handleTaskToggle(task.id, checked as boolean)
                                }
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={cn(
                                    "font-medium",
                                    task.completed && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </h3>
                                  <Badge variant={getPriorityColor(task.priority)} className="flex items-center gap-1">
                                    <PriorityIcon className="h-3 w-3" />
                                    {task.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{task.scope}</span>
                                  {task.dueDate && (
                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                  )}
                                  {task.timeLogged > 0 && (
                                    <span>Logged: {formatDuration(task.timeLogged)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No tasks for {activeView.toLowerCase()}</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setShowAddForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Task
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['High', 'Medium', 'Low'].map((priority) => (
                  <Card key={priority}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {React.createElement(getPriorityIcon(priority), { className: "h-5 w-5" })}
                        {priority} Priority
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {filteredTasks
                          .filter(task => task.priority === priority)
                          .map((task) => (
                            <Card key={task.id} className={cn(
                              "p-3 transition-all duration-200",
                              task.completed && "opacity-60"
                            )}>
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={(checked) => 
                                    handleTaskToggle(task.id, checked as boolean)
                                  }
                                />
                                <div className="flex-1">
                                  <p className={cn(
                                    "font-medium text-sm",
                                    task.completed && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </p>
                                  {task.timeLogged > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatDuration(task.timeLogged)} logged
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Task Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Enter task title..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High Priority</SelectItem>
                      <SelectItem value="Medium">Medium Priority</SelectItem>
                      <SelectItem value="Low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Select value={newTask.scope} onValueChange={(value: any) => setNewTask({ ...newTask, scope: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="This Week">This Week</SelectItem>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="Inbox">Inbox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddTask} className="flex-1">
                    Add Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}