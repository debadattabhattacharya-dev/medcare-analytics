import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CallRecord, getHighChurnCases } from "@/data/medcareData";
import { AlertCircle, Phone, MapPin, Clock, Lightbulb } from "lucide-react";
import { format } from "date-fns";

interface WarRoomTriageProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

export function WarRoomTriage({ data, selectedLocation }: WarRoomTriageProps) {
  const highChurnCases = useMemo(() => {
    const filteredData = selectedLocation
      ? data.filter((r) => r.Clinic_Location === selectedLocation)
      : data;
    
    return getHighChurnCases(filteredData)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        revenueAtRisk: 50000, // AED 50,000 per high churn case
      }));
  }, [data, selectedLocation]);

  return (
    <Card className="shadow-healthcare border-coral/20">
      <CardHeader className="pb-2 bg-coral/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-coral animate-pulse-soft" />
            <CardTitle className="text-lg font-semibold">War Room Triage Center</CardTitle>
          </div>
          <Badge variant="destructive" className="text-sm">
            {highChurnCases.length} Critical Cases
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Brand aversion cases requiring immediate attention
          {selectedLocation && ` • ${selectedLocation}`}
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        {highChurnCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success-light flex items-center justify-center mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-muted-foreground">No high churn cases detected!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {highChurnCases.map((caseData, index) => (
              <div
                key={caseData.Call_ID}
                className="rounded-lg border border-coral/20 bg-coral/5 p-4 transition-all hover:border-coral/40 hover:shadow-md animate-slide-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{caseData.Customer_Name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {caseData.Call_ID}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {caseData.Clinic_Location || "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(caseData.Date, "MMM dd")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive" className="shrink-0">
                    Brand Aversion
                  </Badge>
                </div>

                <div className="rounded-md bg-background p-2 mb-3">
                  <p className="text-xs text-muted-foreground">Primary Issue</p>
                  <p className="text-sm font-medium text-coral">
                    {caseData.Unhappy_Reason !== "N/A" ? caseData.Unhappy_Reason : caseData.Churn_Reason}
                  </p>
                </div>

                <div className="rounded-md bg-teal-light p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-teal mb-1">AI Recommendation</p>
                      <p className="text-sm text-foreground">{caseData.AI_Recommendations}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
