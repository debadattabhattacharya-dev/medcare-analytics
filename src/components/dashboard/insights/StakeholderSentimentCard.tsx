import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

// Yellow to Green gradient palette (light to vibrant)
const SENTIMENT = {
  positive: "#22c55e", // Green
  neutral: "#facc15",  // Yellow
  negative: "#f97316", // Orange (visible warning, not red)
} as const;

export function StakeholderSentimentCard({
  data,
}: {
  data: Array<{ persona: string; positive: number; neutral: number; negative: number }>;
}) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="mt-2 space-y-1">
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded" style={{ background: entry.color }} />
                <span className="text-foreground">{entry.name}</span>
              </div>
              <span className="font-mono font-medium text-foreground">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-healthcare h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Who's Speaking? (Stakeholders)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 16, left: 8, bottom: 18 }}>
              <XAxis
                dataKey="persona"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ paddingTop: 16 }}
                formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
              />
              <Bar dataKey="positive" stackId="a" name="Positive" fill={SENTIMENT.positive} />
              <Bar dataKey="neutral" stackId="a" name="Neutral" fill={SENTIMENT.neutral} />
              <Bar dataKey="negative" stackId="a" name="Negative" fill={SENTIMENT.negative} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
