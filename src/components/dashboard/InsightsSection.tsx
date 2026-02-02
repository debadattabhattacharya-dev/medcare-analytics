import { useMemo } from "react";
import { StakeholderSentimentCard } from "@/components/dashboard/insights/StakeholderSentimentCard";
import { CompetitorMentionsCard } from "@/components/dashboard/insights/CompetitorMentionsCard";
import { VibeAnalysisCard } from "@/components/dashboard/insights/VibeAnalysisCard";
import {
  CallRecord,
  getPersonaSentiment,
  getCompetitorMentions,
  getVibeAnalysis,
} from "@/data/medcareData";

interface InsightsSectionProps {
  data: CallRecord[];
  selectedLocation?: string | null;
}

export function InsightsSection({ data, selectedLocation }: InsightsSectionProps) {
  const filteredData = useMemo(() => {
    return selectedLocation
      ? data.filter((r) => r.Clinic_Location === selectedLocation)
      : data;
  }, [data, selectedLocation]);

  const personaData = useMemo(() => getPersonaSentiment(filteredData), [filteredData]);
  const competitorData = useMemo(() => getCompetitorMentions(filteredData), [filteredData]);
  const vibeData = useMemo(() => getVibeAnalysis(filteredData), [filteredData]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        Deep Insights Analysis
        {selectedLocation && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            — {selectedLocation}
          </span>
        )}
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StakeholderSentimentCard data={personaData} />
        <CompetitorMentionsCard data={filteredData} />
        <VibeAnalysisCard data={vibeData} />
      </div>
    </div>
  );
}
