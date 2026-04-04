import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Yellow-to-green gradient palette (consistent across all charts)
const VIBE_COLORS: Record<string, string> = {
  Professional: "#22c55e",   // Green
  Polite: "#4ade80",         // Light green
  Appreciative: "#86efac",   // Lighter green
  Cooperative: "#facc15",    // Yellow
  Concerned: "#fde047",      // Light yellow
  Brief: "#fef08a",          // Lighter yellow
  Frustrated: "#f97316",     // Orange (warning)
  Other: "#94a3b8",          // Gray
};

export function VibeAnalysisCard({
  data,
}: {
  data: Array<{ vibe: string; percentage: number; count: number }>;
}) {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalCalls = data.reduce((sum, v) => sum + v.count, 0);

  const onPickVibe = (vibe: string) => {
    setSelectedVibe(vibe);
    setDialogOpen(true);
  };

  // Custom label with pointer lines (like reference design)
  const renderCustomLabel = ({ vibe, percentage, cx, cy, midAngle, outerRadius }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 6) return null; // Hide small segments to avoid clipping

    // Truncate long names
    const displayName = vibe.length > 8 ? vibe.substring(0, 7) + '.' : vibe;

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize: 10, fontWeight: 500 }}
      >
        {displayName}: {percentage}%
      </text>
    );
  };

  // Custom label line (pointer)
  const renderLabelLine = (props: any) => {
    const { cx, cy, midAngle, outerRadius, payload } = props;
    if (payload.percentage < 6) return null;
    
    const RADIAN = Math.PI / 180;
    const startRadius = outerRadius + 4;
    const endRadius = outerRadius + 18;
    
    const x1 = cx + startRadius * Math.cos(-midAngle * RADIAN);
    const y1 = cy + startRadius * Math.sin(-midAngle * RADIAN);
    const x2 = cx + endRadius * Math.cos(-midAngle * RADIAN);
    const y2 = cy + endRadius * Math.sin(-midAngle * RADIAN);
    
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1}
      />
    );
  };

  const getVibeDescription = (vibe: string): string => {
    switch (vibe) {
      case "Professional": return "Calm, business-like communication";
      case "Polite": return "Courteous and respectful tone";
      case "Appreciative": return "Expressing gratitude and thanks";
      case "Cooperative": return "Willing to engage and collaborate";
      case "Concerned": return "Worried or anxious about situation";
      case "Brief": return "Short, to-the-point conversation";
      case "Frustrated": return "Showing signs of dissatisfaction";
      default: return "Other communication style";
    }
  };

  return (
    <Card className="shadow-healthcare h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">How Did The Call Feel?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Donut chart with total in center */}
          <div className="relative h-[320px] w-full overflow-visible">
            <TooltipProvider>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="vibe"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={renderCustomLabel}
                    labelLine={renderLabelLine}
                    style={{ cursor: "pointer" }}
                    onClick={(entry: any) => onPickVibe(entry?.vibe)}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`${entry.vibe}-${index}`} 
                        fill={VIBE_COLORS[entry.vibe] || VIBE_COLORS.Other} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    wrapperStyle={{ zIndex: 50 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-card p-3 shadow-lg max-w-xs z-50">
                          <div className="font-semibold text-foreground">{item.vibe}</div>
                          <div className="text-sm text-foreground mt-1">
                            <span className="font-mono">{item.count}</span> calls ({item.percentage}%)
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {getVibeDescription(item.vibe)}
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </TooltipProvider>
            {/* Center total - moved outside TooltipProvider and given lower z-index */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Total: {totalCalls}</div>
              </div>
            </div>
          </div>

          {/* Legend with clickable items */}
          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
            {data.slice(0, 8).map((v) => (
              <Tooltip key={v.vibe}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onPickVibe(v.vibe)}
                    className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left hover:bg-muted transition-colors w-full"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="h-3 w-3 rounded flex-shrink-0" 
                        style={{ background: VIBE_COLORS[v.vibe] || VIBE_COLORS.Other }} 
                      />
                      <span className="text-sm font-medium text-foreground truncate">{v.vibe}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground flex-shrink-0">{v.percentage}%</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{v.count} calls with {v.vibe} vibe</p>
                  <p className="text-xs text-muted-foreground">{getVibeDescription(v.vibe)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <span 
                  className="h-4 w-4 rounded" 
                  style={{ background: VIBE_COLORS[selectedVibe || "Other"] || VIBE_COLORS.Other }} 
                />
                {selectedVibe} Calls
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-foreground">
                  {data.find(v => v.vibe === selectedVibe)?.count || 0}
                </div>
                <div className="text-muted-foreground mt-2">
                  calls with {selectedVibe?.toLowerCase()} tone
                </div>
                <div className="text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
                  {getVibeDescription(selectedVibe || "")}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
