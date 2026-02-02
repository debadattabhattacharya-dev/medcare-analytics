import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallRecord, getTrustIndicator } from "@/data/medcareData";

interface TrustIndicatorCardProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

function Gauge({ value }: { value: number }) {
  const size = 140;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(100, value));
  const dash = (progress / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-muted"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ stroke: "hsl(var(--teal))" }}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold tracking-tight">{progress}%</div>
        <div className="text-xs text-muted-foreground">Trust</div>
      </div>
    </div>
  );
}

export function TrustIndicatorCard({ data, selectedLocation }: TrustIndicatorCardProps) {
  const stats = useMemo(() => {
    const filtered = selectedLocation ? data.filter((r) => r.Clinic_Location === selectedLocation) : data;
    return getTrustIndicator(filtered);
  }, [data, selectedLocation]);

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Trust & Confidence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Gauge value={stats.trustPercent} />

          <div className="w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Signals counted</span>
              <span className="font-medium">{stats.totalWithTrustSignal}</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full"
                style={{ width: `${stats.trustPercent}%`, background: "hsl(var(--teal))" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Trust present</div>
                <div className="mt-1 text-lg font-semibold" style={{ color: "hsl(var(--teal))" }}>
                  {stats.present}
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Trust absent</div>
                <div className="mt-1 text-lg font-semibold" style={{ color: "hsl(var(--coral))" }}>
                  {stats.absent}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
