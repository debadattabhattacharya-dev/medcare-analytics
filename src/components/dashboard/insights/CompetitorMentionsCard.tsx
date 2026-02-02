import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CallRecord, CompetitorImpact, getCompetitorMentionDetails, getCompetitorMentions } from "@/data/medcareData";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Yellow-to-green palette (consistent with other charts)
const COLORS = [
  "#22c55e", // Green
  "#4ade80", // Light green
  "#86efac", // Lighter green
  "#facc15", // Yellow
  "#fde047", // Light yellow
  "#fef08a", // Lighter yellow
  "#fb923c", // Orange
  "#fdba74", // Light orange
];

type DetailsRow = ReturnType<typeof getCompetitorMentionDetails>[number];

// More contextual impact descriptions
const getImpactContext = (reason: string, impact: CompetitorImpact): string => {
  if (impact === "Good to Medcare") {
    if (reason.toLowerCase().includes("better service") || reason.toLowerCase().includes("wait time")) {
      return "Patient chose Medcare over competitor due to better service/shorter wait times";
    }
    if (reason.toLowerCase().includes("prior")) {
      return "Patient had prior experience elsewhere but prefers Medcare now";
    }
    return "Positive comparison — patient favors Medcare";
  }
  if (impact === "Bad to Medcare") {
    if (reason.toLowerCase().includes("better service")) {
      return "Patient feels competitor offers better service than Medcare";
    }
    if (reason.toLowerCase().includes("process") || reason.toLowerCase().includes("gap")) {
      return "Patient frustrated with Medcare processes, considering alternatives";
    }
    if (reason.toLowerCase().includes("quality")) {
      return "Patient perceives competitor as having higher quality care";
    }
    return "Negative comparison — risk of patient choosing competitor";
  }
  return "Competitor mentioned in neutral context";
};

export function CompetitorMentionsCard({ data }: { data: CallRecord[] }) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<"all" | CompetitorImpact>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const competitorData = useMemo(() => getCompetitorMentions(data), [data]);
  const details = useMemo(() => getCompetitorMentionDetails(data), [data]);

  const totalMentions = useMemo(() => 
    competitorData.reduce((sum, c) => sum + c.count, 0), 
    [competitorData]
  );

  const selectedRows = useMemo(() => {
    const rows = selectedCompetitor ? details.filter((d) => d.competitor === selectedCompetitor) : [];
    return impactFilter === "all" ? rows : rows.filter((r) => r.impact === impactFilter);
  }, [details, selectedCompetitor, impactFilter]);

  const onPickCompetitor = (name: string) => {
    setSelectedCompetitor(name);
    setImpactFilter("all");
    setDialogOpen(true);
  };

  // Custom label for pie chart segments
  const renderCustomLabel = ({ name, percentage, cx, cy, midAngle, outerRadius }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 10) return null; // Don't show label for small segments

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {name}: {percentage}%
      </text>
    );
  };

  return (
    <Card className="shadow-healthcare h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Competitor Mentions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Donut chart with total in center */}
          <div className="relative h-[280px] w-full">
            {competitorData.length > 0 ? (
              <TooltipProvider>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={competitorData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      label={renderCustomLabel}
                      labelLine={false}
                      style={{ cursor: "pointer" }}
                      onClick={(entry: any) => onPickCompetitor(entry?.name)}
                    >
                      {competitorData.map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-card p-3 shadow-lg max-w-xs">
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-sm text-foreground mt-1">
                              <span className="font-mono">{item.count}</span> calls ({item.percentage}%)
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              Click to see patient details
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">{totalMentions}</div>
                    <div className="text-xs text-muted-foreground">Total Mentions</div>
                  </div>
                </div>
              </TooltipProvider>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No competitor mentions
              </div>
            )}
          </div>

          {/* Legend with clickable items */}
          <div className="mt-4 grid grid-cols-2 gap-2 w-full">
            {competitorData.slice(0, 8).map((c, i) => (
              <Tooltip key={c.name}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onPickCompetitor(c.name)}
                    className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-left hover:bg-muted transition-colors w-full"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-3 w-3 rounded flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground flex-shrink-0">{c.percentage}%</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{c.count} calls mentioning {c.name}</p>
                  <p className="text-xs text-muted-foreground">Click to view details</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {selectedCompetitor} — Call Details
              </DialogTitle>
            </DialogHeader>

            <Tabs value={impactFilter} onValueChange={(v) => setImpactFilter(v as any)} className="mt-4">
              <TabsList className="grid grid-cols-4 w-full max-w-md">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Good to Medcare">Good</TabsTrigger>
                <TabsTrigger value="Neutral">Neutral</TabsTrigger>
                <TabsTrigger value="Bad to Medcare">Bad</TabsTrigger>
              </TabsList>

              <TabsContent value={impactFilter} className="mt-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Patient</TableHead>
                        <TableHead className="font-semibold">Call ID</TableHead>
                        <TableHead className="font-semibold">Why Mentioned</TableHead>
                        <TableHead className="font-semibold">Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                            No calls match this filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedRows.slice(0, 30).map((r: DetailsRow) => (
                          <TableRow key={`${r.Call_ID}-${r.Customer_Name}`} className="align-top">
                            <TableCell className="font-medium text-foreground">{r.Customer_Name}</TableCell>
                            <TableCell className="font-mono text-xs text-foreground">{r.Call_ID}</TableCell>
                            <TableCell className="text-sm">
                              <div className="text-foreground font-medium">{r.reason}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {getImpactContext(r.reason, r.impact)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  r.impact === "Bad to Medcare"
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : r.impact === "Good to Medcare"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                }
                              >
                                {r.impact === "Good to Medcare" ? "Good for Medcare" : 
                                 r.impact === "Bad to Medcare" ? "Risk to Medcare" : "Neutral"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                {selectedRows.length > 30 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Showing first 30 of {selectedRows.length} calls.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
