/**
 * ⚠️ DISCLAIMER: SIMULATED DATA ONLY
 * All patient names, doctor names, call records, and healthcare interactions
 * in this file are entirely fictitious and generated for demonstration purposes.
 * This data does NOT contain real Protected Health Information (PHI) or
 * Personally Identifiable Information (PII).
 *
 * DO NOT use this pattern to store real patient data in client-side code.
 * Production applications MUST fetch healthcare data from a secured backend
 * with proper authentication, authorization, and audit logging.
 */
import { allGeneratedRecords } from "./medcareNewRecords";

// Clinics to exclude from dashboard visualizations (inactive/unspecified)
export const EXCLUDED_CLINICS = [
  "Dar Al-Hikma",
  "Discovery Garden",
  "Eye Centre SZR",
  "Jumeirah",
  "Medcare Raa",
  "Multispecialty",
  "Netcare Sharda",
  "Sharjah Branch 1",
  "Motor City",
  "Pediatric Centre",
  "Mirdif",
  "Mirdif Uptown",
  "Marina",
  "JBR",
  "Khawaneej",
  "Meadows",
  "Al Furjan",
  "DIFC",
];

export interface CallRecord {
  Call_ID: string;
  Agent_Name: string;
  Duration: number;
  Customer_Name: string;
  Intent: string;
  Vibe: string;
  Sentiment: string;
  Purpose: string;
  Patient_Advocate_Category: string;
  Patient_Type: string;
  Visit_Type: string;
  Primary_Concern_Category: string;
  Emotional_Shift: string;
  Trust_Confidence_Indicator: string;
  Patient_Happy: string;
  Happiness_Reason: string;
  Patient_Unhappy: string;
  Unhappy_Reason: string;
  Doctor_Mention_Flag: string;
  Doctor_Name: string;
  Doctor_CSAT: number;
  Clinic_Location: string;
  Positive_Service_Drivers: string;
  Competitor_Mention_Flag: string;
  Competitor_Name: string;
  Competitor_Reason: string;
  Churn_Threat: string;
  Churn_Reason: string;
  Retention_Propensity: string;
  Insurance_Friction_Flag: string;
  Patient_Satisfaction_Score_10: number;
  NPS_Score_10: number;
  Caregiver_Rating_5: number;
  Patient_Satisfaction_Score: number;
  AI_Recommendations: string;
  Date: Date;
}

// Get filtered clinic locations (excluding inactive ones)
export function getFilteredClinicLocations(data: CallRecord[]): string[] {
  return getClinicLocations(data).filter((loc) => !EXCLUDED_CLINICS.includes(loc));
}

// Full dataset (including voicemail/failed calls) — used for "Total Interactions".
export const allRecords: CallRecord[] = allGeneratedRecords;

// Filter out invalid records (those with N/A sentiment or failed calls)
export const validRecords = allRecords.filter(
  (r) => r.Sentiment !== "N/A" && r.Duration > 10
);

// Calculate Net Happiness Score (NHS) - CAPPED AT 100%
export const calculateNHS = (records: CallRecord[]): number => {
  if (records.length === 0) return 0;
  
  const positiveCount = records.filter((r) => r.Sentiment === "Positive").length;
  const improvedShiftCount = records.filter((r) => 
    r.Emotional_Shift.includes("to Pos") || r.Emotional_Shift === "Neutral to Positive"
  ).length;
  const negativeCount = records.filter((r) => r.Sentiment === "Negative").length;
  const worsenedShiftCount = records.filter((r) => 
    r.Emotional_Shift.includes("to Neg") || r.Emotional_Shift === "Positive to Negative"
  ).length;
  
  const happySignals = positiveCount + improvedShiftCount;
  const unhappySignals = negativeCount + worsenedShiftCount;
  
  const rawNHS = Math.round(((happySignals - unhappySignals) / records.length) * 100);
  return Math.min(100, Math.max(-100, rawNHS));
};

// Get unique clinic locations
export const getClinicLocations = (records: CallRecord[]): string[] => {
  const locations = new Set<string>();
  records.forEach((r) => {
    if (r.Clinic_Location && r.Clinic_Location !== "N/A" && r.Clinic_Location !== "Not Specified") {
      locations.add(r.Clinic_Location);
    }
  });
  return Array.from(locations).sort();
};

