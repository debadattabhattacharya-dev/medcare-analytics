import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallRecord, getDoctorPerformance, getDisplayClinicName } from "@/data/medcareData";
import { Stethoscope, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      .slice(0, 8); // Top 8 doctors
  }, [data, selectedLocation]);

  const getPerformanceLevel = (csat: number) => {
    if (csat >= 4.5) return { label: "Excellent", color: "text-teal", bgColor: "bg-teal/10", icon: TrendingUp };
    if (csat >= 3.5) return { label: "Good", color: "text-warning", bgColor: "bg-warning/10", icon: Minus };
    return { label: "Needs Attention", color: "text-coral", bgColor: "bg-coral/10", icon: TrendingDown };
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3.5 w-3.5 fill-warning text-warning" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-3.5 w-3.5 text-muted-foreground/30" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-healthcare">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal/10">
            <Stethoscope className="h-4 w-4 text-teal" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Doctor CSAT Performance</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Patient satisfaction ratings
              {selectedLocation && ` • ${getDisplayClinicName(selectedLocation)}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {doctorData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            No doctor data available for this filter
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doctorData.map((doctor, index) => {
              const performance = getPerformanceLevel(doctor.avgCSAT);
              const PerformanceIcon = performance.icon;
              
              return (
                <div
                  key={doctor.name}
                  className={`relative p-3 rounded-lg border transition-all hover:shadow-md ${performance.bgColor} border-transparent hover:border-border`}
                >
                  {/* Rank indicator */}
                  <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-background border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={doctor.name}>
                        {doctor.name}
                      </p>
                      <div className="mt-1">
                        {renderStars(doctor.avgCSAT)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doctor.mentions} patient mentions
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold ${performance.color}`}>
                        {doctor.avgCSAT.toFixed(1)}
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${performance.color}`}>
                        <PerformanceIcon className="h-3 w-3" />
                        <span>{performance.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-teal" />
            <span className="text-xs text-muted-foreground">≥4.5 Excellent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">3.5-4.4 Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-coral" />
            <span className="text-xs text-muted-foreground">&lt;3.5 Attention</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
