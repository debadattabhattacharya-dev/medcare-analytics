import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const VIBE_COLORS: Record<string, string> = {
  Professional: "#22c55e",
  Polite: "#4ade80",
  Appreciative: "#86efac",
  Cooperative: "#facc15",
  Concerned: "#fde047",
  Brief: "#fef08a",
  Frustrated: "#f97316",
  Other: "#94a3b8",
};

type VibeDatum = {
  vibe: string;
  percentage: number;
  count: number;
};

const getVibeDescription = (vibe: string): string => {
  switch (vibe) {
    case "Professional":
      return "Calm, business-like communication";
    case "Polite":
      return "Courteous and respectful tone";
    case "Appreciative":
      return "Expressing gratitude and thanks";
    case "Cooperative":
      return "Willing to engage and collaborate";
    case "Concerned":
      return "Worried or anxious about situation";
    case "Brief":
      return "Short, to-the-point conversation";
    case "Frustrated":
      return "Showing signs of dissatisfaction";
    default:
      return "Other communication style";
  }
};

export function VibeAnalysisCard({ data }: { data: VibeDatum[] }) {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const totalCalls = data.reduce((sum, vibeItem) => sum + vibeItem.count, 0);

  const onPickVibe = (vibe: string | undefined) => {
    if (!vibe) return;
    setSelectedVibe(vibe);
    setDialogOpen(true);
  };

  const renderCustomLabel = ({ vibe, percentage, cx, cy, midAngle, outerRadius, viewBox }: any) => {
    const RADIAN = Math.PI / 180;
    const isSmallSlice = percentage < 5;
    const radius = outerRadius + (isSmallSlice ? 34 : 28);
    const rawX = cx + radius * Math.cos(-midAngle * RADIAN);
    const rawY = cy + radius * Math.sin(-midAngle * RADIAN);
    const isRightSide = rawX > cx;
    const fontSize = isSmallSlice ? 8 : vibe.length > 10 ? 9 : 10;
    const estimatedTextWidth = (vibe.length + String(percentage).length + 3) * fontSize * 0.56;
    const chartWidth = viewBox?.width ?? 0;
    const labelX = chartWidth
      ? isRightSide
        ? Math.min(rawX + 4, chartWidth - estimatedTextWidth - 8)
        : Math.max(rawX - 4, estimatedTextWidth + 8)
      : rawX;

    return (
      <text
        x={labelX}
        y={rawY}
        fill="hsl(var(--foreground))"
        textAnchor={isRightSide ? "start" : "end"}
        dominantBaseline="central"
        style={{ fontSize, fontWeight: 500 }}
      >
        {vibe}: {percentage}%
      </text>
    );
  };

  const renderLabelLine = ({ cx, cy, midAngle, outerRadius, payload }: any) => {
    const RADIAN = Math.PI / 180;
    const isSmallSlice = payload?.percentage < 5;
    const startRadius = outerRadius + 6;
    const endRadius = outerRadius + (isSmallSlice ? 28 : 22);

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

  return (
    <Card className="shadow-healthcare h-full overflow-visible">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">How Did The Call Feel?</CardTitle>
      </CardHeader>
      <CardContent className="overflow-visible">
        <div className="flex flex-col items-center">
          <div className="relative h-[320px] w-full overflow-visible">
            <TooltipProvider>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 30, right: 60, bottom: 30, left: 60 }}>
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
                      const item = payload[0].payload as VibeDatum;

                      return (
                        <div className="z-50 max-w-xs rounded-lg border bg-card p-3 shadow-lg">
                          <div className="font-semibold text-foreground">{item.vibe}</div>
                          <div className="mt-1 text-sm text-foreground">
                            <span className="font-mono">{item.count}</span> calls ({item.percentage}%)
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            {getVibeDescription(item.vibe)}
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </TooltipProvider>

            <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
              <div className="text-center leading-tight">
                <div className="text-[11px] text-muted-foreground">Total</div>
                <div className="text-lg font-bold text-foreground">{totalCalls}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            {data.slice(0, 8).map((vibeItem) => (
              <Tooltip key={vibeItem.vibe}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onPickVibe(vibeItem.vibe)}
                    className="flex w-full items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3 w-3 flex-shrink-0 rounded"
                        style={{ background: VIBE_COLORS[vibeItem.vibe] || VIBE_COLORS.Other }}
                      />
                      <span className="truncate text-sm font-medium text-foreground">{vibeItem.vibe}</span>
                    </div>
                    <span className="flex-shrink-0 text-sm font-mono text-muted-foreground">
                      {vibeItem.percentage}%
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {vibeItem.count} calls with {vibeItem.vibe} vibe
                  </p>
                  <p className="text-xs text-muted-foreground">{getVibeDescription(vibeItem.vibe)}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <span
                  className="h-4 w-4 rounded"
                  style={{ background: VIBE_COLORS[selectedVibe || "Other"] || VIBE_COLORS.Other }}
                />
                {selectedVibe || "Selected"} Calls
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="py-8 text-center">
                <div className="text-4xl font-bold text-foreground">
                  {data.find((vibeItem) => vibeItem.vibe === selectedVibe)?.count || 0}
                </div>
                <div className="mt-2 text-muted-foreground">
                  calls with {selectedVibe?.toLowerCase() || "selected"} tone
                </div>
                <div className="mx-auto mt-4 max-w-xs text-sm text-muted-foreground">
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