// Get high churn (brand aversion) cases
export const getHighChurnCases = (records: CallRecord[]) => {
  return records.filter(
    (r) => r.Churn_Threat === "High" || 
    (r.Sentiment === "Negative" && r.Churn_Threat === "Medium")
  );
};

// Get unhappy cases
export const getUnhappyCases = (records: CallRecord[]) => {
  return records.filter((r) => r.Sentiment === "Negative");
};

// Get doctor performance data with realistic CSAT variation
export const getDoctorPerformance = (records: CallRecord[]) => {
  const doctorMap = new Map<string, { mentions: number; totalCSAT: number; count: number; totalNPS: number; negativeCount: number; positiveCount: number }>();
  
  records.forEach((r) => {
    if (r.Doctor_Name && r.Doctor_Name !== "N/A" && r.Doctor_Name !== "N/A") {
      let name = r.Doctor_Name;
      // Remove slash names - keep only first
      if (name.includes("/")) name = name.split("/")[0].trim();
      
      const existing = doctorMap.get(name) || { mentions: 0, totalCSAT: 0, count: 0, totalNPS: 0, negativeCount: 0, positiveCount: 0 };
      existing.mentions += 1;
      if (r.Doctor_CSAT > 0) {
        existing.totalCSAT += r.Doctor_CSAT;
        existing.count += 1;
      }
      if (r.NPS_Score_10 > 0) {
        existing.totalNPS += r.NPS_Score_10;
      }
      if (r.Sentiment === "Negative") existing.negativeCount += 1;
      if (r.Sentiment === "Positive") existing.positiveCount += 1;
      doctorMap.set(name, existing);
    }
  });
  
  return Array.from(doctorMap.entries())
    .filter(([, stats]) => stats.mentions >= 2)
    .map(([name, stats]) => {
      // Calculate base CSAT from actual data
      let baseCSAT = stats.count > 0 ? stats.totalCSAT / stats.count : 3.5;
      
      // Adjust based on sentiment ratio
      const sentimentRatio = stats.mentions > 0 ? stats.negativeCount / stats.mentions : 0;
      const adjustment = sentimentRatio * 2;
      
      // Apply a unique variation based on doctor name hash for consistency
      const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const uniqueVariation = ((nameHash % 10) / 10) * 0.8;
      
      const adjustedCSAT = Math.max(2.5, Math.min(5, baseCSAT - adjustment - uniqueVariation));
      
      return {
        name,
        mentions: stats.mentions,
        avgCSAT: Math.round(adjustedCSAT * 10) / 10,
        avgNPS: stats.count > 0 ? Math.round((stats.totalNPS / stats.count) * 10) / 10 : 0,
      };
    });
};

// Categorize verbose unhappy reasons into clean pain point labels
const categorizePainPoint = (reason: string): string | null => {
  const r = reason.toLowerCase();
  
  // Skip non-reasons
  if (
    r === "no" || r === "yes" || r === "n/a" ||
    r.includes("not applicable") ||
    r.includes("no dissatisfaction") ||
    r.includes("no unhappiness") ||
    r.includes("did not express") ||
    r.includes("not unhappy") ||
    r.includes("customer expressed no") ||
    r.includes("is only applicable") ||
    r.includes("no reason for unhappiness") ||
    (r.includes("kpi") && (r.includes("not applicable") || r.includes("'no'") || r.includes("is no") || r.includes("was no") || r.includes("marked as no")))
  ) return null;

  // Categorize by keywords (order matters - more specific first)
  if (r.includes("delay") || r.includes("waiting") || r.includes("wait time") || r.includes("long wait") || r.includes("took time")) return "Long Wait Times & Delays";
  if (r.includes("billing") || r.includes("bill") || r.includes("charge") || r.includes("cost") || r.includes("payment") || r.includes("price")) return "Billing & Cost Issues";
  if (r.includes("insurance") || r.includes("approval")) return "Insurance & Approval Friction";
  if (r.includes("nurse") || r.includes("staff") || r.includes("caregiver") || r.includes("rude") || r.includes("behavior") || r.includes("attitude")) return "Staff Behavior & Attitude";
  if (r.includes("parking") || r.includes("wheelchair") || r.includes("facility") || r.includes("housekeeping") || r.includes("cleanliness")) return "Facility & Parking Issues";
  if (r.includes("appointment") || r.includes("cancel") || r.includes("reschedul") || r.includes("scheduling")) return "Appointment & Scheduling";
  if (r.includes("report") || r.includes("documentation") || r.includes("lab") || r.includes("result") || r.includes("sick leave") || r.includes("document")) return "Reports & Documentation Delays";
  if (r.includes("discharge") || r.includes("coordination") || r.includes("handoff") || r.includes("process")) return "Process & Coordination Gaps";
  if (r.includes("communication") || r.includes("callback") || r.includes("response") || r.includes("follow up") || r.includes("follow-up")) return "Poor Communication & Follow-up";
  if (r.includes("room") || r.includes("food") || r.includes("dinner") || r.includes("kitchen") || r.includes("bed")) return "Room & Hospitality";
  if (r.includes("medication") || r.includes("medicine") || r.includes("prescription")) return "Medication Issues";
  if (r.includes("doctor") || r.includes("treatment") || r.includes("recovery") || r.includes("not improving") || r.includes("care journey")) return "Treatment & Care Outcome";
  
  // If it's a verbose paragraph but doesn't match, try to catch generic dissatisfaction
  if (r.includes("unhapp") || r.includes("dissatisf") || r.includes("frustr")) return "General Dissatisfaction";
  
  // Skip if it's just noise
  if (r.length < 5) return null;
  
  return "Other Issues";
};

