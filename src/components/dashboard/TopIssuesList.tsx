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
    <Card className="shadow-healthcare">
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
      <CardContent className="pt-0">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <TrendingDown className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No issues found for this filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue, index) => (
              <div key={issue.reason} className="space-y-1.5">
                <div className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${getSeverityColor(index)}`}
                  >
                    {index + 1}
                  </div>
                  
                  {/* Issue name */}
                  <span className="text-sm font-medium flex-1 truncate" title={issue.reason}>
                    {issue.reason}
                  </span>
                  
                  {/* Count */}
                  <span className="text-sm font-semibold w-8 text-right">{issue.count}</span>
                  
                  {/* Percentage badge */}
                  <span className="inline-flex items-center justify-center rounded-full bg-coral/10 px-2 py-0.5 text-xs font-bold text-coral min-w-[40px]">
                    {issue.percentage}%
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden ml-9">
                  <div
                    className="h-full rounded-full bg-coral transition-all duration-500"
                    style={{ width: `${(issue.count / maxCount) * 100}%` }}
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
