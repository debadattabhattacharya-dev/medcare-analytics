import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  allRecords,
  validRecords,
  calculateNHS,
  getHighChurnCases,
} from "@/data/medcareData";
import { MedcareLogo } from "./MedcareLogo";
import { AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  selectedLocation: string | null;
  onClearFilter: () => void;
}

export function DashboardHeader({ selectedLocation, onClearFilter }: DashboardHeaderProps) {
  const metrics = useMemo(() => {
    const filteredValid = selectedLocation
      ? validRecords.filter((r) => r.Clinic_Location === selectedLocation)
      : validRecords;

    const filteredAll = selectedLocation
      ? allRecords.filter((r) => r.Clinic_Location === selectedLocation)
      : allRecords;

    const nhs = calculateNHS(filteredValid);
    const highChurnCases = getHighChurnCases(filteredValid);
    const revenueAtRisk = highChurnCases.length * 50000;

    return {
      nhs,
      totalCalls: filteredAll.length,
      highChurnCount: highChurnCases.length,
      revenueAtRisk,
    };
  }, [selectedLocation]);

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <MedcareLogo className="h-12 w-14" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Medcare <span className="text-teal">VoC Analytics</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                CXO Executive Dashboard
              </p>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="flex items-center gap-6 flex-wrap">
            {/* NHS Score */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-teal">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Net Happiness</p>
                <p className="text-lg font-bold text-teal">{metrics.nhs}%</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Revenue at Risk */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-coral">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Revenue at Risk</p>
                <p className="text-lg font-bold text-coral">
                  AED {metrics.revenueAtRisk.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* High Churn Cases */}
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="rounded-full px-2 py-1">
                {metrics.highChurnCount}
              </Badge>
              <span className="text-sm text-muted-foreground">High Churn</span>
            </div>

            {/* Filter Indicator */}
            {selectedLocation && (
              <>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-teal-light text-teal">
                    {selectedLocation}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilter}
                    className="h-8 px-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
