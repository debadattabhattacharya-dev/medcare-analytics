import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  CallRecord,
  getPersonaSentiment,
  getCompetitorMentions,
  getVibeAnalysis,
} from "@/data/medcareData";

interface InsightsSectionProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

const SENTIMENT_COLORS = {
  positive: "#008080",
  neutral: "#93C5FD",
  negative: "#FF4B4B",
};

const COMPETITOR_COLORS = ["#0EA5E9", "#38BDF8", "#7DD3FC", "#BAE6FD", "#E0F2FE"];

const VIBE_COLORS: Record<string, string> = {
  Professional: "#1E3A5F",
  Helpful: "#0EA5E9",
  Warm: "#38BDF8",
  Confused: "#BAE6FD",
  Defensive: "#93C5FD",
  Other: "#E0F2FE",
};

export function InsightsSection({ data, selectedLocation }: InsightsSectionProps) {
  const filteredData = useMemo(() => {
    return selectedLocation
      ? data.filter((r) => r.Clinic_Location === selectedLocation)
      : data;
  }, [data, selectedLocation]);

  const personaData = useMemo(() => getPersonaSentiment(filteredData), [filteredData]);
  const competitorData = useMemo(() => getCompetitorMentions(filteredData), [filteredData]);
  const vibeData = useMemo(() => getVibeAnalysis(filteredData), [filteredData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        Deep Insights Analysis
        {selectedLocation && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            — {selectedLocation}
          </span>
        )}
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Respondent Persona vs Sentiment */}
        <Card className="shadow-healthcare">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Who's Speaking? Sentiment by Stakeholder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={personaData}
                  layout="horizontal"
                  margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="persona" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positive" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutral" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Negative" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 justify-center mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: SENTIMENT_COLORS.positive }} />
                <span className="text-xs text-muted-foreground">Positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: SENTIMENT_COLORS.neutral }} />
                <span className="text-xs text-muted-foreground">Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: SENTIMENT_COLORS.negative }} />
                <span className="text-xs text-muted-foreground">Negative</span>
              </div>
            </div>
            <p className="text-xs text-teal mt-3 font-medium">
              INFERENCE: Identifies if friction lies with the Patient or Decision-Maker (Guardian).
            </p>
          </CardContent>
        </Card>

        {/* Competitor Share of Voice */}
        <Card className="shadow-healthcare">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Competitor Share of Voice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {competitorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={competitorData}
                      dataKey="percentage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      labelLine={false}
                    >
                      {competitorData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COMPETITOR_COLORS[index % COMPETITOR_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, "Share"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-foreground font-medium text-sm"
                    >
                      Share %
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No competitor mentions in selected data
                </div>
              )}
            </div>
            <p className="text-xs text-teal mt-3 font-medium">
              INFERENCE: Free market research on which rivals are threatening Medcare.
            </p>
          </CardContent>
        </Card>

        {/* Human Factor Vibe Analysis */}
        <Card className="shadow-healthcare">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              The Human Factor: Vibe Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vibeData}
                    dataKey="percentage"
                    nameKey="vibe"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ vibe, percentage }) => percentage > 5 ? `${vibe}: ${percentage}%` : ""}
                    labelLine={false}
                  >
                    {vibeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={VIBE_COLORS[entry.vibe] || VIBE_COLORS.Other} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, "Share"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend 
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: "10px" }}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-teal mt-3 font-medium">
              INFERENCE: Measures the Brand Personality of the workforce.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
