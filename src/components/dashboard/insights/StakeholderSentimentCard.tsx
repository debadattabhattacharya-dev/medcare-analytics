import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SENTIMENT = {
  positive: "hsl(var(--teal))",
  neutral: "hsl(var(--muted-foreground))",
  negative: "hsl(var(--coral))",
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
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-1 space-y-1">
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-6 text-xs">
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-mono font-medium" style={{ color: entry.color }}>
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Who’s Speaking? (Stakeholders)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 16, left: 8, bottom: 18 }}>
              <XAxis
                dataKey="persona"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="positive" stackId="a" name="Positive" fill={SENTIMENT.positive} />
              <Bar dataKey="neutral" stackId="a" name="Neutral" fill={SENTIMENT.neutral} />
              <Bar dataKey="negative" stackId="a" name="Negative" fill={SENTIMENT.negative} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded" style={{ background: SENTIMENT.positive }} />
            <span className="text-muted-foreground">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded" style={{ background: SENTIMENT.neutral }} />
            <span className="text-muted-foreground">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded" style={{ background: SENTIMENT.negative }} />
            <span className="text-muted-foreground">Negative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