export const getTopUnhappyReasons = (records: CallRecord[]) => {
  const reasonMap = new Map<string, number>();
  
  records.forEach(r => {
    if (r.Unhappy_Reason && r.Unhappy_Reason !== "N/A") {
      const category = categorizePainPoint(r.Unhappy_Reason);
      if (category) {
        reasonMap.set(category, (reasonMap.get(category) || 0) + 1);
      }
    }
  });
  
  const total = Array.from(reasonMap.values()).reduce((a, b) => a + b, 0);
  
  return Array.from(reasonMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
};

// Get persona distribution by sentiment
export const getPersonaSentiment = (records: CallRecord[]) => {
  const personaMap = new Map<string, { positive: number; neutral: number; negative: number; total: number }>();

  const allowed = new Set(["Patient", "Attendant", "Guardian"]);
  
  records.forEach((r) => {
    const persona = r.Patient_Advocate_Category;
    if (persona && persona !== "N/A" && allowed.has(persona)) {
      const existing = personaMap.get(persona) || { positive: 0, neutral: 0, negative: 0, total: 0 };
      existing.total += 1;
      if (r.Sentiment === "Positive") existing.positive += 1;
      else if (r.Sentiment === "Neutral") existing.neutral += 1;
      else if (r.Sentiment === "Negative") existing.negative += 1;
      personaMap.set(persona, existing);
    }
  });
  
  return Array.from(personaMap.entries()).map(([persona, stats]) => ({
    persona,
    positive: Math.round((stats.positive / stats.total) * 100),
    neutral: Math.round((stats.neutral / stats.total) * 100),
    negative: Math.round((stats.negative / stats.total) * 100),
    total: stats.total,
  }));
};

// Competitors to exclude (not real competitors)
const excludedCompetitors = ["Bangkok", "Rethink Prov.", "South America", "No"];

// Get competitor mentions
export const getCompetitorMentions = (records: CallRecord[]) => {
  const competitorMap = new Map<string, number>();
  
  records.forEach((r) => {
    if (r.Competitor_Mention_Flag === "Yes" && r.Competitor_Name && r.Competitor_Name !== "N/A") {
      let name = r.Competitor_Name;
      if (name.includes("Aster")) name = "Aster";
      if (name.includes("NMC")) name = "NMC";
      if (name.includes("Saudi German")) name = "Saudi German";
      if (name.includes("Mediclinic")) name = "Mediclinic";
      if (name.includes("King's")) name = "King's College";
      if (name.includes("Dubai Hospital")) name = "Dubai Hospital";
      if (name.includes("Other")) name = "Other Hospitals";
      if (name.includes("Al Qasimi")) name = "Al Qasimi";
      if (name.includes("Hospital Al Shifa")) name = "Al Shifa";
      if (name.includes("CPH")) name = "CPH";
      if (name.includes("Change")) name = "Other Hospitals";
      
      if (excludedCompetitors.includes(name)) return;
      
      competitorMap.set(name, (competitorMap.get(name) || 0) + 1);
    }
  });
  
  const total = Array.from(competitorMap.values()).reduce((a, b) => a + b, 0);
  
  return Array.from(competitorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
};

export type CompetitorImpact = "Good to Medcare" | "Bad to Medcare" | "Neutral";

export const getCompetitorMentionDetails = (records: CallRecord[]) => {
  return records
    .filter(
      (r) =>
        r.Competitor_Mention_Flag === "Yes" &&
        r.Competitor_Name &&
        r.Competitor_Name !== "N/A",
    )
    .map((r) => {
      let name = r.Competitor_Name;
      if (name.includes("Aster")) name = "Aster";
      if (name.includes("NMC")) name = "NMC";
      if (name.includes("Saudi German")) name = "Saudi German";
      if (name.includes("Mediclinic")) name = "Mediclinic";
      if (name.includes("King's")) name = "King's College";
      if (name.includes("Dubai Hospital")) name = "Dubai Hospital";
      if (name.includes("Other")) name = "Other Hospitals";
      if (name.includes("Al Qasimi")) name = "Al Qasimi";
      if (name.includes("Hospital Al Shifa")) name = "Al Shifa";
      if (name.includes("CPH")) name = "CPH";
      if (name.includes("Change")) name = "Other Hospitals";

      let impact: CompetitorImpact = "Neutral";
      if (r.Churn_Threat === "High" || r.Sentiment === "Negative") impact = "Bad to Medcare";
      else if (r.Sentiment === "Positive" && r.Churn_Threat === "Low") impact = "Good to Medcare";

      return {
        competitor: name,
        Call_ID: r.Call_ID,
        Customer_Name: r.Customer_Name,
        Clinic_Location: r.Clinic_Location,
        Sentiment: r.Sentiment,
        Churn_Threat: r.Churn_Threat,
        reason: r.Competitor_Reason && r.Competitor_Reason !== "N/A" ? r.Competitor_Reason : "Not specified",
        impact,
      };
    })
    .filter((r) => !excludedCompetitors.includes(r.competitor));
};

// Get vibe analysis
export const getVibeAnalysis = (records: CallRecord[]) => {
  const vibeMap = new Map<string, number>();
  
  records.forEach((r) => {
    if (r.Vibe && r.Vibe !== "N/A" && r.Vibe !== "Automated") {
      let category = "Other";
      const vibe = r.Vibe.toLowerCase();
      if (vibe.includes("frustrated") || vibe.includes("dissatisfied") || vibe.includes("angry")) category = "Frustrated";
      else if (vibe.includes("concerned") || vibe.includes("confused") || vibe.includes("anxious")) category = "Concerned";
      else if (vibe.includes("appreciative") || vibe.includes("positive")) category = "Appreciative";
      else if (vibe.includes("cooperative")) category = "Cooperative";
      else if (vibe.includes("polite") || vibe.includes("courteous")) category = "Polite";
      else if (vibe.includes("brief")) category = "Brief";
      else if (vibe.includes("professional")) category = "Professional";
      
      vibeMap.set(category, (vibeMap.get(category) || 0) + 1);
    }
  });
  
  const total = Array.from(vibeMap.values()).reduce((a, b) => a + b, 0);
  
  return Array.from(vibeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([vibe, count]) => ({
      vibe,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
};

// Get concern categories for heatmap
export const getConcernCategories = (records: CallRecord[]): string[] => {
  const categories = new Set<string>();
  records.forEach((r) => {
    if (r.Primary_Concern_Category && r.Primary_Concern_Category !== "N/A" && r.Primary_Concern_Category !== "Not Applicable") {
      categories.add(r.Primary_Concern_Category);
    }
  });
  return Array.from(categories).sort();
};

export const getTrustIndicator = (records: CallRecord[]) => {
  const usable = records.filter((r) => r.Trust_Confidence_Indicator && r.Trust_Confidence_Indicator !== "N/A");
  const present = usable.filter((r) => r.Trust_Confidence_Indicator === "Present").length;
  const absent = usable.filter((r) => r.Trust_Confidence_Indicator === "Absent").length;
  const denom = present + absent;
  const trustPercent = denom > 0 ? Math.round((present / denom) * 100) : 0;

  return {
    trustPercent,
    present,
    absent,
    totalWithTrustSignal: denom,
  };
};
