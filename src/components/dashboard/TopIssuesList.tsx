import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallRecord, getTopUnhappyReasons, getClinicLocations } from "@/data/medcareData";
import { AlertTriangle } from "lucide-react";

interface TopIssuesListProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

export function TopIssuesList({ data, selectedLocation }: TopIssuesListProps) {
  const [localFilter, setLocalFilter] = useState<string>("all");

  const clinicLocations = useMemo(() => getClinicLocations(data), [data]);

  const issues = useMemo(() => {
    // Apply local filter or external selectedLocation
    const activeFilter = selectedLocation || (localFilter !== "all" ? localFilter : null);
    const filteredData = activeFilter
      ? data.filter((r) => r.Clinic_Location === activeFilter)
      : data;
    return getTopUnhappyReasons(filteredData);
  }, [data, selectedLocation, localFilter]);

  const maxCount = issues.length > 0 ? Math.max(...issues.map((i) => i.count)) : 1;

  const activeFilterLabel = selectedLocation || (localFilter !== "all" ? localFilter : null);

  return (
    <Card className="shadow-healthcare h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-coral" />
            <CardTitle className="text-lg font-semibold">Top Patient Pain Points</CardTitle>
          </div>
          {/* Clinic filter dropdown */}
          {!selectedLocation && (
            <Select value={localFilter} onValueChange={setLocalFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
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
        </div>
        {activeFilterLabel && (
          <p className="text-sm text-muted-foreground">Filtered: {activeFilterLabel}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No issues found for this filter
            </p>
          ) : (
            issues.map((issue, index) => (
              <div key={issue.reason} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral/10 text-xs font-bold text-coral">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[140px]" title={issue.reason}>
                      {issue.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Count</span>
                      <span className="text-sm font-medium">{issue.count}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">Share</span>
                      <span className="rounded-full bg-coral/10 px-2 py-0.5 text-xs font-semibold text-coral">
                        {issue.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(issue.count / maxCount) * 100}%`,
                      background: `linear-gradient(90deg, #FF4B4B ${100 - issue.percentage}%, #ff7b7b 100%)`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
