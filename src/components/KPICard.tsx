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
  // [UPDATED] Styles for both light and dark mode.
  // Light mode: Uses a very subtle background color.
  // Dark mode: Uses the standard dark card background with a colored border and text to avoid being too bright.
  const variantStyles = {
    primary:   "border-primary/20 bg-primary/5 text-primary dark:bg-card dark:border-primary/30",
    secondary: "border-secondary/20 bg-secondary/5 text-secondary dark:bg-card dark:border-secondary/30",
    accent:    "border-accent/20 bg-accent/5 text-accent dark:bg-card dark:border-accent/30",
    success:   "border-success/20 bg-success/5 text-success dark:bg-card dark:border-success/30",
    warning:   "border-warning/20 bg-warning/5 text-warning dark:bg-card dark:border-warning/30",
  };

  return (
    <Card className={cn(
      "transition-all duration-300 border", // Added base border class
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline space-x-1">
              {/* [UPDATED] Text color now inherits from the parent card's variant style for better contrast */}
              <span className="text-3xl font-bold">
                {value}
              </span>
              {unit && (
                <span className="text-sm text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
          </div>
          {/* [UPDATED] Icon background is now a darker, transparent shade of the variant color */}
          <div className={cn(
            "p-3 rounded-full bg-current/10"
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
