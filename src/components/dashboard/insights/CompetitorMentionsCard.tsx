import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CallRecord, CompetitorImpact, getCompetitorMentionDetails, getCompetitorMentions } from "@/data/medcareData";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(var(--teal))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--coral))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
];

type DetailsRow = ReturnType<typeof getCompetitorMentionDetails>[number];

export function CompetitorMentionsCard({ data }: { data: CallRecord[] }) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<"all" | CompetitorImpact>("all");

  const competitorData = useMemo(() => getCompetitorMentions(data), [data]);
  const details = useMemo(() => getCompetitorMentionDetails(data), [data]);

  const top = competitorData.slice(0, 6);

  const selectedRows = useMemo(() => {
    const rows = selectedCompetitor ? details.filter((d) => d.competitor === selectedCompetitor) : [];
    return impactFilter === "all" ? rows : rows.filter((r) => r.impact === impactFilter);
  }, [details, selectedCompetitor, impactFilter]);

  const onPickCompetitor = (name: string) => {
    setSelectedCompetitor(name);
    setImpactFilter("all");
  };

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Other Hospitals Mentioned</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
          <div className="h-[260px]">
            {top.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={top}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={2}
                    onClick={(entry: any) => onPickCompetitor(entry?.name)}
                  >
                    {top.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: any, props: any) => {
                      const pct = competitorData.find((c) => c.name === props?.payload?.name)?.percentage ?? 0;
                      return [`${value} calls (${pct}%)`, "Mentions"];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No competitor mentions in selected data
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Click a name to see the calls</div>
            <div className="space-y-2">
              {competitorData.slice(0, 8).map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => onPickCompetitor(c.name)}
                  className="w-full rounded-lg border bg-card px-3 py-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        {c.count}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{c.percentage}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" disabled={!selectedCompetitor}>
                {selectedCompetitor ? `View details for ${selectedCompetitor}` : "Select a competitor"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle className="text-base">{selectedCompetitor || "Competitor details"}</DialogTitle>
              </DialogHeader>

              <Tabs value={impactFilter} onValueChange={(v) => setImpactFilter(v as any)}>
                <TabsList>
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
                          <TableHead>Patient</TableHead>
                          <TableHead>Call ID</TableHead>
                          <TableHead>Reason mentioned</TableHead>
                          <TableHead>Impact</TableHead>
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
                            <TableRow key={`${r.Call_ID}-${r.Customer_Name}`}
                              className="align-top"
                            >
                              <TableCell className="font-medium">{r.Customer_Name}</TableCell>
                              <TableCell className="font-mono text-xs">{r.Call_ID}</TableCell>
                              <TableCell className="text-sm">{r.reason}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    r.impact === "Bad to Medcare"
                                      ? "destructive"
                                      : r.impact === "Good to Medcare"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className={r.impact === "Good to Medcare" ? "bg-teal-light text-teal" : undefined}
                                >
                                  {r.impact}
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
        </div>
      </CardContent>
    </Card>
  );
}
