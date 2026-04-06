import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HappinessTrendChart } from "@/components/dashboard/HappinessTrendChart";
import { TopIssuesList } from "@/components/dashboard/TopIssuesList";
import { PatientPainHeatmap } from "@/components/dashboard/PatientPainHeatmap";
import { ClinicalStarMap } from "@/components/dashboard/ClinicalStarMap";
import { WarRoomTriage } from "@/components/dashboard/WarRoomTriage";
import { InsightsSection } from "@/components/dashboard/InsightsSection";

import {
  allRecords,
  validRecords,
  calculateNHS,
  getHighChurnCases,
  getUnhappyCases,
} from "@/data/medcareData";
import { Users, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";

const Index = () => {
  // Global location filter - controlled from heatmap click OR top chart filters
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Handler for top chart filter changes (Happiness Trend & Pain Points)
  const handleTopChartFilterChange = (location: string | null) => {
    setSelectedLocation(location);
  };

  // Calculate metrics based on filtered data
  const filteredData = selectedLocation
    ? validRecords.filter((r) => r.Clinic_Location === selectedLocation)
    : validRecords;

  const allFilteredData = selectedLocation
    ? allRecords.filter((r) => r.Clinic_Location === selectedLocation)
    : allRecords;

  const nhs = calculateNHS(filteredData);
  const highChurnCases = getHighChurnCases(filteredData);
  const unhappyCases = getUnhappyCases(filteredData);
  const happyCases = filteredData.filter((r) => r.Sentiment === "Positive");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        selectedLocation={selectedLocation}
        onClearFilter={() => setSelectedLocation(null)}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Row 0: Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Interactions"
            value={allFilteredData.length}
            subtitle="All call recordings"
            icon={Users}
            variant="default"
          />
          <MetricCard
            title="Actively Engaged"
            value={happyCases.length}
            subtitle={`${Math.round((happyCases.length / filteredData.length) * 100)}% of total`}
            icon={ThumbsUp}
            variant="teal"
          />
          <MetricCard
            title="Disengaged"
            value={unhappyCases.length}
            subtitle="Needs attention"
            icon={ThumbsDown}
            variant="coral"
          />
          <MetricCard
            title="Actively Disengaged"
            value={highChurnCases.length}
            subtitle="Patients at risk"
            icon={AlertTriangle}
            variant="warning"
          />
        </div>


        {/* Row 1: Happiness Trend + Top Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <div className="lg:col-span-3">
            <HappinessTrendChart 
              data={validRecords} 
              selectedLocation={selectedLocation}
              onFilterChange={handleTopChartFilterChange}
            />
          </div>
          <div className="lg:col-span-2">
            <TopIssuesList 
              data={validRecords} 
              selectedLocation={selectedLocation}
              onFilterChange={handleTopChartFilterChange}
            />
          </div>
        </div>

        {/* Row 2: Heatmap + Clinical Star Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PatientPainHeatmap
            data={validRecords}
            onLocationSelect={setSelectedLocation}
            selectedLocation={selectedLocation}
          />
          <ClinicalStarMap data={validRecords} selectedLocation={selectedLocation} />
        </div>

        {/* Row 3: Deep Insights */}
        <InsightsSection data={validRecords} selectedLocation={selectedLocation} />

        {/* Row 4: War Room Triage */}
        <WarRoomTriage data={validRecords} selectedLocation={selectedLocation} />

        {/* Footer */}
        <footer className="text-center py-6 border-t text-sm text-muted-foreground">
          <p>
            Medcare VoC Analytics Dashboard • Data simulated across 30-day timeline •
            Built for Executive Decision Making
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
