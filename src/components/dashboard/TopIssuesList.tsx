import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CallRecord, getTopUnhappyReasons, getFilteredClinicLocations } from "@/data/medcareData";
import { AlertTriangle, TrendingDown } from "lucide-react";

interface TopIssuesListProps {
  data: CallRecord[];
  selectedLocation?: string | null;
  onFilterChange?: (location: string | null) => void;
}

export function TopIssuesList({ data, selectedLocation, onFilterChange }: TopIssuesListProps) {
  const clinicLocations = useMemo(() => getFilteredClinicLocations(data), [data]);

  // Derive localFilter from selectedLocation for controlled behavior
  const localFilter = selectedLocation || "all";

  const handleFilterChange = (value: string) => {
    if (onFilterChange) {
      onFilterChange(value === "all" ? null : value);
    }
  };

  const issues = useMemo(() => {
    // Apply filter based on selectedLocation
    const filteredData = selectedLocation
      ? data.filter((r) => r.Clinic_Location === selectedLocation)
      : data;
    return getTopUnhappyReasons(filteredData);
  }, [data, selectedLocation]);

  const maxCount = issues.length > 0 ? Math.max(...issues.map((i) => i.count)) : 1;

  const activeFilterLabel = selectedLocation;

  // Severity colors based on rank
  const getSeverityColor = (index: number) => {
    if (index === 0) return "bg-coral text-white";
    if (index === 1) return "bg-coral/80 text-white";
    if (index === 2) return "bg-coral/60 text-white";
    return "bg-coral/40 text-foreground";
  };

  return (
    <Card className="shadow-healthcare flex-1 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-coral/10">
              <AlertTriangle className="h-4 w-4 text-coral" />
            </div>
            <CardTitle className="text-lg font-semibold">Top Patient Pain Points</CardTitle>
          </div>
          {/* Clinic filter dropdown */}
          <Select value={localFilter} onValueChange={handleFilterChange}>
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
        </div>
        {activeFilterLabel && (
          <p className="text-xs text-muted-foreground mt-1">Filtered: {activeFilterLabel}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-1">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <TrendingDown className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No issues found for this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-end gap-6 text-xs text-muted-foreground px-1 pb-1 border-b">
              <span className="w-12 text-center">Count</span>
              <span className="w-14 text-center">Share</span>
            </div>
            
            {issues.map((issue, index) => (
              <div
                key={issue.reason}
                className="group relative rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:border-coral/30"
              >
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${getSeverityColor(index)}`}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Issue name */}
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium block truncate"
                      title={issue.reason}
                    >
                      {issue.reason}
                    </span>
                  </div>
                  
                  {/* Metrics */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="w-12 text-center">
                      <span className="text-sm font-semibold">{issue.count}</span>
                    </div>
                    <div className="w-14 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-coral/10 px-2.5 py-1 text-xs font-bold text-coral">
                        {issue.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(issue.count / maxCount) * 100}%`,
                      background: `linear-gradient(90deg, hsl(var(--coral)) 0%, hsl(var(--coral) / 0.6) 100%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
