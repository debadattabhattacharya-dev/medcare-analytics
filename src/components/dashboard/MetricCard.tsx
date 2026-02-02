import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "teal" | "coral" | "success" | "warning";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-card",
    teal: "bg-teal-light border-teal/20",
    coral: "bg-coral-light border-coral/20",
    success: "bg-success-light border-success/20",
    warning: "bg-warning-light border-warning/20",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    teal: "text-teal",
    coral: "text-coral",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <Card className={cn("shadow-healthcare transition-all hover:shadow-lg", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-success",
                    trend === "down" && "text-coral",
                    trend === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trend === "up" && "↑"}
                  {trend === "down" && "↓"}
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-xl bg-background/50", iconStyles[variant])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
