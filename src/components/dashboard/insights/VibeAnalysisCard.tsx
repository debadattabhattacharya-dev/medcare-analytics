import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const VIBE_COLORS: Record<string, string> = {
  Professional: "hsl(var(--teal))",
  Appreciative: "hsl(var(--success))",
  Polite: "hsl(var(--accent-foreground))",
  Cooperative: "hsl(var(--primary))",
  Concerned: "hsl(var(--warning))",
  Frustrated: "hsl(var(--coral))",
  Brief: "hsl(var(--muted-foreground))",
  Other: "hsl(var(--muted-foreground))",
};

export function VibeAnalysisCard({
  data,
}: {
  data: Array<{ vibe: string; percentage: number; count: number }>;
}) {
  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">How Did The Call Feel?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="vibe"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry.vibe}-${index}`} fill={VIBE_COLORS[entry.vibe] || VIBE_COLORS.Other} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, _name: any, props: any) => {
                  const pct = props?.payload?.percentage ?? 0;
                  return [`${value} calls (${pct}%)`, "Vibe"];
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
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {data.slice(0, 8).map((v) => (
            <div key={v.vibe} className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded" style={{ background: VIBE_COLORS[v.vibe] || VIBE_COLORS.Other }} />
                <span className="text-sm font-medium text-foreground">{v.vibe}</span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{v.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
