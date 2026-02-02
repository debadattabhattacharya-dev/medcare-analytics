import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from "recharts";
import { CallRecord, getDoctorStats } from "@/data/medcareData";
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
    
    return getDoctorStats(filteredData)
      .filter((d) => d.mentions > 0 && d.avgCSAT > 0)
      .map((d) => ({
        ...d,
        z: Math.max(d.avgNPS * 5, 100), // Size based on NPS, minimum 100
      }));
  }, [data, selectedLocation]);

  const getColor = (csat: number) => {
    if (csat >= 4.5) return "#008080"; // Teal for great
    if (csat >= 3.5) return "#f59e0b"; // Warning for medium
    return "#FF4B4B"; // Coral for poor
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-card p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-muted-foreground">
              Mentions: <span className="font-medium text-foreground">{data.mentions}</span>
            </p>
            <p className="text-muted-foreground">
              Avg CSAT: <span className="font-medium text-foreground">{data.avgCSAT.toFixed(1)}/5</span>
            </p>
            <p className="text-muted-foreground">
              Avg NPS: <span className="font-medium text-foreground">{data.avgNPS.toFixed(1)}/10</span>
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
          <CardTitle className="text-lg font-semibold">Clinical Star Map</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Doctor performance: Size = NPS • Color = CSAT rating
          {selectedLocation && ` • ${selectedLocation}`}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          {doctorData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No doctor data available for this filter
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  dataKey="mentions"
                  name="Mentions"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  label={{
                    value: "Mentions",
                    position: "bottom",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="avgCSAT"
                  name="CSAT"
                  domain={[0, 5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  label={{
                    value: "Avg CSAT",
                    angle: -90,
                    position: "insideLeft",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />
                <ZAxis type="number" dataKey="z" range={[100, 500]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={doctorData} fill="#008080">
                  {doctorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.avgCSAT)} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#008080" }} />
            <span className="text-xs text-muted-foreground">CSAT ≥ 4.5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <span className="text-xs text-muted-foreground">CSAT 3.5-4.4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FF4B4B" }} />
            <span className="text-xs text-muted-foreground">CSAT &lt; 3.5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
