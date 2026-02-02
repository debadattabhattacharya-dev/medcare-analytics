import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CallRecord, calculateNHS } from "@/data/medcareData";
import { format } from "date-fns";

interface HappinessTrendChartProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

export function HappinessTrendChart({ data, selectedLocation }: HappinessTrendChartProps) {
  const chartData = useMemo(() => {
    // Filter by location if selected
    const filteredData = selectedLocation
      ? data.filter((r) => r.Clinic_Location === selectedLocation)
      : data;

    // Group by date
    const dateMap = new Map<string, CallRecord[]>();
    filteredData.forEach((record) => {
      const dateKey = format(record.Date, "yyyy-MM-dd");
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(record);
    });

    // Calculate NHS per day
    return Array.from(dateMap.entries())
      .map(([date, records]) => ({
        date,
        displayDate: format(new Date(date), "MMM dd"),
        nhs: calculateNHS(records),
        calls: records.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, selectedLocation]);

  const averageNHS = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((acc, d) => acc + d.nhs, 0) / chartData.length);
  }, [chartData]);

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Executive Happiness Velocity
            {selectedLocation && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {selectedLocation}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-teal" />
              <span className="text-muted-foreground">Growth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-coral" />
              <span className="text-muted-foreground">Dips</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nhsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#008080" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#008080" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="nhsStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#008080" />
                  <stop offset="100%" stopColor="#00a0a0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                domain={[0, 200]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dx={-10}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number) => [`${value}%`, "Net Happiness Score"]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <ReferenceLine
                y={averageNHS}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{
                  value: `Avg: ${averageNHS}%`,
                  position: "right",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="nhs"
                stroke="url(#nhsStroke)"
                strokeWidth={2.5}
                fill="url(#nhsGradient)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isLow = payload.nhs < averageNHS;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={isLow ? "#FF4B4B" : "#008080"}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
