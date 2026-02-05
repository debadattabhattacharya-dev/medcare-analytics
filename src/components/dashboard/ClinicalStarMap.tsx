import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { CallRecord, getDoctorPerformance } from "@/data/medcareData";
import { Stethoscope } from "lucide-react";

interface ClinicalStarMapProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

export function ClinicalStarMap({ data, selectedLocation }: ClinicalStarMapProps) {
  const doctorData = useMemo(() => {
    const filteredData = selectedLocation
      ? data.filter((r) => r.Clinic_Location === selectedLocation)
      : data;
    
    return getDoctorPerformance(filteredData)
      .filter((d) => d.mentions > 0 && d.avgCSAT > 0)
      .sort((a, b) => b.avgCSAT - a.avgCSAT)
      .slice(0, 10); // Top 10 doctors
  }, [data, selectedLocation]);

  const getColor = (csat: number) => {
    if (csat >= 4.5) return "hsl(var(--teal))";
    if (csat >= 3.5) return "hsl(var(--warning))";
    return "hsl(var(--coral))";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-muted-foreground">
              CSAT Score: <span className="font-bold text-foreground">{data.avgCSAT.toFixed(1)}/5</span>
            </p>
            <p className="text-muted-foreground">
              Mentions: <span className="font-medium text-foreground">{data.mentions}</span>
            </p>
            <p className="text-muted-foreground">
              NPS: <span className="font-medium text-foreground">{data.avgNPS.toFixed(1)}/10</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-teal" />
          <CardTitle className="text-lg font-semibold">Doctor CSAT Performance</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Average CSAT scores by doctor
          {selectedLocation && ` • ${selectedLocation}`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          {doctorData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No doctor data available for this filter
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={doctorData}
                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  domain={[0, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                <Bar 
                  dataKey="avgCSAT" 
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {doctorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.avgCSAT)} />
                  ))}
                  <LabelList 
                    dataKey="avgCSAT" 
                    position="right" 
                    formatter={(value: number) => `${value.toFixed(1)}`}
                    style={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-teal" />
            <span className="text-xs text-muted-foreground">CSAT ≥ 4.5 (Excellent)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">CSAT 3.5-4.4 (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-coral" />
            <span className="text-xs text-muted-foreground">CSAT &lt; 3.5 (Needs Work)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
