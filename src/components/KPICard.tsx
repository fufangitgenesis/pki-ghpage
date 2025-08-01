import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  variant = 'primary',
  className 
}: KPICardProps) {
  const variantStyles = {
    primary: 'border-primary/20 bg-primary-subtle hover:border-primary/30',
    secondary: 'border-secondary/20 bg-secondary-subtle hover:border-secondary/30',
    accent: 'border-accent/20 bg-accent-subtle hover:border-accent/30',
    success: 'border-success/20 bg-success-subtle hover:border-success/30',
    warning: 'border-warning/20 bg-warning-subtle hover:border-warning/30',
  };

  const iconStyles = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-lg",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-foreground">
                {value}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-full bg-background/50",
            iconStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}