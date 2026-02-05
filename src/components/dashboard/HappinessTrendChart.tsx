import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CallRecord, calculateNHS, getFilteredClinicLocations } from "@/data/medcareData";
import { format } from "date-fns";
import { TrendingUp, TrendingDown } from "lucide-react";

interface HappinessTrendChartProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

export function HappinessTrendChart({ data, selectedLocation }: HappinessTrendChartProps) {
  const [localFilter, setLocalFilter] = useState<string>("all");

  const clinicLocations = useMemo(() => getFilteredClinicLocations(data), [data]);

  // Compute clinic-wise NHS for each day
  const clinicDailyNHS = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    clinicLocations.forEach((loc) => {
      const locRecords = data.filter((r) => r.Clinic_Location === loc);
      const dateMap = new Map<string, CallRecord[]>();
      
      locRecords.forEach((record) => {
        const dateKey = format(record.Date, "yyyy-MM-dd");
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(record);
      });
      
      result[loc] = {};
      dateMap.forEach((records, date) => {
        result[loc][date] = calculateNHS(records);
      });
    });
    
    return result;
  }, [data, clinicLocations]);

  const chartData = useMemo(() => {
    // Apply local filter or external selectedLocation
    const activeFilter = selectedLocation || (localFilter !== "all" ? localFilter : null);
    const filteredData = activeFilter
      ? data.filter((r) => r.Clinic_Location === activeFilter)
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
  }, [data, selectedLocation, localFilter]);

  const averageNHS = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.round(chartData.reduce((acc, d) => acc + d.nhs, 0) / chartData.length);
  }, [chartData]);

  const activeFilterLabel = selectedLocation || (localFilter !== "all" ? localFilter : null);

  // Custom tooltip showing best/worst performer based on dip/spike
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const value = payload[0].value;
    const currentDate = payload[0].payload.date;
    const showClinicInsight = !selectedLocation && localFilter === "all";
    
    // Determine if this is a dip or spike
    const isDip = value < averageNHS;
    
    // Get clinic performances for this date
    let bestClinic = { name: "", nhs: 0 };
    let worstClinic = { name: "", nhs: 100 };
    
    if (showClinicInsight) {
      clinicLocations.forEach((clinic) => {
        const clinicNHS = clinicDailyNHS[clinic]?.[currentDate];
        if (clinicNHS !== undefined) {
          if (clinicNHS > bestClinic.nhs) {
            bestClinic = { name: clinic, nhs: clinicNHS };
          }
          if (clinicNHS < worstClinic.nhs) {
            worstClinic = { name: clinic, nhs: clinicNHS };
          }
        }
      });
    }

    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg min-w-[200px]">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">NHS:</span>
          <span className={`text-lg font-bold ${isDip ? "text-coral" : "text-teal"}`}>
            {value}%
          </span>
          {isDip ? (
            <TrendingDown className="h-4 w-4 text-coral" />
          ) : (
            <TrendingUp className="h-4 w-4 text-teal" />
          )}
        </div>
        
        {showClinicInsight && (
          <div className="pt-2 border-t space-y-2">
            {isDip && worstClinic.name && (
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-coral mt-1.5 shrink-0" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Lowest: </span>
                  <span className="font-medium text-coral">{worstClinic.name}</span>
                  <span className="text-coral font-bold ml-1">({worstClinic.nhs}%)</span>
                </div>
              </div>
            )}
            {!isDip && bestClinic.name && (
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-teal mt-1.5 shrink-0" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Top: </span>
                  <span className="font-medium text-teal">{bestClinic.name}</span>
                  <span className="text-teal font-bold ml-1">({bestClinic.nhs}%)</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold">
            Patient Happiness Trend
            {activeFilterLabel && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                — {activeFilterLabel}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-4">
            {/* Clinic filter dropdown */}
            {!selectedLocation && (
              <Select value={localFilter} onValueChange={setLocalFilter}>
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <SelectValue placeholder="All Clinics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clinics</SelectItem>
                  {clinicLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dx={-10}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
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
