import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallRecord, getUniqueLocations, getUniqueConcerns, getUnhappyCases } from "@/data/medcareData";
import { cn } from "@/lib/utils";

interface PatientPainHeatmapProps {
  data: CallRecord[];
  onLocationSelect: (location: string | null) => void;
  selectedLocation: string | null;
}

export function PatientPainHeatmap({
  data,
  onLocationSelect,
  selectedLocation,
}: PatientPainHeatmapProps) {
  const { heatmapData, locations, concerns } = useMemo(() => {
    const locations = getUniqueLocations(data);
    const concerns = getUniqueConcerns(data);

    // Create heatmap matrix
    const matrix: Record<string, Record<string, { unhappy: number; total: number; percentage: number }>> = {};

    locations.forEach((loc) => {
      matrix[loc] = {};
      concerns.forEach((concern) => {
        const cellRecords = data.filter(
          (r) => r.Clinic_Location === loc && r.Primary_Concern_Category === concern
        );
        const unhappyRecords = cellRecords.filter(
          (r) =>
            r.Sentiment === "Negative" ||
            r.Emotional_Shift?.includes("to Neg") ||
            r.Trust_Confidence_Indicator === "Absent"
        );
        matrix[loc][concern] = {
          unhappy: unhappyRecords.length,
          total: cellRecords.length,
          percentage: cellRecords.length > 0 ? Math.round((unhappyRecords.length / cellRecords.length) * 100) : 0,
        };
      });
    });

    return { heatmapData: matrix, locations, concerns };
  }, [data]);

  const getHeatColor = (percentage: number, total: number) => {
    if (total === 0) return "bg-secondary/50";
    if (percentage === 0) return "bg-teal-light";
    if (percentage <= 25) return "bg-success-light";
    if (percentage <= 50) return "bg-warning-light";
    if (percentage <= 75) return "bg-coral/30";
    return "bg-coral/60";
  };

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Patient Pain Heatmap</CardTitle>
        <p className="text-sm text-muted-foreground">
          Click a clinic to filter dashboard • % of unhappy calls per cell
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground p-2 w-36">
                  Clinic / Concern →
                </th>
                {concerns.map((concern) => (
                  <th
                    key={concern}
                    className="text-center text-xs font-medium text-muted-foreground p-2 max-w-[100px]"
                  >
                    <span className="block truncate" title={concern}>
                      {concern}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr
                  key={location}
                  className={cn(
                    "cursor-pointer transition-all hover:bg-accent/50",
                    selectedLocation === location && "ring-2 ring-teal ring-offset-2"
                  )}
                  onClick={() =>
                    onLocationSelect(selectedLocation === location ? null : location)
                  }
                >
                  <td className="text-sm font-medium p-2 max-w-[140px]">
                    <span className="block truncate" title={location}>
                      {location}
                    </span>
                  </td>
                  {concerns.map((concern) => {
                    const cell = heatmapData[location]?.[concern] || {
                      unhappy: 0,
                      total: 0,
                      percentage: 0,
                    };
                    return (
                      <td key={`${location}-${concern}`} className="p-1">
                        <div
                          className={cn(
                            "flex items-center justify-center h-10 rounded-md text-xs font-semibold transition-all",
                            getHeatColor(cell.percentage, cell.total),
                            cell.total > 0 && cell.percentage > 25 && "text-coral",
                            cell.total > 0 && cell.percentage <= 25 && "text-foreground"
                          )}
                          title={`${cell.unhappy}/${cell.total} unhappy (${cell.percentage}%)`}
                        >
                          {cell.total > 0 ? `${cell.percentage}%` : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
          <span className="text-xs text-muted-foreground">Unhappy %:</span>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded bg-teal-light" />
            <span className="text-xs">0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded bg-success-light" />
            <span className="text-xs">≤25%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded bg-warning-light" />
            <span className="text-xs">≤50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-8 rounded bg-coral/60" />
            <span className="text-xs">&gt;50%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
