import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { VitalityBonus, VitalityEntry } from "@/lib/database";
import { getDateString } from "@/lib/calculations";
import { Heart } from "lucide-react";

interface VitalityChecklistProps {
  bonuses: VitalityBonus[];
  entries: VitalityEntry[];
  onEntryToggle: (bonusId: string, completed: boolean) => void;
  selectedDate?: Date;
}

export function VitalityChecklist({ 
  bonuses, 
  entries, 
  onEntryToggle, 
  selectedDate = new Date() 
}: VitalityChecklistProps) {
  const [completedBonuses, setCompletedBonuses] = useState<Set<string>>(new Set());

  useEffect(() => {
    const completed = new Set(
      entries.filter(entry => entry.completed).map(entry => entry.bonusId)
    );
    setCompletedBonuses(completed);
  }, [entries]);

  const handleToggle = (bonusId: string, checked: boolean) => {
    setCompletedBonuses(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(bonusId);
      } else {
        newSet.delete(bonusId);
      }
      return newSet;
    });
    
    onEntryToggle(bonusId, checked);
  };

  const totalPossiblePoints = bonuses.reduce((sum, bonus) => sum + bonus.points, 0);
  const earnedPoints = bonuses
    .filter(bonus => completedBonuses.has(bonus.id))
    .reduce((sum, bonus) => sum + bonus.points, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-success" />
          Vitality Checklist
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {earnedPoints}/{totalPossiblePoints} points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bonuses.map((bonus) => {
            const isCompleted = completedBonuses.has(bonus.id);
            
            return (
              <div 
                key={bonus.id} 
                className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={bonus.id}
                  checked={isCompleted}
                  onCheckedChange={(checked) => handleToggle(bonus.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <label 
                    htmlFor={bonus.id}
                    className={`text-sm font-medium cursor-pointer ${
                      isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {bonus.name}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {bonus.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${
                    isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    +{bonus.points}
                  </span>
                </div>
              </div>
            );
          })}
          
          {bonuses.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No vitality bonuses configured
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}