// Extended Medcare VoC Dataset - Records MC235-MC594
// New format has an extra "Contact Person" column at position 4

const CLINIC_POOL = [
  "Al Safa", "Medcare Royal", "Sharjah Hospital", "Women & Children",
  "Ortho & Spine", "Medcare Hospital", "Al Barsha", "Mirdif City Centre",
  "All Specialty", "Al Taawun",
];

function assignClinic(callId: string): string {
  const num = parseInt(callId.replace("MC", ""), 10);
  return CLINIC_POOL[num % CLINIC_POOL.length];
}

const toNum = (v: string): number => {
  const t = (v ?? "").trim();
  if (!t || t.toLowerCase() === "n/a") return 0;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

// V2 parser for new format (25 columns with extra Contact column at index 4)
export const parseNewFormatRow = (row: string) => {
  const cols = row.split("|").map((c) => c.trim());
  const callId = cols[0] || "N/A";

  // Detect if this is old format (no contact person column) or new format
  // New format: cols[4] is contact person, cols[5] is Intent
  // Determine based on whether column 5 looks like an Intent
  const hasContactCol = cols.length >= 24;

  const offset = hasContactCol ? 1 : 0; // shift by 1 if contact person present

  const intent = cols[4 + offset] || "N/A";
  const vibe = cols[5 + offset] || "N/A";
  const sentiment = cols[6 + offset] || "N/A";
  const purpose = cols[7 + offset] || "N/A";
  const patAdvCat = cols[8 + offset] || "N/A";
  const patType = cols[9 + offset] || "N/A";
  const visitType = cols[10 + offset] || "N/A";
  const primaryConcern = cols[11 + offset] || "N/A";
  const emotionalShift = cols[12 + offset] || "N/A";
  const trust = cols[13 + offset] || "N/A";
  const happy = cols[14 + offset] || "N/A";
  const happyReason = cols[15 + offset] || "N/A";
  const unhappy = cols[16 + offset] || "N/A";
  const unhappyReason = cols[17 + offset] || "N/A";
  const psat10 = toNum(cols[18 + offset]);
  const nps10 = toNum(cols[19 + offset]);
  const cg5 = toNum(cols[20 + offset]);
  const psat = toNum(cols[21 + offset]);
  const aiRec = cols[22 + offset] || "N/A";

  // Normalize concern categories
  let concern = primaryConcern;
  if (concern === "Not Applicable" || concern === "None" || concern === "N/A" || concern === "0") {
    concern = "Not Applicable";
  }

  // Normalize Patient_Advocate_Category
  let pac = patAdvCat;
  if (pac === "0" || pac === "N/A") pac = "N/A";

  // Normalize Patient_Type
  let pt = patType;
  if (pt === "0" || pt === "Guardian" || pt === "Attendant") {
    // Some new records have Guardian/Attendant in Patient_Type - normalize
    if (pt === "Guardian" || pt === "Attendant") {
      // Keep as-is for Patient_Advocate but fix Patient_Type
      pt = "N/A";
    }
    if (pt === "0") pt = "N/A";
  }

  // Normalize emotional shift abbreviations
  let shift = emotionalShift;
  if (shift === "Neutral to Positive") shift = "Neut to Pos";
  if (shift === "Neutral to Negative") shift = "Neut to Neg";
  if (shift === "Positive to Negative") shift = "Pos to Neg";
  if (shift === "Negative to Positive") shift = "Neg to Pos";

  // Infer churn threat from sentiment
  let churnThreat = "Low";
  if (sentiment === "Negative") churnThreat = "Medium";

  // Infer retention
  let retention = "Medium";
  if (sentiment === "Positive") retention = "High";
  if (sentiment === "Negative") retention = "Low";

  // Extract doctor mentions from AI recommendations
  let doctorFlag = "No";
  let doctorName = "N/A";
  let doctorCSAT = 0;
  const drMatch = aiRec.match(/Dr\.\s+([A-Za-z]+)/);
  if (drMatch) {
    doctorFlag = "Yes";
    doctorName = `Dr. ${drMatch[1]}`;
    doctorCSAT = sentiment === "Positive" ? 5 : sentiment === "Neutral" ? 3 : 2;
  }

  // Fix unhappy reason
  let uReason = unhappyReason;
  if (uReason === "No" || uReason === "0") uReason = "N/A";

  // Extract service issue from AI recommendations for unhappy reasons
  if (unhappy === "Yes" && uReason === "N/A") {
    // Try to extract from AI recommendations
    const actionMatch = aiRec.match(/Action[:\s]*(.+?)(?:\.|$)/i);
    if (actionMatch) uReason = actionMatch[1].trim().substring(0, 30);
  }

  return {
    Call_ID: callId,
    Agent_Name: cols[1] || "N/A",
    Duration: toNum(cols[3]),
    Customer_Name: cols[2] || "N/A",
    Intent: intent,
    Vibe: vibe,
    Sentiment: sentiment,
    Purpose: purpose,
    Patient_Advocate_Category: pac,
    Patient_Type: pt,
    Visit_Type: visitType,
    Primary_Concern_Category: concern,
    Emotional_Shift: shift,
    Trust_Confidence_Indicator: trust,
    Patient_Happy: happy,
    Happiness_Reason: happyReason,
    Patient_Unhappy: unhappy,
    Unhappy_Reason: uReason,
    Doctor_Mention_Flag: doctorFlag,
    Doctor_Name: doctorName,
    Doctor_CSAT: doctorCSAT,
    Clinic_Location: assignClinic(callId),
    Positive_Service_Drivers: "N/A",
    Competitor_Mention_Flag: "No",
    Competitor_Name: "N/A",
    Competitor_Reason: "N/A",
    Churn_Threat: churnThreat,
    Churn_Reason: "N/A",
    Retention_Propensity: retention,
    Insurance_Friction_Flag: "No",
    Patient_Satisfaction_Score_10: psat10,
    NPS_Score_10: nps10,
    Caregiver_Rating_5: cg5,
    Patient_Satisfaction_Score: psat,
    AI_Recommendations: aiRec,
  };
};

export const EXCEL_ROWS_MC235_MC594 = [
  `MC235|Yousef Al-Kaabi|Zayed Bin Omar Al-Farsi|116|Zeina|Service Req|Professional|Positive|Report Request|N/A|OPD|Procedure|Documentation|Stable|Present|Yes|Service 5/5|No|No|10|10|0|10|Process medical report request for work immediately.`,
  `MC236|Noura Al-Mazrouei|Hind Bint Khalid Al-Hammadi|59|Aisha|Follow-up|Reassuring|Positive|Recovery Check|N/A|OPD|Emergency|N/A|Neut to Pos|Present|Yes|Health fine|No|No|0|8|0|0|Maintain strong emergency follow-up protocols.`,
  `MC237|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Mazrouei|84|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|IPD|Admission|N/A|Stable|Present|Yes|Health okay|No|No|0|9|5|9|Success story for Orthopedic recovery.`,
  `MC238|Ali Al-Balushi|Yasmin Bint Rashid Al-Suwaidi|95|Mariam (Attd)|Follow-up|Professional|Positive|Recovery Check|N/A|Attendant|Admission|N/A|Neut to Pos|Present|Yes|Everything okay|No|No|0|9|5|9|Attendant satisfied with medication delivery fix.`,
  `MC239|Mariam Al-Shamsi|Abdullah Bin Saif Al-Qassimi|33|Not Specified|Health Check|Professional|Neutral|Recovery Check|N/A|N/A|N/A|N/A|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Patient in meeting; retry later.`,
  `MC240|Reem Al-Qassimi|Noura Bint Faisal Al-Balushi|81|Yousef|Service Req|Polite|Negative|Lost headphones|N/A|OPD|Visit|Process|Pos to Neg|Absent|No|N/A|Yes|Lost property|0|0|0|0|Action: Investigate lost property (headphones) and lack of reply.`,
  `MC241|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Kaabi|112|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Visit|N/A|Neut to Pos|Present|Yes|Consultation fine|No|No|5|8|4|8|Positive outpatient feedback for Eye Centre.`,
  `MC242|Fatima Al-Zahra|Fatima Bint Sultan Al-Shamsi|112|Jake (Mother)|Follow-up|Professional|Positive|Recovery Check|N/A|Guardian|Visit|N/A|Neut to Pos|Present|Yes|Health better|No|No|5|9|5|9|Smooth referral to Dr. Anand (Ortho).`,
  `MC243|Omar Al-Farsi|Khalid Bin Majid Al-Mansouri|71|Sister Fatima|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Procedure|N/A|Stable|Present|Yes|Nurses good|No|No|10|9|5|10|Praise for hospital cleanliness and nurses.`,
  `MC244|Aisha Al-Hammadi|Noor Bint Yousef Al-Maktoum|117|Not Specified|Health Follow-up|Professional|Positive|Recovery Check|N/A|IPD|Admission|Documentation|Neut to Pos|Present|Yes|Care good|No|No|0|9|5|0|Action: Expedite biopsy report delivery to the patient.`,
  `MC245|Yousef Al-Kaabi|Rashid Bin Salem Al-Nahyan|59|Not Specified|Feedback|Polite|Positive|Rating collection|N/A|OPD|Visit|N/A|Neut to Pos|Present|Yes|Everything fine|No|No|4|8|0|8|Consistently good outpatient feedback.`,
  `MC246|Noura Al-Mazrouei|Reem Bint Ali Al-Farsi|86|Not Specified|Follow-up|Polite|Positive|Rating collection|N/A|IPD|Admission|N/A|Neut to Pos|Present|Yes|Staff/Care 5/5|No|No|5|0|5|0|Exceptional scores for W&C caregivers.`,
  `MC247|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Hammadi|7|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Voicemail.`,
  `MC248|Ali Al-Balushi|Huda Bint Zayed Al-Mazrouei|93|Not Specified|Follow-up|Professional|Positive|Recovery Check|N/A|IPD|Admission|N/A|Neut to Pos|Present|Yes|Good service|No|No|0|10|0|10|Successful Ortho inpatient recovery check.`,
  `MC249|Mariam Al-Shamsi|Sultan Bin Nasser Al-Suwaidi|63|Khalid (Mother)|Follow-up|Courteous|Positive|Recovery Check|N/A|Guardian|Admission|N/A|Neut to Pos|Present|Yes|Everything good|No|No|0|0|0|0|Child is doing great; positive outcome.`,
  `MC250|Reem Al-Qassimi|Mona Bint Tariq Al-Qassimi|145|Not Specified|Follow-up|Professional|Positive|Recovery Check|N/A|IPD|Admission|N/A|Neut to Pos|Present|Yes|Perfect service|No|No|0|10|5|10|Staff were on the spot; excellent satisfaction.`,
  `MC251|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Balushi|50|Ayan (Guardian)|Service Req|Polite|Neutral|Phone Number Req|N/A|Guardian|N/A|General|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Transactional request for clinic phone number.`,
  `MC252|Fatima Al-Zahra|Yara Bint Abdullah Al-Kaabi|14|N/A|Unanswered|Unresponsive|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Call dropped.`,
  `MC253|Omar Al-Farsi|Ali Bin Fahad Al-Shamsi|162|Not Specified|Feedback|Polite|Positive|Rating collection|N/A|IPD|IPD|Service|Neut to Pos|Present|Yes|Good overall|Yes|Privacy intrusion|5|10|5|10|Action: Respect patient privacy; doctors/nurses entering too often.`,
  `MC254|Aisha Al-Hammadi|Amna Bint Ahmed Al-Mansouri|69|Rohan (Husband)|Follow-up|Courteous|Positive|Recovery Check|N/A|Attendant|Admission|N/A|Neut to Pos|Present|Yes|Feeling better|No|No|0|0|0|0|Successful post-admission check for Mrs. Shweta.`,
  `MC255|Yousef Al-Kaabi|Zayed Bin Omar Al-Maktoum|74|Not Specified|Feedback|Appreciative|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Medcare is top|No|No|5|10|0|10|Use Medcare is the top as a testimonial for Al Taawun branch.`,
  `MC256|Noura Al-Mazrouei|Hind Bint Khalid Al-Nahyan|80|Mother (Ra)|Feedback|Polite|Positive|Rating collection|Guardian|Guardian|IPD|Not Applicable|Neut to Pos|Present|Yes|Son much better|No|No|0|0|5|10|Strong pediatric care feedback for Dr. Sumaya.`,
  `MC257|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Farsi|36|Not Specified|Follow-up|Professional|Positive|Recovery Check|N/A|IPD|N/A|Not Applicable|Neut to Pos|N/A|N/A|N/A|No|No|0|0|0|0|Confirm final discharge satisfaction in next call.`,
  `MC258|Ali Al-Balushi|Yasmin Bint Rashid Al-Hammadi|77|Heba|Feedback|Polite|Positive|Rating collection|N/A|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Doctor excellent|No|No|5|9|5|9|Dr. Imad Fayyad highly recommended for procedures.`,
  `MC259|Mariam Al-Shamsi|Abdullah Bin Saif Al-Mazrouei|55|Not Specified|Follow-up|Reassuring|Positive|General Recovery|Attendant|Attendant|N/A|Not Applicable|Neut to Pos|Present|Yes|Things were good|No|No|0|0|0|0|Smooth post-procedure check for Youssef.`,
  `MC260|Reem Al-Qassimi|Noura Bint Faisal Al-Suwaidi|23|Not Specified|Follow-up|Professional|Positive|Recovery Check|Guardian|Guardian|N/A|Not Applicable|Neut to Pos|Present|Yes|Doctor amazing|No|No|0|0|0|0|Pediatric doctor highly praised by the mother.`,
  `MC261|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Qassimi|21|Not Specified|Rescheduling|Professional|Neutral|N/A|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Reschedule outreach required for Mr. Pedro.`,
  `MC262|Fatima Al-Zahra|Fatima Bint Sultan Al-Balushi|69|Fowzi|Follow-up|Professional|Positive|Recovery Check|N/A|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|5|9|0|9|Successful procedure follow-up.`,
  `MC263|Omar Al-Farsi|Khalid Bin Majid Al-Kaabi|54|Zaina|Follow-up|Satisfied|Positive|Recovery Check|N/A|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything excel.|No|No|5|10|0|10|High satisfaction for Al Riffa outpatient services.`,
  `MC264|Aisha Al-Hammadi|Noor Bint Yousef Al-Shamsi|87|Mr. Ramesh|Feedback|Courteous|Positive|Rating collection|N/A|IPD|Admission|Not Applicable|Stable|Present|Yes|Good health|No|No|0|0|4|0|Maintain consistent inpatient care at Al Safa.`,
  `MC265|Yousef Al-Kaabi|Rashid Bin Salem Al-Mansouri|72|Brother Ismail|Feedback|Professional|Positive|Rating collection|N/A|IPD|Admission|Not Applicable|Stable|Present|Yes|Mashallah good|No|No|4|8|4|8|Reliable IPD advocacy from patient Ismail.`,
  `MC266|Noura Al-Mazrouei|Reem Bint Ali Al-Maktoum|36|Maryam|Follow-up|Polite|Positive|Recovery Check|N/A|OPD|Emergency|Not Applicable|Stable|Present|Yes|You didnt fall short|No|No|0|0|0|0|Strong trust in Al Safa Emergency team.`,
  `MC267|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Nahyan|22|Harsha|Connection|Interrupted|Neutral|N/A|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Fix phone line quality for follow-up calls.`,
  `MC268|Ali Al-Balushi|Huda Bint Zayed Al-Farsi|17|Not Specified|Unclear|Disconnected|Neutral|N/A|N/A|N/A|N/A|Not Applicable|N/A|Absent|N/A|N/A|No|No|0|0|0|0|Disconnected call.`,
  `MC269|Mariam Al-Shamsi|Sultan Bin Nasser Al-Hammadi|90|Ms. Arcia (Attnd)|Follow-up|Professional|Positive|Recovery Check|Attendant|Attendant|N/A|Not Applicable|Stable|Present|Yes|Everything okay|No|No|4|0|4|0|Successful attendant feedback for Ms. Arcia.`,
  `MC270|Reem Al-Qassimi|Mona Bint Tariq Al-Mazrouei|65|Shireen|Follow-up|Polite|Positive|Recovery Check|N/A|OPD|Procedure|Not Applicable|Stable|Present|Yes|Staff fine|No|No|0|10|0|0|Consistently positive feedback for surgical staff.`,
  `MC271|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Suwaidi|1|N/A|N/A|Brief|Neutral|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Hello only/Dropped.`,
  `MC272|Fatima Al-Zahra|Yara Bint Abdullah Al-Qassimi|3|N/A|N/A|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Automated greeting.`,
  `MC273|Omar Al-Farsi|Ali Bin Fahad Al-Balushi|124|Zohan (Guardian)|Feedback|Reassuring|Positive|Rating collection|Guardian|Guardian|IPD|Not Applicable|Neut to Pos|Present|Yes|Extremely satis.|No|No|0|10|5|10|Exceptional pediatric inpatient rating (10/10).`,
  `MC274|Aisha Al-Hammadi|Amna Bint Ahmed Al-Kaabi|59|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|Nothing like it|No|No|0|10|5|10|High retention; patient states Medcare honestly nothing like it.`,
  `MC275|Yousef Al-Kaabi|Zayed Bin Omar Al-Shamsi|63|Umm Lama|Feedback|Polite|Positive|Rating collection|Guardian|N/A|N/A|Not Applicable|Stable|Present|Yes|Excellent service|No|No|5|10|0|10|Consistently high satisfaction for pediatric care.`,
  `MC276|Noura Al-Mazrouei|Hind Bint Khalid Al-Mansouri|37|Ministry of Endowments|Courtesy|Polite|Positive|N/A|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Brief courtesy check-in by external party.`,
  `MC277|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Maktoum|105|Mr. Prasad|Feedback|Professional|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Stable|Present|Yes|All good|No|No|0|9|5|0|High satisfaction for Al Safa consultation.`,
  `MC278|Ali Al-Balushi|Yasmin Bint Rashid Al-Nahyan|206|Umm Nadia|Service Req|Professional|Neutral|Appt Scheduling|Guardian|N/A|N/A|Process|Stable|Present|Yes|Dr. Amr continuity|No|No|0|0|0|0|Action: Schedule follow-up with Dr. Amr as requested.`,
  `MC279|Mariam Al-Shamsi|Abdullah Bin Saif Al-Farsi|63|Abu Hamza|Follow-up|Professional|Positive|Post-procedure|Guardian|Guardian|N/A|Not Applicable|Neut to Pos|Present|Yes|Everything okay|No|No|0|0|0|0|Positive post-procedure outcome for child.`,
  `MC280|Reem Al-Qassimi|Noura Bint Faisal Al-Hammadi|111|Not Specified|Feedback|Polite|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Dr. Cooperative|No|No|10|10|0|10|Dr. Ashwath highly praised for IPD care.`,
  `MC281|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Mazrouei|7|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Voicemail.`,
  `MC282|Fatima Al-Zahra|Fatima Bint Sultan Al-Suwaidi|90|Guardian (Zaid)|Follow-up|Professional|Positive|Recovery Check|Guardian|N/A|Emergency|Not Applicable|Neut to Pos|Present|Yes|Service fine|No|No|0|10|5|10|Proactive follow-up for fever symptoms.`,
  `MC283|Omar Al-Farsi|Khalid Bin Majid Al-Qassimi|106|Mr. Sharma|Feedback|Professional|Positive|Rating collection|Guardian|Guardian|IPD|Not Applicable|Neut to Pos|Present|Yes|Fantastic service|No|No|0|10|5|10|Strong advocacy for Royal Hospital.`,
  `MC284|Aisha Al-Hammadi|Noor Bint Yousef Al-Balushi|63|Naseem|Feedback|Positive|Positive|Rating collection|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|Full marks|No|No|5|10|0|10|High retention for Al Safa Emergency.`,
  `MC285|Yousef Al-Kaabi|Rashid Bin Salem Al-Kaabi|53|Not Specified|Follow-up|Professional|Positive|Recovery Check|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|5|0|5|0|Exceptional feedback for Ortho hospital.`,
  `MC286|Noura Al-Mazrouei|Reem Bint Ali Al-Shamsi|76|Not Specified|Feedback|Positive|Positive|Rating collection|Attendant|Attendant|IPD|Not Applicable|Neut to Pos|Present|Yes|All perfect|No|No|10|0|5|10|Dr. Siddharth and nursing team praised.`,
  `MC287|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Mansouri|19|Not Specified|Deferral|Polite|Neutral|N/A|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Requested callback.`,
  `MC288|Ali Al-Balushi|Huda Bint Zayed Al-Maktoum|59|Not Specified|Feedback|Calm|Positive|Rating collection|Patient|OPD|Procedure|Not Applicable|Stable|Present|Yes|Everything fine|No|No|5|10|0|10|Consistent OPD satisfaction scores.`,
  `MC289|Mariam Al-Shamsi|Sultan Bin Nasser Al-Nahyan|109|Haider Ali|Follow-up|Professional|Positive|Recovery Check|Patient|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|0|10|5|10|Smooth follow-up for Haider Ali.`,
  `MC290|Reem Al-Qassimi|Mona Bint Tariq Al-Farsi|39|Zainab|Feedback|Polite|Neutral|Qualitative FB|Patient|OPD|Visit|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Brief feedback check; no comments.`,
  `MC291|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Hammadi|139|April|Follow-up|Polite|Positive|Recovery Check|Patient|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|Very amazing|No|No|0|10|5|10|Dr. Rehab highly praised; strong trust.`,
  `MC292|Fatima Al-Zahra|Yara Bint Abdullah Al-Mazrouei|271|Not Specified|Follow-up|Professional|Positive|Recovery Check|Patient|IPD|Admission|Service|Neut to Pos|Present|Yes|Supportive staff|Yes|Painful anesthesia|5|0|5|5|Action: Investigate report of painful anesthesia.`,
  `MC293|Omar Al-Farsi|Ali Bin Fahad Al-Suwaidi|80|Maria|Feedback|Positive|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Stable|Present|Yes|Very happy|No|No|5|10|5|10|Strong repeat loyalty confirmed.`,
  `MC294|Aisha Al-Hammadi|Amna Bint Ahmed Al-Qassimi|111|Not Specified|Follow-up|Professional|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|Everything good|No|No|5|10|5|10|Excellent scores for Sharjah OPD.`,
  `MC295|Yousef Al-Kaabi|Zayed Bin Omar Al-Balushi|70|Not Specified|Follow-up|Positive|Positive|Recovery Check|N/A|OPD|Procedure|Not Applicable|Stable|Present|Yes|Hospital amazing|No|No|5|10|0|10|Strong advocacy for Sharjah surgical care.`,
  `MC296|Noura Al-Mazrouei|Hind Bint Khalid Al-Kaabi|62|Ahmed (Father)|Follow-up|Professional|Positive|Recovery Check|Guardian|Guardian|N/A|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|0|0|0|0|Simple recovery check for 14-year old patient.`,
  `MC297|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Shamsi|45|Father of Nawal|Health Follow-up|Courteous|Positive|Recovery Check|Guardian|Guardian|N/A|Not Applicable|Neut to Pos|Present|Yes|It was all good|No|No|0|0|0|0|Successful health follow-up for Mirdif clinic.`,
  `MC298|Ali Al-Balushi|Yasmin Bint Rashid Al-Mansouri|64|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Staff didnt fall short|No|No|5|10|0|10|High staff praise for Sharjah branch.`,
  `MC299|Mariam Al-Shamsi|Abdullah Bin Saif Al-Maktoum|56|Not Specified|Feedback|Polite|Positive|Rating collection|N/A|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|5|10|0|10|Consistently high scores for Sharjah emergency.`,
  `MC300|Reem Al-Qassimi|Noura Bint Faisal Al-Nahyan|53|Sister Lana|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Procedure|Not Applicable|Stable|Present|Yes|Everything okay|No|No|5|10|0|10|Successful procedure recovery follow-up.`,
  `MC301|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Farsi|40|Mr. RJ|Follow-up|Polite|Neutral|Recovery Check|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Health/Service fine|No|No|0|0|0|0|Standard recovery check-in.`,
  `MC302|Fatima Al-Zahra|Fatima Bint Sultan Al-Hammadi|3|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Voicemail.`,
  `MC303|Omar Al-Farsi|Khalid Bin Majid Al-Mazrouei|57|Khalil|Feedback|Polite|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything excellent|No|No|5|10|0|10|Excellent outpatient feedback.`,
  `MC304|Aisha Al-Hammadi|Noor Bint Yousef Al-Suwaidi|26|Not Specified|Follow-up|Empathetic|Negative|Recovery Check|N/A|IPD|Admission|Not Applicable|Neut to Neg|N/A|No|N/A|No|No|0|0|0|0|Critical: Patient reported they are still in ICU.`,
  `MC305|Yousef Al-Kaabi|Rashid Bin Salem Al-Qassimi|31|Rincy Attnd|Follow-up|Polite|Neutral|Recovery Check|Attendant|IPD|Admission|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Requested callback for health check.`,
  `MC306|Noura Al-Mazrouei|Reem Bint Ali Al-Balushi|106|Um Sultan|Service Req|Polite|Positive|Lab result issue|Guardian|Guardian|N/A|Process|Neut to Pos|Present|Yes|Services fine|Yes|Lab notification|5|10|0|10|Action: Improve notification protocol for eye swab results.`,
  `MC307|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Kaabi|74|Sister Walaa|Feedback|Polite|Positive|Rating collection|N/A|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|5|10|0|10|Success case for outpatient procedure.`,
  `MC308|Ali Al-Balushi|Huda Bint Zayed Al-Shamsi|83|Not Specified|Feedback|Courteous|Positive|Rating collection|N/A|OPD|Checkup|Not Applicable|Neut to Pos|Present|Yes|Super/Very nice|No|No|10|10|5|10|Excellent scores for Medcare Sarjapur.`,
  `MC309|Mariam Al-Shamsi|Sultan Bin Nasser Al-Mansouri|77|Mr. Imran (Attnd)|Feedback|Professional|Positive|Rating collection|Attendant|Attendant|IPD|Not Applicable|Stable|Present|Yes|Service was good|No|No|5|10|5|10|High scores for W&C Hospital.`,
  `MC310|Reem Al-Qassimi|Mona Bint Tariq Al-Maktoum|87|Maria Vargas|Follow-up|Polite|Positive|Recovery Check|Attendant|Attendant|N/A|Not Applicable|Stable|Present|Yes|Everything wonderful|No|No|5|10|5|10|Jumeirah clinic regular customer; high loyalty.`,
  `MC311|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Nahyan|199|Not Specified|Service Req|Professional|Positive|Issue Resolution|Patient|IPD|Admission|Service|Neut to Pos|Present|Yes|Service fine|Yes|Painkiller schedule|5|10|4|10|Action: Retrain staff on painkiller medication schedules.`,
  `MC312|Fatima Al-Zahra|Yara Bint Abdullah Al-Farsi|24|Abu Sidra|Feedback|Polite|Neutral|Evaluation Check|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Administrative check on prior evaluation.`,
  `MC313|Omar Al-Farsi|Ali Bin Fahad Al-Hammadi|108|Not Specified|Feedback|Professional|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|No complaints|No|No|10|10|5|10|Reliable high scores for Al Safa OPD.`,
  `MC314|Aisha Al-Hammadi|Amna Bint Ahmed Al-Mazrouei|73|Brother Muhammad|Feedback|Positive|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|5|10|0|10|Strong advocacy for Discovery Garden branch.`,
  `MC315|Yousef Al-Kaabi|Zayed Bin Omar Al-Suwaidi|37|Nurul Sham|Health Follow-up|Polite/Brief|Neutral|Recovery Check|N/A|OPD|Emergency|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Patient unavailable; requested callback.`,
  `MC316|Noura Al-Mazrouei|Hind Bint Khalid Al-Qassimi|100|Brother Sharif|Feedback|Appreciative|Positive|Rating collection|N/A|OPD|Procedure|Not Applicable|Stable|Present|Yes|Best in life|No|No|5|10|0|10|Excellent testimonial source; high brand advocacy.`,
  `MC317|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Balushi|61|Sister Shaimaa|Feedback|Professional|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Quick service|No|No|0|10|0|0|High satisfaction with efficiency/speed.`,
  `MC318|Ali Al-Balushi|Yasmin Bint Rashid Al-Kaabi|63|Not Specified|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Everything good|No|No|5|10|0|10|Positive feedback for Women & Children OPD.`,
  `MC319|Mariam Al-Shamsi|Abdullah Bin Saif Al-Shamsi|63|Attendant|Follow-up|Professional|Neutral|Recovery Check|Attendant|IPD|Admission|General|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Factual check-in; no ratings collected.`,
  `MC320|Reem Al-Qassimi|Noura Bint Faisal Al-Mansouri|58|Ms. Lubna|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Everything fine|No|No|0|10|0|0|Consistently positive Motor City feedback.`,
  `MC321|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Maktoum|106|Miss Naima|Follow-up|Professional|Positive|Rating collection|N/A|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Nurses attentive|No|No|0|10|5|10|High praise for nursing attentiveness.`,
  `MC322|Fatima Al-Zahra|Fatima Bint Sultan Al-Nahyan|37|Mr. Sandeep|Follow-up|Professional|Neutral|Recovery Check|N/A|OPD|Consultation|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Patient busy; requested callback.`,
  `MC323|Omar Al-Farsi|Khalid Bin Majid Al-Farsi|69|Mr. Ibrahim|Follow-up|Reassuring|Positive|Recovery Check|N/A|OPD|Procedure|Not Applicable|Stable|Present|Yes|Respectful staff|No|No|5|10|0|10|High scores for Sharjah staff professionalism.`,
  `MC324|Aisha Al-Hammadi|Noor Bint Yousef Al-Hammadi|53|Sister Nouha|Feedback|Polite|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Medcare beautiful|No|No|5|10|0|10|Excellent feedback for Eye Centre (SZR).`,
  `MC325|Yousef Al-Kaabi|Rashid Bin Salem Al-Mazrouei|61|Br. Muhammad|Feedback|Appreciative|Positive|Rating collection|N/A|OPD|Emergency|Not Applicable|Stable|Present|Yes|Everything excel.|No|No|5|10|0|10|Strong advocacy for Al Safa Emergency.`,
  `MC326|Noura Al-Mazrouei|Reem Bint Ali Al-Suwaidi|86|Umm Rashid|Follow-up|Positive|Positive|Recovery Check|Guardian|Guardian|OPD|Not Applicable|Stable|Present|Yes|Service excel.|No|No|0|0|0|0|Strong loyalty; always refer to Medcare.`,
  `MC327|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Qassimi|75|Not Specified|Feedback|Appreciative|Positive|Rating collection|N/A|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Efforts wonderful|No|No|10|10|5|10|Sharjah procedure feedback is highly positive.`,
  `MC328|Ali Al-Balushi|Huda Bint Zayed Al-Balushi|59|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|10|10|5|10|High satisfaction for ophthalmology clinic.`,
  `MC329|Mariam Al-Shamsi|Sultan Bin Nasser Al-Kaabi|59|Brother Wael|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|5|10|5|10|Successful follow-up for outpatient visit.`,
  `MC330|Reem Al-Qassimi|Mona Bint Tariq Al-Shamsi|88|Not Specified|Follow-up|Professional|Positive|Recovery Check|N/A|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|All was good|No|No|5|10|5|10|Positive recovery check at W&C.`,
  `MC331|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Mansouri|172|Zubia|Follow-up|Empathetic|Positive|Baby monitor|Guardian|Guardian|IPD|General|Neut to Pos|Present|Yes|Absolutely fine|No|No|10|0|0|10|High pediatric satisfaction; 10/10 for service.`,
  `MC332|Fatima Al-Zahra|Yara Bint Abdullah Al-Maktoum|81|Not Specified|Follow-up|Polite|Positive|Recovery Check|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Staff great job|No|No|4|9|0|9|Praise for Sharjah staff responsibility.`,
  `MC333|Omar Al-Farsi|Ali Bin Fahad Al-Nahyan|41|Miss Lilia|Health Check|Professional|Neutral|Recovery Check|Attendant|Attendant|IPD|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Assistant confirmed patient is doing well.`,
  `MC334|Aisha Al-Hammadi|Amna Bint Ahmed Al-Farsi|43|Umm Muhammad|Follow-up|Polite|Neutral|Recovery Check|Patient|OPD|Visit|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Confirmed feedback was provided previously.`,
  `MC335|Yousef Al-Kaabi|Zayed Bin Omar Al-Hammadi|76|Brother Hassan|Feedback|Polite|Positive|Rating Collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Felt better|No|No|5|9|0|0|Dr. Abeer treatment for allergy was highly effective.`,
  `MC336|Noura Al-Mazrouei|Hind Bint Khalid Al-Mazrouei|69|Abu Farida|Follow-up|Professional|Positive|Rating Collection|Guardian|Guardian|N/A|Not Applicable|Stable|Present|Yes|Everything perfect|No|No|5|10|0|10|Consistently high satisfaction for Motor City clinic.`,
  `MC337|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Suwaidi|60|Mother of Emily|Follow-up|Polite|Positive|Recovery Check|Guardian|Guardian|IPD|Not Applicable|Neut to Pos|Present|Yes|Happy with service|No|No|0|0|0|0|Smooth recovery for pediatric inpatient.`,
  `MC338|Ali Al-Balushi|Yasmin Bint Rashid Al-Qassimi|29|Manal|Follow-up|Professional|Neutral|Recovery Check|N/A|OPD|Procedure|Not Applicable|Stable|Present|Yes|Everything fine|No|No|0|0|0|0|Brief follow-up confirmed satisfaction.`,
  `MC339|Mariam Al-Shamsi|Abdullah Bin Saif Al-Balushi|70|Miss Camila (Husband)|Follow-up|Courteous|Positive|Recovery Check|Attendant|Attendant|IPD|Not Applicable|Stable|Present|Yes|Assistant help|No|No|0|0|0|0|Proactive health check successfully confirmed recovery.`,
  `MC340|Reem Al-Qassimi|Noura Bint Faisal Al-Kaabi|47|Not Specified|Follow-up|Polite|Neutral|Recovery Check|N/A|OPD|Consultation|Not Applicable|Stable|Present|Yes|All good|No|No|0|0|0|0|Standard health follow-up for Sharjah Hospital.`,
  `MC341|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Shamsi|191|Not Specified|Feedback|Professional|Positive|Rating Collection|N/A|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Nurse helpful|No|No|5|10|5|10|Nurse Iman highly praised; model for staff training.`,
  `MC342|Fatima Al-Zahra|Fatima Bint Sultan Al-Mansouri|228|Not Specified|Feedback|Positive|Positive|Rating Collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Service good|No|No|5|10|5|10|Loyalty for 15+ years; patient is a brand ambassador.`,
  `MC343|Omar Al-Farsi|Khalid Bin Majid Al-Maktoum|52|Not Specified|Service Req|Professional|Neutral|Report Request|N/A|OPD|Visit|Documentation|Stable|N/A|N/A|N/A|Yes|MRI report wait|0|0|0|0|Action: Deliver MRI report as patient is still waiting.`,
  `MC344|Aisha Al-Hammadi|Noor Bint Yousef Al-Nahyan|110|Miss Camilla|Feedback|Professional|Positive|Rating Collection|N/A|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Very good|No|No|5|10|5|10|Strong inpatient advocacy at Women & Children.`,
  `MC345|Yousef Al-Kaabi|Rashid Bin Salem Al-Farsi|58|Not Specified|Feedback|Positive|Positive|Rating Collection|N/A|OPD|Visit|Not Applicable|Stable|Present|Yes|Perfect|No|No|5|10|5|10|Brand loyalty of 16 years maintained.`,
  `MC346|Noura Al-Mazrouei|Reem Bint Ali Al-Hammadi|28|Father of Muhammad|Follow-up|Polite|Positive|Recovery Check|Attendant|Attendant|Emergency|Not Applicable|Neut to Pos|Present|Yes|Fine|No|No|0|0|0|0|Positive post-ER recovery for child.`,
  `MC347|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Mazrouei|108|Not Specified|Feedback|Professional|Positive|Rating Collection|N/A|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|No complaints|No|No|5|10|5|10|High satisfaction for Mirdif Uptown branch.`,
  `MC348|Ali Al-Balushi|Huda Bint Zayed Al-Suwaidi|86|Not Specified|Follow-up|Professional|Positive|Rating Collection|N/A|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|5|9|5|9|Consistent positive inpatient scores.`,
  `MC349|Mariam Al-Shamsi|Sultan Bin Nasser Al-Qassimi|186|Not Specified|Feedback|Professional|Positive|Rating Collection|N/A|IPD|Admission|Service|Neut to Pos|Present|Yes|Doctors nice|Yes|Anesthesia feedback|5|10|5|10|Action: Do not ask feedback questions while patient is under anesthesia.`,
  `MC350|Reem Al-Qassimi|Mona Bint Tariq Al-Balushi|103|Not Specified|Feedback|Professional|Positive|Rating Collection|N/A|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Went well|No|No|5|8|5|8|Positive inpatient loyalty at Sharjah.`,
  `MC351|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Kaabi|115|Mr. Ahmed|Feedback|Professional|Positive|Rating Collection|N/A|OPD|Visit|Process|Stable|Present|Yes|Dr. Ahmed best|Yes|Pharmacy congestion|5|9|5|9|Action: Solve congestion/traffic issues at Sharjah pharmacy.`,
  `MC352|Fatima Al-Zahra|Yara Bint Abdullah Al-Shamsi|51|Father of Rian|Follow-up|Professional|Positive|Recovery Check|Guardian|Guardian|Emergency|Not Applicable|Neut to Pos|Present|Yes|Doing fine|No|No|0|0|0|0|Successful pediatric emergency follow-up.`,
  `MC353|Omar Al-Farsi|Ali Bin Fahad Al-Mansouri|176|Mother (Guardian)|Feedback|Polite|Positive|Rating Collection|Guardian|Guardian|Visit|Service|Stable|Present|Yes|Excellent care|Yes|Pharmacy counters|5|0|0|0|Action: Increase pharmacy counters to compete with Medclinic Parkview.`,
  `MC354|Aisha Al-Hammadi|Amna Bint Ahmed Al-Maktoum|58|Fatima|Feedback|Polite|Positive|Rating collection|N/A|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Perfect service|No|No|5|10|0|10|High retention for long-term loyal patient.`,
  `MC355|Yousef Al-Kaabi|Zayed Bin Omar Al-Nahyan|88|Jessica|Feedback|Professional|Positive|Rating collection|Patient|IPD|Inpatient|Not Applicable|Neut to Pos|Present|Yes|Everything excellent|No|No|5|10|5|10|Excellent pediatric follow-up.`,
  `MC356|Noura Al-Mazrouei|Hind Bint Khalid Al-Farsi|73|Mary Attd|Service Req|Professional|Neutral|Documentation|N/A|Attendant|N/A|Documentation|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Updated contact number.`,
  `MC357|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Hammadi|139|Dhanika Father|Feedback|Professional|Neutral|Rating collection|N/A|Guardian|IPD|Service|Stable|Present|Yes|All good|Yes|Food delivery speed|5|9|5|0|Address food delivery speed.`,
  `MC358|Ali Al-Balushi|Yasmin Bint Rashid Al-Mazrouei|122|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Service|Neut to Pos|Present|Yes|Everything great|Yes|Valet speed|5|8|5|0|Action: Improve valet speed.`,
  `MC359|Mariam Al-Shamsi|Abdullah Bin Saif Al-Suwaidi|45|Sister Safa Hub|Follow-up|Professional|Positive|Recovery Check|N/A|Attendant|Emergency|Not Applicable|Neut to Pos|Present|Yes|Health fine|No|No|0|0|0|0|Successful ER follow-up.`,
  `MC360|Reem Al-Qassimi|Noura Bint Faisal Al-Qassimi|343|Sril Lobo Mom|Follow-up|Concerned|Neutral|Recovery Check|N/A|Guardian|IPD|Service|Stable|Present|Yes|Fine except mistake|Yes|Injection error|5|9|5|0|Action: Audit injection error.`,
  `MC361|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Balushi|29|Not Specified|Follow-up|Empathetic|Neutral|Recovery Check|N/A|IPD|ICU|Not Applicable|Neg to Pos|Present|Yes|Fine now|No|No|0|0|0|0|Patient in ICU; monitor recovery.`,
  `MC362|Fatima Al-Zahra|Fatima Bint Sultan Al-Kaabi|80|Maria|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|5|10|5|10|Strong repeat loyalty.`,
  `MC363|Omar Al-Farsi|Khalid Bin Majid Al-Shamsi|59|Zaynab|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Stable|Present|Yes|Everything fine|No|No|4|8|4|0|Reliable procedure feedback.`,
  `MC364|Aisha Al-Hammadi|Noor Bint Yousef Al-Mansouri|51|Yazid Father|Follow-up|Professional|Neutral|Recovery Check|N/A|Guardian|IPD|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Scheduled callback.`,
  `MC365|Yousef Al-Kaabi|Rashid Bin Salem Al-Maktoum|50|Muhammad Ali|Follow-up|Professional|Neutral|Recovery Check|N/A|IPD|IPD|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Routine inpatient check.`,
  `MC366|Noura Al-Mazrouei|Reem Bint Ali Al-Nahyan|77|Kauthar Attd|Feedback|Professional|Positive|Rating collection|N/A|Attendant|Inpatient|Not Applicable|Stable|Present|Yes|Everything blessed|No|No|5|10|0|10|High satisfaction for care.`,
  `MC367|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Farsi|81|Ms. Renny|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Good service|No|No|5|10|5|10|Consistently high scores.`,
  `MC368|Ali Al-Balushi|Huda Bint Zayed Al-Hammadi|81|Marwa Mother|Follow-up|Professional|Positive|Recovery Check|N/A|Guardian|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Taken care of|No|No|0|0|0|0|High pediatric trust.`,
  `MC369|Mariam Al-Shamsi|Sultan Bin Nasser Al-Mazrouei|43|Not Specified|Follow-up|Professional|Positive|Recovery Check|N/A|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|Fine|No|No|0|0|0|0|Successful ER follow-up.`,
  `MC370|Reem Al-Qassimi|Mona Bint Tariq Al-Suwaidi|120|Mohammed Qasim|Follow-up|Professional|Positive|Recovery Check|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Very nice|No|No|5|8|5|0|Dr. Paraneet highly praised.`,
  `MC371|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Qassimi|52|Not Specified|Follow-up|Professional|Neutral|Recovery Check|N/A|OPD|Outpatient|Not Applicable|Stable|Present|Yes|All good|No|No|0|0|0|0|Smooth outpatient follow-up.`,
  `MC372|Fatima Al-Zahra|Yara Bint Abdullah Al-Balushi|203|Aisha Father|Feedback|Professional|Neutral|Rating collection|N/A|Guardian|Outpatient|Service|Stable|Present|Yes|All good|Yes|Doctor hurry|4|8|4|0|Improve Dr. friendliness (hurry).`,
  `MC373|Omar Al-Farsi|Ali Bin Fahad Al-Kaabi|80|Ms. Sana Attd|Follow-up|Professional|Positive|Recovery Check|N/A|Attendant|Emergency|Not Applicable|Neut to Pos|Present|Yes|Very good|No|No|0|0|0|0|Proactive ER follow-up.`,
  `MC374|Aisha Al-Hammadi|Amna Bint Ahmed Al-Shamsi|36|Joel Mother|Follow-up|Polite|Positive|Recovery Check|N/A|Guardian|Emergency|Not Applicable|Stable|Present|Yes|Everything okay|No|No|0|0|0|0|Factual check-in completed.`,
  `MC375|Yousef Al-Kaabi|Zayed Bin Omar Al-Mansouri|59|Mr. Ahmed|Health Follow-up|Cordial|Positive|Recovery Assessment|N/A|OPD|Outpatient|Not Applicable|Stable|Present|Yes|Everything great|No|No|5|10|0|10|Consistently positive OPD outcome.`,
  `MC376|Noura Al-Mazrouei|Hind Bint Khalid Al-Maktoum|61|Ms. Rafna|Health Follow-up|Professional|Positive|Recovery Assessment|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Full marks|No|No|10|10|0|10|High satisfaction for Dr. Farza clinic.`,
  `MC377|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Nahyan|56|Umm Al-Hana|Health Follow-up|Professional|Positive|Recovery Assessment|N/A|Guardian|N/A|Not Applicable|Stable|Present|Yes|Better health|No|No|5|10|0|10|Successful pediatric follow-up at Royal.`,
  `MC378|Ali Al-Balushi|Yasmin Bint Rashid Al-Farsi|4|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Unanswered.`,
  `MC379|Mariam Al-Shamsi|Abdullah Bin Saif Al-Hammadi|28|Umm Rashid|Health Follow-up|Professional|Neutral|Recovery Assessment|N/A|Guardian|N/A|Not Applicable|Neg to Pos|Present|Yes|Health fine|No|No|0|0|0|0|Patient confirmed Fine despite tiredness.`,
  `MC380|Reem Al-Qassimi|Noura Bint Faisal Al-Mazrouei|101|Not Specified|Feedback|Appreciative|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Perfect service|No|No|0|10|0|10|Dr. Azza highly praised.`,
  `MC381|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Suwaidi|114|Not Specified|Feedback|Professional|Neutral|Rating collection|N/A|OPD|Outpatient|Not Applicable|Stable|Present|Yes|Service okay|No|No|8|7|4|8|Positive clinic feedback; passive NPS.`,
  `MC382|Fatima Al-Zahra|Fatima Bint Sultan Al-Qassimi|39|Mrs. Khatrina|Health Follow-up|Routine|Neutral|Recovery Assessment|N/A|OPD|Emergency|Not Applicable|Stable|Present|Yes|Fine|No|No|0|0|0|0|Successful Sharjah Emergency follow-up.`,
  `MC383|Omar Al-Farsi|Khalid Bin Majid Al-Balushi|88|Sir (Attendant)|Health Follow-up|Professional|Positive|Recovery Assessment|N/A|Attendant|Inpatient|Not Applicable|Neut to Pos|Present|Yes|10/10 Rating|No|No|0|0|0|0|High attendant satisfaction for Dr. Kavita.`,
  `MC384|Aisha Al-Hammadi|Noor Bint Yousef Al-Kaabi|68|Not Specified|Feedback|Reassuring|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Everything good|No|No|5|10|0|10|Dr. Razmi outpatient care rated 10/10.`,
  `MC385|Yousef Al-Kaabi|Rashid Bin Salem Al-Shamsi|101|Mother of Ihap|Follow-up|Polite|Positive|Rating collection|N/A|Guardian|Inpatient|Not Applicable|Neut to Pos|Present|Yes|Much better|No|No|8|9|5|9|Consistently high scores for pediatric IPD.`,
  `MC386|Noura Al-Mazrouei|Reem Bint Ali Al-Mansouri|61|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Good health|No|No|0|10|5|10|Excellent outpatient feedback.`,
  `MC387|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Maktoum|144|Attendant|Service Req|Professional|Positive|Insurance Follow-up|N/A|Attendant|N/A|Process|Neut to Pos|Present|Yes|Asistencia|Yes|Prescription speed|0|8|0|8|Action: Speed up medication prescription procedures.`,
  `MC388|Ali Al-Balushi|Huda Bint Zayed Al-Nahyan|19|Sister Mona|Follow-up|Brief|Neutral|Courtesy Check|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Disengaged call.`,
  `MC389|Mariam Al-Shamsi|Sultan Bin Nasser Al-Farsi|47|Not Specified|Health Follow-up|Professional|Neutral|Recovery Assessment|N/A|IPD|Inpatient|Not Applicable|Stable|N/A|Yes|Good service|No|No|0|0|0|0|Patient busy; requested callback.`,
  `MC390|Reem Al-Qassimi|Mona Bint Tariq Al-Hammadi|39|Mother (Mia)|Health Follow-up|Professional|Positive|Recovery Assessment|N/A|Guardian|Emergency|Not Applicable|Neut to Pos|Present|Yes|Fine|No|No|0|0|0|0|Smooth post-ER pediatric check.`,
  `MC391|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Mazrouei|73|Mother (Ahmed)|Health Follow-up|Polite|Neutral|Recovery Assessment|N/A|Guardian|N/A|Not Applicable|Stable|Present|Yes|Everything okay|No|No|0|0|0|0|Factual pediatric check-up.`,
  `MC392|Fatima Al-Zahra|Yara Bint Abdullah Al-Suwaidi|64|Ya Hamid|Follow-up|Reassuring|Positive|Recovery Assessment|N/A|OPD|Emergency|Not Applicable|Stable|Present|Yes|Service 100%|No|No|10|10|0|10|Service 100% - Exceptional advocacy.`,
  `MC393|Omar Al-Farsi|Ali Bin Fahad Al-Qassimi|36|Nandika Attnd|Follow-up|Polite|Neutral|Recovery Assessment|N/A|Guardian|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Guardian busy; requested callback.`,
  `MC394|Aisha Al-Hammadi|Amna Bint Ahmed Al-Balushi|110|Not Specified|Follow-up|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Good service|No|No|0|9|5|9|Positive outpatient follow-up.`,
  `MC395|Yousef Al-Kaabi|Zayed Bin Omar Al-Kaabi|106|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Stable|Present|Yes|Praise be to God|No|No|5|8|0|0|High satisfaction for Al Safa visit.`,
  `MC396|Noura Al-Mazrouei|Hind Bint Khalid Al-Shamsi|8|Not Specified|N/A|Transactional|Neutral|N/A|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|External party call; not a patient.`,
  `MC397|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Mansouri|133|Ms. Ghadir|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|4|9|4|0|High loyalty for pediatric consultation.`,
  `MC398|Ali Al-Balushi|Yasmin Bint Rashid Al-Maktoum|200|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Happy with doctor|No|No|10|10|5|10|15+ years of loyalty; strong doctor bond.`,
  `MC399|Mariam Al-Shamsi|Abdullah Bin Saif Al-Nahyan|88|Umm Hamza|Feedback|Appreciative|Positive|Rating collection|N/A|Guardian|Guardian|Not Applicable|Stable|Present|Yes|Doctor wonderful|No|No|0|10|0|0|Dr. Tib highly praised for pediatric care.`,
  `MC400|Reem Al-Qassimi|Noura Bint Faisal Al-Farsi|40|Not Specified|Health Follow-up|Professional|Neutral|Recovery Check|N/A|Guardian|N/A|Not Applicable|Stable|Present|Yes|Fine|No|No|0|0|0|0|Child Ahmed is fine; routine check done.`,
  `MC401|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Hammadi|75|Not Specified|Feedback|Polite|Positive|Rating collection|N/A|Attendant|Inpatient|Not Applicable|Stable|Present|Yes|Everything okay|No|No|10|10|5|10|Mother appointment check successful.`,
  `MC402|Fatima Al-Zahra|Fatima Bint Sultan Al-Mazrouei|94|Not Specified|Feedback|Courteous|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Good services|No|No|5|10|5|10|Positive feedback for Mother Clinic (Jumeirah).`,
  `MC403|Omar Al-Farsi|Khalid Bin Majid Al-Suwaidi|5|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Voicemail.`,
  `MC404|Aisha Al-Hammadi|Noor Bint Yousef Al-Qassimi|81|Not Specified|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Stable|Present|Yes|Nothing beats Medcare|No|No|10|0|0|10|Strong advocacy: I have been coming for 8 years.`,
  `MC405|Yousef Al-Kaabi|Rashid Bin Salem Al-Balushi|80|Mr. Faizan (Attd)|Follow-up|Professional|Positive|Rating collection|N/A|Attendant|Inpatient|Not Applicable|Neut to Pos|Present|Yes|Happy with it|No|No|5|10|4|10|Exceptional inpatient satisfaction for ER visit.`,
  `MC406|Noura Al-Mazrouei|Reem Bint Ali Al-Kaabi|15|Miss Monica|N/A|Brief|Neutral|N/A|N/A|N/A|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Disengaged call; patient had no time.`,
  `MC407|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Shamsi|163|Not Specified|Service Req|Constructive|Positive|Issue Resolution|N/A|Attendant|N/A|Process|Neut to Pos|Present|Yes|Everything good|Yes|Pre-procedure wait|0|10|5|10|Action: Shorten pre-procedure wait times for elderly.`,
  `MC408|Ali Al-Balushi|Huda Bint Zayed Al-Mansouri|60|Not Specified|Feedback|Professional|Positive|Rating collection|N/A|OPD|Outpatient|Not Applicable|Stable|Present|Yes|Alhamdulillah|No|No|5|10|0|10|Stable promoter at Al Safa.`,
  `MC409|Mariam Al-Shamsi|Sultan Bin Nasser Al-Maktoum|64|Brother Omar|Feedback|Professional|Positive|Rating collection|N/A|IPD|Inpatient|Not Applicable|Stable|Present|Yes|Full marks|No|No|10|10|5|10|High satisfaction for hospital procedure.`,
  `MC410|Reem Al-Qassimi|Mona Bint Tariq Al-Nahyan|108|Sukena Father|Feedback|Courteous|Positive|Rating collection|N/A|Attendant|Inpatient|Not Applicable|Stable|Present|Yes|Everything good|No|No|0|9|5|0|Strong feedback for Suraj branch inpatient care.`,
  `MC411|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Farsi|41|Abu Sultan|Follow-up|Professional|Positive|Recovery Check|N/A|Attendant|Outpatient|Not Applicable|Stable|Present|Yes|Things good|No|No|0|0|0|0|Factual check-in for Dr. Muhammad patient.`,
  `MC412|Fatima Al-Zahra|Yara Bint Abdullah Al-Hammadi|58|Mother of Ruth|Health Follow-up|Professional|Neutral|Recovery Check|N/A|Guardian|N/A|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Child is much better; brief check completed.`,
  `MC413|Omar Al-Farsi|Ali Bin Fahad Al-Mazrouei|22|Not Specified|Follow-up|Professional|Positive|Recovery Check|N/A|OPD|Outpatient|Not Applicable|Neut to Pos|Present|Yes|Fine|No|No|0|0|0|0|Smooth Sharjah outpatient health check.`,
  `MC414|Aisha Al-Hammadi|Amna Bint Ahmed Al-Suwaidi|46|Miss Magda|Health Follow-up|Professional|Neutral|Recovery Check|N/A|IPD|Inpatient|Not Applicable|Stable|Present|N/A|N/A|No|No|0|0|0|0|Patient confirmed fine and follow-up booked.`,
  `MC415|Yousef Al-Kaabi|Zayed Bin Omar Al-Qassimi|56|Ashwa Bador|Follow-up|Professional|Positive|Rating collection|Patient|N/A|N/A|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|5|10|0|10|High internal loyalty (Staff/Patient).`,
  `MC416|Noura Al-Mazrouei|Hind Bint Khalid Al-Balushi|4|N/A|Voicemail|Fragmented|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Voicemail.`,
  `MC417|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Kaabi|404|Not Specified|Service Req|Professional|Neutral|Invoice Request|Attendant|IPD|Inpatient|Documentation|Stable|Present|Yes|Doctor perfect|Yes|Billing delay|4|8|5|8|Action: Hire more nurses; ensure bills are sent within 4 days.`,
  `MC418|Ali Al-Balushi|Yasmin Bint Rashid Al-Shamsi|205|Not Specified|Service Req|Professional|Positive|Appt Scheduling|Attendant|IPD|Recovery|Process|Neut to Pos|Present|Yes|Service good|No|No|5|10|5|10|Follow-up booked with Dr. Brian.`,
  `MC419|Mariam Al-Shamsi|Abdullah Bin Saif Al-Mansouri|50|Ms. Jyoti|Follow-up|Professional|Positive|Recovery Check|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|All good|No|No|0|0|0|0|Standard recovery follow-up.`,
  `MC420|Reem Al-Qassimi|Noura Bint Faisal Al-Maktoum|3|N/A|Voicemail|Unconnected|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Failed call.`,
  `MC421|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Nahyan|32|Lina (Netcare)|Health Follow-up|Polite|Positive|Recovery Check|Attendant|N/A|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|0|0|0|0|Successful health check-in via attendant.`,
  `MC422|Fatima Al-Zahra|Fatima Bint Sultan Al-Farsi|119|Not Specified|Feedback|Professional|Positive|Rating collection|Guardian|IPD|Inpatient|Not Applicable|Stable|Present|Yes|Organize well|No|No|0|9|5|9|Exceptional organizational feedback for IPD.`,
  `MC423|Omar Al-Farsi|Khalid Bin Majid Al-Hammadi|105|Abu Majed|Feedback|Reassuring|Positive|Rating collection|Attendant|IPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|Cooperative staff|No|No|5|9|5|9|High brand trust despite initial transfer from a general hospital.`,
  `MC424|Aisha Al-Hammadi|Noor Bint Yousef Al-Mazrouei|84|Not Specified|Health Follow-up|Professional|Positive|Recovery Check|Patient|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|Service fine|No|No|0|0|0|0|Factual update: patient reported abdominal pain.`,
  `MC425|Yousef Al-Kaabi|Rashid Bin Salem Al-Suwaidi|41|Not Specified|Health Follow-up|Professional|Neutral|Recovery Check|Attendant|IPD|Inpatient|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Requested callback for health check.`,
  `MC426|Noura Al-Mazrouei|Reem Bint Ali Al-Qassimi|36|Not Specified|Duplicate Call|Polite|Neutral|Recovery Check|Patient|OPD|Consultation|Not Applicable|Neut to Pos|N/A|Yes|Fine|Yes|Duplicate call|0|0|0|0|Action: Correct CRM to prevent calling the same patient twice.`,
  `MC427|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Balushi|205|Umm Amir|Service Req|Concerned|Positive|Issue Resolution|Guardian|Guardian|Visit|Service|Neut to Pos|Present|Yes|Hassan excellent|Yes|Dentist quality|0|10|0|10|Action: Review Iraqi dentist treatment quality at Al Taawun.`,
  `MC428|Ali Al-Balushi|Huda Bint Zayed Al-Kaabi|67|Not Specified|Feedback|Polite|Positive|Rating collection|Patient|IPD|Inpatient|Not Applicable|Neut to Pos|Present|Yes|Everything perfect|No|No|5|10|5|10|Exceptional inpatient satisfaction score.`,
  `MC429|Mariam Al-Shamsi|Sultan Bin Nasser Al-Shamsi|73|Not Specified|Feedback|Polite|Positive|Rating collection|Patient|OPD|Visit|Service|Stable|Present|Yes|Service fine|No|No|5|10|5|10|Action: Address insufficient parking at Motor City clinic.`,
  `MC430|Reem Al-Qassimi|Mona Bint Tariq Al-Mansouri|73|Fatem|Feedback|Positive|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Stable|Present|Yes|Manager help|No|No|0|10|0|0|Medcare manager knows us well excellent loyalty.`,
  `MC431|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Maktoum|48|Not Specified|Health Follow-up|Professional|Positive|Recovery Check|Patient|IPD|Inpatient|Not Applicable|Neut to Pos|Present|Yes|Thank you|No|No|0|0|0|0|Smooth post-admission check for Miss Camila.`,
  `MC432|Fatima Al-Zahra|Yara Bint Abdullah Al-Nahyan|73|Mother of Sarah|Feedback|Cooperative|Positive|Rating collection|Guardian|Guardian|Emergency|Not Applicable|Stable|Present|Yes|Sent via WhatsApp|No|No|4|8|4|8|Al Safa branch praised for efficient WhatsApp results.`,
  `MC433|Omar Al-Farsi|Ali Bin Fahad Al-Farsi|114|Father of Ethan|Follow-up|Professional|Positive|Rating collection|Guardian|Guardian|Inpatient|Not Applicable|Neut to Pos|Present|Yes|Everything well|No|No|5|10|5|10|High pediatric scores for W&C hospital.`,
  `MC434|Aisha Al-Hammadi|Amna Bint Ahmed Al-Hammadi|69|Hania Father|Feedback|Appreciative|Positive|Rating collection|Guardian|Guardian|Procedure|Not Applicable|Neut to Pos|Present|Yes|Excellent|No|No|5|10|0|10|Excellent procedure satisfaction for Hania.`,
  `MC435|Yousef Al-Kaabi|Zayed Bin Omar Al-Mazrouei|40|Not Specified|Follow-up|Polite|Neutral|Recovery Check|Patient|OPD|Procedure|Not Applicable|Neg to Pos|N/A|N/A|Health perfect|No|No|0|0|0|0|Patient reported bad time but confirmed perfect health.`,
  `MC436|Noura Al-Mazrouei|Hind Bint Khalid Al-Suwaidi|50|Miss Milena|Follow-up|Professional|Positive|Recovery Check|Patient|IPD|Admission|Not Applicable|Stable|Present|Yes|Rating of 10|No|No|10|10|0|10|High retention for Dr. Reja inpatient unit.`,
  `MC437|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Qassimi|56|Umm Yassin|Follow-up|Reassuring|Positive|Recovery Check|Attendant|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Excellent doctors|No|No|0|0|0|0|Dr. Hazem and anesthesia team highly praised.`,
  `MC438|Ali Al-Balushi|Yasmin Bint Rashid Al-Balushi|5|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Automated voicemail.`,
  `MC439|Mariam Al-Shamsi|Abdullah Bin Saif Al-Kaabi|64|Not Specified|Follow-up|Professional|Positive|Feedback|Patient|OPD|Visit|Not Applicable|Stable|Present|Yes|All good|No|No|5|10|0|10|Consistently positive outpatient feedback.`,
  `MC440|Reem Al-Qassimi|Noura Bint Faisal Al-Shamsi|121|Not Specified|Feedback|Professional|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Wonderful services|No|No|5|9|5|9|Success story: wonderful staff feedback.`,
  `MC441|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Mansouri|152|Not Specified|Service Req|Courteous|Positive|Appt Sched|Patient|IPD|Admission|Process|Neut to Pos|Present|Yes|Reschedule help|No|No|0|0|0|0|Successfully rescheduled appt with Dr. Vaneesha.`,
  `MC442|Fatima Al-Zahra|Fatima Bint Sultan Al-Maktoum|189|Not Specified|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Visit|Process|Neut to Pos|Present|Yes|Improvements|Yes|Pharmacy wait time|5|10|5|10|Action: Address 45-min pharmacy wait time.`,
  `MC443|Omar Al-Farsi|Khalid Bin Majid Al-Nahyan|123|Not Specified|Feedback|Professional|Positive|Issue Resolution|Patient|OPD|Visit|Process|Neut to Pos|Present|Yes|Clinic great|Yes|Reception comms gap|5|8|0|8|Action: Resolve doctor/reception comms gap.`,
  `MC444|Aisha Al-Hammadi|Noor Bint Yousef Al-Farsi|2|N/A|Voicemail|Automated|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Unanswered call.`,
  `MC445|Yousef Al-Kaabi|Rashid Bin Salem Al-Hammadi|49|Umm Sultan|Follow-up|Reassuring|Positive|Recovery Check|Guardian|Guardian|N/A|Not Applicable|Stable|Present|Yes|Fine health|No|No|0|0|0|0|Successful post-visit check for Sultan.`,
  `MC446|Noura Al-Mazrouei|Reem Bint Ali Al-Mazrouei|166|Not Specified|Feedback|Professional|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Vacation experience|No|No|5|10|5|10|Patient felt like they were on vacation top service!`,
  `MC447|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Suwaidi|160|Not Specified|Feedback|Pleasant|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Best care|No|No|5|10|5|10|Nurse Akila highly praised for night shift care.`,
  `MC448|Ali Al-Balushi|Huda Bint Zayed Al-Qassimi|62|Umm Yahya|Feedback|Polite|Positive|Rating collection|Guardian|OPD|Visit|Not Applicable|Stable|Present|Yes|Everything fine|No|No|0|10|0|10|Solid loyalty for Discovery Garden branch.`,
  `MC449|Mariam Al-Shamsi|Sultan Bin Nasser Al-Balushi|214|Not Specified|Follow-up|Professional|Neutral|Recovery Check|Patient|IPD|Admission|Process|Neut to Pos|Present|Yes|Alhamdulillah|Yes|Post-op stockings|7|10|0|10|Action: Coordinate replacement of stockings post-op.`,
  `MC450|Reem Al-Qassimi|Mona Bint Tariq Al-Kaabi|71|Not Specified|Feedback|Courteous|Positive|Rating collection|Patient|OPD|Procedure|Not Applicable|Stable|Present|Yes|Mashallah perfect|No|No|0|10|0|10|High CSAT for Dr. Malak procedure.`,
  `MC451|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Shamsi|125|Umm Tiya|Follow-up|Polite|Positive|Recovery Check|Guardian|Guardian|Visit|Service|Neut to Pos|Present|Yes|Excellent care|Yes|Floor cleanliness|5|10|5|10|Action: Improve floor cleanliness (feet black).`,
  `MC452|Fatima Al-Zahra|Yara Bint Abdullah Al-Mansouri|3|N/A|N/A|Neutral|N/A|N/A|N/A|N/A|N/A|Not Applicable|N/A|N/A|N/A|N/A|No|No|0|0|0|0|Incomplete call.`,
  `MC453|Omar Al-Farsi|Ali Bin Fahad Al-Maktoum|57|Khalil|Follow-up|Professional|Positive|Recovery Check|Patient|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|Excellent|Yes|Duplicate follow-ups|0|0|0|0|Patient annoyed by duplicate daily follow-ups.`,
  `MC454|Aisha Al-Hammadi|Amna Bint Ahmed Al-Nahyan|111|Miss Anjali|Feedback|Professional|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Happy treatment|No|No|10|10|5|10|Exceptional inpatient scores for W&C unit.`,
  `MC455|Yousef Al-Kaabi|Zayed Bin Omar Al-Farsi|59|Hamda|Follow-up|Professional|Positive|Health check|Patient|OPD|Follow-up|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|5|10|5|10|Standard care follow-up.`,
  `MC456|Noura Al-Mazrouei|Hind Bint Khalid Al-Hammadi|45|Aydam|Follow-up|Brief|Neutral|Health check|Attendant|OPD|Check-up|Not Applicable|Stable|Absent|N/A|N/A|No|No|0|0|0|0|Call back at a later time.`,
  `MC457|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Mazrouei|30|Guardian|Feedback|Appreciative|Positive|Rating collection|Guardian|OPD|Feedback|Not Applicable|Neut to Pos|Present|Yes|10/10 Rating|No|No|0|10|0|0|Maintain pediatric support.`,
  `MC458|Ali Al-Balushi|Yasmin Bint Rashid Al-Suwaidi|55|Brother|Follow-up|Cordial|Positive|Health check|Patient|IPD|Follow-up|Not Applicable|Neut to Pos|Present|Yes|No notes/issues|No|No|0|8|0|0|Investigate passive NPS score.`,
  `MC459|Mariam Al-Shamsi|Abdullah Bin Saif Al-Qassimi|37|Shree|Follow-up|Accommodating|Neutral|Language Support|Guardian|IPD|Monitoring|Process|Stable|Absent|Yes|Issue resolved|Yes|Language barrier|0|0|0|0|Assign Arabic agent to file.`,
  `MC460|Reem Al-Qassimi|Noura Bint Faisal Al-Balushi|74|Customer|Feedback|Positive|Positive|Rating collection|Patient|OPD|Feedback|Not Applicable|Neut to Pos|Present|Yes|High ratings|No|No|5|9|0|0|Standard service.`,
  `MC461|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Kaabi|61|Threetha|Feedback|Positive|Positive|Rating collection|Patient|OPD|Check-up|Not Applicable|Neut to Pos|Present|Yes|Excellent care|No|No|5|10|0|0|Loyalty high; excellent care.`,
  `MC462|Fatima Al-Zahra|Fatima Bint Sultan Al-Shamsi|78|Yusuf|Feedback|Appreciative|Positive|Rating collection|Attendant|IPD|Feedback|Not Applicable|Neut to Pos|Present|Yes|10/10 Service|No|No|0|10|5|0|New branch performance good.`,
  `MC463|Omar Al-Farsi|Khalid Bin Majid Al-Mansouri|9|Customer|Callback|Brief|Neutral|Callback coord|Patient|N/A|N/A|Process|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Schedule callback.`,
  `MC464|Aisha Al-Hammadi|Noor Bint Yousef Al-Maktoum|56|Mihail Mother|Follow-up|Courteous|Positive|Health check|Guardian|OPD|Recovery|Not Applicable|Neut to Pos|Present|Yes|Service good|No|No|0|0|0|0|Support pediatric recovery.`,
  `MC465|Yousef Al-Kaabi|Rashid Bin Salem Al-Nahyan|289|Sergei|Service Request|Resolving|Positive|Issue Resolution|Patient|IPD|Lab issue|Documentation|Neut to Pos|Present|Yes|Issue fixed / Dr praise|Yes|Lab accuracy|0|10|5|0|Audit Lab result accuracy.`,
  `MC466|Noura Al-Mazrouei|Reem Bint Ali Al-Farsi|64|Kanan Father|Follow-up|Dissatisfied|Negative|Health check|Guardian|OPD|Recovery|Process|Neut to Neg|Absent|No|Dr didnt call back|Yes|No callback|0|0|0|0|Urgent Management Recovery.`,
  `MC467|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Hammadi|109|Olena|Follow-up|Courteous|Positive|Health check|Patient|OPD|Recovery|Not Applicable|Neut to Pos|Present|Yes|Praise be to God|No|No|10|10|5|10|Maintain Sharjah standards.`,
  `MC468|Ali Al-Balushi|Huda Bint Zayed Al-Mazrouei|248|Sergei|Feedback|Cooperative|Positive|Suggestion|Patient|IPD|Improvement|Not Applicable|Stable|Present|Yes|Very professional|No|No|0|0|0|0|IT to review feedback page.`,
  `MC469|Mariam Al-Shamsi|Sultan Bin Nasser Al-Suwaidi|43|Abdul Wahid|Follow-up|Professional|Neutral|Health check|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|Thank God|No|No|0|0|0|0|Busy; reschedule call.`,
  `MC470|Reem Al-Qassimi|Mona Bint Tariq Al-Qassimi|106|Yasmin Husb|Follow-up|Positive|Positive|Rating collection|Attendant|OPD|Feedback|Not Applicable|Stable|Present|Yes|It is good|No|No|0|9|5|0|Maintain caregiver quality.`,
  `MC471|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Balushi|64|Lujain Bro|Follow-up|Satisfied|Positive|Health check|Attendant|IPD|Post-surgery|Not Applicable|Stable|Present|Yes|Everything good|No|No|0|10|5|0|Successful surgical follow-up.`,
  `MC472|Fatima Al-Zahra|Yara Bint Abdullah Al-Kaabi|62|Customer|Feedback|Satisfied|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|0|9|4|0|Reward staff for performance.`,
  `MC473|Omar Al-Farsi|Ali Bin Fahad Al-Shamsi|20|Abdul Wahid|Follow-up|Reassuring|Positive|Health check|Patient|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|0|0|0|0|Maintain emergency support.`,
  `MC474|Aisha Al-Hammadi|Amna Bint Ahmed Al-Mansouri|133|Karunesha|Follow-up|Professional|Positive|Health check|Patient|IPD|Recovery|Pricing|Neut to Pos|Present|Yes|Everything well|No|No|0|0|5|0|Address pricing transparency.`,
  `MC475|Yousef Al-Kaabi|Zayed Bin Omar Al-Maktoum|81|Jacob (Attendant)|Follow-up|Professional|Positive|Health check|Attendant|OPD|Recovery|Not Applicable|Stable|Present|Yes|Perfectly went|No|No|5|10|5|10|Standard care maintenance.`,
  `MC476|Noura Al-Mazrouei|Hind Bint Khalid Al-Nahyan|104|Customer|Feedback|Courteous|Positive|Inpatient feedback|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Perfect housekeeping|No|No|5|10|5|10|Reward housekeeping staff mentioned.`,
  `MC477|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Farsi|89|Brother|Follow-up|Polite|Positive|Health check|Patient|IPD|Post-surgery|Process|Stable|Present|Yes|Excellent/Organized|No|No|5|0|0|0|Review direct insurance contract query.`,
  `MC478|Ali Al-Balushi|Yasmin Bint Rashid Al-Hammadi|2|N/A|N/A|Neutral|N/A|Dropped Call|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Mark as abandoned call.`,
  `MC479|Mariam Al-Shamsi|Abdullah Bin Saif Al-Mazrouei|44|Jagannath|Feedback|Professional|Positive|Inpatient feedback|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Experience was great|No|No|0|0|0|0|High satisfaction IPD.`,
  `MC480|Reem Al-Qassimi|Noura Bint Faisal Al-Suwaidi|5|N/A|Voicemail|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Re-attempt call later.`,
  `MC481|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Qassimi|64|Hassa (Mother)|Follow-up|Professional|Positive|Health check|Guardian|IPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Everything okay|No|No|5|10|5|10|Successful pediatric follow-up.`,
  `MC482|Fatima Al-Zahra|Fatima Bint Sultan Al-Balushi|80|Sahel (Attendant)|Feedback|Polite|Positive|Rating collection|Attendant|OPD|Feedback|Not Applicable|Stable|Present|Yes|Fine/Alhamdulillah|No|No|5|10|0|10|Standard maintenance.`,
  `MC483|Omar Al-Farsi|Khalid Bin Majid Al-Kaabi|3|N/A|Voicemail|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Re-attempt call.`,
  `MC484|Aisha Al-Hammadi|Noor Bint Yousef Al-Shamsi|136|Murad|Service Request|Concerned|Neutral|Appt Scheduling|Patient|OPD|Follow-up|Process|Stable|Present|Yes|Appt scheduled|No|No|0|0|0|0|Health not improved; monitor outcome.`,
  `MC485|Yousef Al-Kaabi|Rashid Bin Salem Al-Mansouri|361|Customer|Service Request|Professional|Neutral|Issue Resolution|Patient|IPD|Recovery|Process|Stable|Present|Yes|Issue addressed|No|No|5|10|5|10|Ensure doctor callback is completed.`,
  `MC486|Noura Al-Mazrouei|Reem Bint Ali Al-Maktoum|94|Customer|Feedback|Professional|Positive|Rating collection|Patient|IPD|Feedback|Not Applicable|Neut to Pos|Present|Yes|Yeah it is good|No|No|0|10|5|0|Standard maintenance.`,
  `MC487|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Nahyan|52|Fahad|Follow-up|Professional|Positive|Health check|Patient|OPD|Follow-up|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|0|0|0|0|Busy; no ratings collected.`,
  `MC488|Ali Al-Balushi|Huda Bint Zayed Al-Farsi|90|Sheikh Sameer|Feedback|Professional|Positive|Rating collection|Patient|OPD|Dental|Not Applicable|Neut to Pos|Present|Yes|Fantastic service|No|No|5|10|5|10|Exceptional dental experience praise.`,
  `MC489|Mariam Al-Shamsi|Sultan Bin Nasser Al-Hammadi|63|Customer|Callback|Polite|Neutral|System Coordination|Patient|IPD|Follow-up|Process|Stable|N/A|Yes|Explanation accepted|Yes|Call logging|0|0|0|0|IT to audit why calls arent logged.`,
  `MC490|Reem Al-Qassimi|Mona Bint Tariq Al-Mazrouei|138|Customer|Follow-up|Concerned|Neutral|Health Status|Patient|OPD|Procedure|Process|Stable|Present|Yes|Satisfied with care|Yes|Bleeding issue|5|10|5|10|Urgent follow-up for bleeding issue.`,
  `MC491|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Suwaidi|62|Maryam|Follow-up|Professional|Positive|Health check|Patient|OPD|Procedure|Not Applicable|Stable|Present|Yes|Doing well|No|No|5|6|0|10|NPS 6 despite high PSAT; check why.`,
  `MC492|Fatima Al-Zahra|Yara Bint Abdullah Al-Qassimi|172|Bykhan (Relative)|Service Request|Calm|Neutral|Dr. Callback|Attendant|OPD|Progress inquiry|General|Stable|Present|Yes|Resolution proposed|No|No|0|0|0|0|Close the loop on Dr. Vivek callback.`,
  `MC493|Omar Al-Farsi|Ali Bin Fahad Al-Balushi|116|Customer|Feedback|Professional|Positive|Rating collection|Patient|IPD|Feedback|Not Applicable|Neut to Pos|Present|Yes|Thanks|No|No|4|8|4|8|Suggestion offered; review NPS 8.`,
  `MC494|Aisha Al-Hammadi|Amna Bint Ahmed Al-Kaabi|47|Sanjana|Follow-up|Brief|Neutral|Health check|Patient|OPD|Follow-up|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Customer was busy; call back later.`,
  `MC495|Yousef Al-Kaabi|Zayed Bin Omar Al-Shamsi|96|Customer|Feedback|Professional|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Caregiver service|No|No|4|0|5|0|Standard service.`,
  `MC496|Noura Al-Mazrouei|Hind Bint Khalid Al-Mansouri|87|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|IPD|Operation|Not Applicable|Stable|Present|Yes|Everything excellent|No|No|5|10|0|0|Long-standing loyalty; daughter born here.`,
  `MC497|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Maktoum|61|Customer|Follow-up|Appreciative|Positive|Health check|Patient|OPD|Visit|Not Applicable|Stable|Present|Yes|Everything fine|No|No|0|10|0|0|Standard Sharjah follow-up.`,
  `MC498|Ali Al-Balushi|Yasmin Bint Rashid Al-Nahyan|98|Customer|Follow-up|Professional|Positive|Health check|Patient|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|Long-term follow-up|No|No|4|5|9|0|Patient loyal for more than 1 year.`,
  `MC499|Mariam Al-Shamsi|Abdullah Bin Saif Al-Farsi|57|Customer|Follow-up|Appreciative|Positive|Health check|Patient|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Care and kindness|No|No|0|0|0|0|Doctors in all specialties praised.`,
  `MC500|Reem Al-Qassimi|Noura Bint Faisal Al-Hammadi|86|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Procedure|Not Applicable|Stable|Present|Yes|Good treatment|No|No|5|10|0|0|Positive treatment feedback.`,
  `MC501|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Mazrouei|65|Miss Tuba|Follow-up|Courteous|Positive|Health check|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|0|0|0|0|Stitches/Baby recovery successful.`,
  `MC502|Fatima Al-Zahra|Fatima Bint Sultan Al-Suwaidi|51|Customer|Follow-up|Routine|Neutral|Health check|Patient|IPD|Procedure|Not Applicable|Stable|Present|Yes|Everything went well|No|No|0|0|0|0|Transactional neutral satisfaction.`,
  `MC503|Omar Al-Farsi|Khalid Bin Majid Al-Qassimi|121|Father Snoor|Feedback|Positive|Positive|Rating collection|Guardian|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|5|9|5|0|Successful pediatric follow-up.`,
  `MC504|Aisha Al-Hammadi|Noor Bint Yousef Al-Balushi|91|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Stable|Present|Yes|Everything good|No|No|10|0|0|10|Strong praise for nurse and doctor.`,
  `MC505|Yousef Al-Kaabi|Rashid Bin Salem Al-Kaabi|95|Mrs. Ashra|Feedback|Positive|Positive|Rating collection|Guardian|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|It was all great|No|No|5|9|5|0|High NPS for Royal Hospital.`,
  `MC506|Noura Al-Mazrouei|Reem Bint Ali Al-Shamsi|11|N/A|Uncertain|Brief|N/A|Fragmented Call|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Abandoned call; re-attempt.`,
  `MC507|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Mansouri|71|Sister Moza|Follow-up|Reassuring|Neutral|Health check|Attendant|OPD|Visit|Process|Stable|Present|N/A|N/A|Yes|Duplicate call|0|0|0|0|CRM Coordination: Customer annoyed by 2nd call for same visit.`,
  `MC508|Ali Al-Balushi|Huda Bint Zayed Al-Maktoum|156|Customer|Feedback|Cooperative|Neutral|Rating collection|Patient|OPD|Regular checkup|Process|Neut to Neg|Present|Yes|Dr. Anas is good|Yes|Online booking issues|4|9|4|0|Digital Improvement: Fix online booking portal issues.`,
  `MC509|Mariam Al-Shamsi|Sultan Bin Nasser Al-Nahyan|97|Customer|Feedback|Highly positive|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Stable|Present|Yes|Perfectly okay|No|No|5|10|5|0|Regular patient with strong loyalty.`,
  `MC510|Reem Al-Qassimi|Mona Bint Tariq Al-Farsi|118|Arya Father|Feedback|Cooperative|Positive|Rating collection|Guardian|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|5|10|5|5|High satisfaction for pediatric care.`,
  `MC511|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Hammadi|48|Sara Father|Follow-up|Reassuring|Positive|Health check|Guardian|IPD|Admission|Not Applicable|Stable|Present|Yes|It is all fine|No|No|0|0|0|0|Discharged and doing much better.`,
  `MC512|Fatima Al-Zahra|Yara Bint Abdullah Al-Mazrouei|120|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|Helped very fast|No|No|5|9|5|0|Praise for fast emergency service.`,
  `MC513|Omar Al-Farsi|Ali Bin Fahad Al-Suwaidi|97|Customer|Service Request|Cooperative|Positive|Medical Report Req|Patient|OPD|Visit|Documentation|Neut to Pos|Present|Yes|Dr. Muhammad great|No|No|0|0|0|0|Action Item: Deliver Endoscopy/Biopsy report results.`,
  `MC514|Aisha Al-Hammadi|Amna Bint Ahmed Al-Qassimi|139|Harith|Feedback|Evasive|Negative|Rating collection|Patient|OPD|Follow-up|Service|Neut to Neg|Absent|Yes|Satisfied (stated)|Yes|Survey fatigue|3|0|0|3|Brand Risk: Patient loyal to Dr. Fahim only dislikes hospital survey.`,
  `MC515|Yousef Al-Kaabi|Zayed Bin Omar Al-Balushi|59|Umm Amani|Follow-up|Reassuring|Positive|Health check|Guardian|OPD|Procedure|Not Applicable|Stable|Present|Yes|Everything fine|No|No|4|10|0|0|Standard pediatric follow-up.`,
  `MC516|Noura Al-Mazrouei|Hind Bint Khalid Al-Kaabi|86|Sister Khulood|Feedback|Polite|Positive|Rating collection|Patient|OPD|Hospital Visit|Not Applicable|Neut to Pos|Present|Yes|Fine/Praise God|No|No|5|9|5|0|Positive mention of nurse and doctor.`,
  `MC517|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Shamsi|60|Sister Noura|Follow-up|Polite|Positive|Post-procedure|Patient|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Full five ratings|No|No|10|10|0|10|Strong Al Safa loyalty.`,
  `MC518|Ali Al-Balushi|Yasmin Bint Rashid Al-Mansouri|106|Customer|Follow-up|Professional|Positive|Rating collection|Patient|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|It was very nice|No|No|0|10|5|0|Friend referral successful; verify referral source.`,
  `MC519|Mariam Al-Shamsi|Abdullah Bin Saif Al-Maktoum|57|Sister Maryam|Feedback|Professional|Positive|Rating collection|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|Affairs were good|No|No|0|10|5|0|High NPS for Royal Emergency.`,
  `MC520|Reem Al-Qassimi|Noura Bint Faisal Al-Nahyan|86|Mr. Fahad|Feedback|Professional|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Stable|Present|Yes|Visit was perfect|No|No|9|9|5|9|Dr. Haitham praised for knowledge.`,
  `MC521|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Farsi|85|Archana (Guardian)|Feedback|Professional|Positive|Rating collection|Guardian|OPD|Baby Health|Not Applicable|Neut to Pos|Present|Yes|Everything good|No|No|0|10|5|0|Successful pediatric IPD follow-up.`,
  `MC522|Fatima Al-Zahra|Fatima Bint Sultan Al-Hammadi|1|N/A|Voicemail|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Abandoned; re-attempt contact.`,
  `MC523|Omar Al-Farsi|Khalid Bin Majid Al-Mazrouei|44|Customer|Feedback|Courteous|Positive|Rating collection|Patient|OPD|Clinic Visit|Not Applicable|Neut to Pos|Present|Yes|Doctor excellent|No|No|0|0|0|0|General praise for Dr. Basran.`,
  `MC524|Aisha Al-Hammadi|Noor Bint Yousef Al-Suwaidi|61|Um Hamda|Feedback|Positive|Positive|Rating collection|Attendant|OPD|Health check|Not Applicable|Stable|Present|Yes|Praise God|No|No|0|9|5|0|Strong attendant satisfaction.`,
  `MC525|Yousef Al-Kaabi|Rashid Bin Salem Al-Qassimi|49|Customer|Health Follow-up|Professional|Positive|Recovery assessment|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|All well|No|No|0|0|0|0|Patient recovered well; no action.`,
  `MC526|Noura Al-Mazrouei|Reem Bint Ali Al-Balushi|52|Daughter|Follow-up|Concise|Neutral|Health check|Attendant|IPD|Admission|Not Applicable|Stable|Present|Yes|Everything fine|No|No|0|0|0|0|Recovery confirmed; no action.`,
  `MC527|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Kaabi|106|Customer|Service Request|Transactional|Neutral|Lab results|Patient|OPD|Visit|Documentation|Stable|N/A|N/A|N/A|Yes|Lab results delay|0|0|0|0|Action Required: Dr. Soha to WhatsApp lab results.`,
  `MC528|Ali Al-Balushi|Huda Bint Zayed Al-Shamsi|111|Faris (Mother)|Follow-up|Professional|Positive|Rating collection|Guardian|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|Good as usual|No|No|10|10|5|10|As usual indicates long-term loyalty.`,
  `MC529|Mariam Al-Shamsi|Sultan Bin Nasser Al-Mansouri|60|Faiza|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Eye Center|Not Applicable|Neut to Pos|Present|Yes|Top-notch doctors|No|No|0|10|5|0|Eye Centre doctors praised as top-notch.`,
  `MC530|Reem Al-Qassimi|Mona Bint Tariq Al-Maktoum|45|Umm Ahmed|Health Follow-up|Professional|Positive|Recovery assessment|Guardian|OPD|Emergency|Not Applicable|Neut to Pos|Present|Yes|He is fine|No|No|0|0|0|0|Successful emergency recovery.`,
  `MC531|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Nahyan|34|Customer|Health Check|Reassuring|Positive|In-hospital check|Patient|IPD|Hospitalization|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Patient still in hospital; doing well.`,
  `MC532|Fatima Al-Zahra|Yara Bint Abdullah Al-Farsi|119|Abdussalam (Rel.)|Feedback|Appreciative|Positive|Rating collection|Attendant|OPD|Visit|Service|Neut to Pos|Present|Yes|Dr. Galina loyalty|Yes|Different doctor issue|0|8|5|0|Action Item: Investigate issue with different doctor.`,
  `MC533|Omar Al-Farsi|Ali Bin Fahad Al-Hammadi|34|Ansaaf|Follow-up|Routine|Neutral|Health check|Patient|IPD|Admission|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Transactional health follow-up.`,
  `MC534|Aisha Al-Hammadi|Amna Bint Ahmed Al-Mazrouei|121|Mr. Harsh|Feedback|Appreciative|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|11 of 10 recommendation|No|No|10|10|5|10|Outstanding IPD experience; 11 out of 10.`,
  `MC535|Yousef Al-Kaabi|Zayed Bin Omar Al-Suwaidi|54|Customer|Feedback|Polite|Positive|Rating collection|Patient|OPD|Regular Visit|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|5|10|0|0|Standard service maintenance.`,
  `MC536|Noura Al-Mazrouei|Hind Bint Khalid Al-Qassimi|72|Customer|Follow-up|Reassuring|Positive|Health check|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|Praise Allah|No|No|5|9|5|0|Bone department visit successful.`,
  `MC537|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Balushi|222|Mr. Hisham|Service Request|Concerned|Neutral|Report request|Patient|OPD|MRI/CT Scan|Documentation|Neut to Neg|Absent|No|N/A|Yes|MRI report delay|0|0|0|0|Urgent Action: IT must send MRI/CT via WeTransfer.`,
  `MC538|Ali Al-Balushi|Yasmin Bint Rashid Al-Kaabi|97|Customer|Feedback|Cooperative|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Stable|Present|Yes|Cordial staff|No|No|5|9|5|5|High staff professionalism noted.`,
  `MC539|Mariam Al-Shamsi|Abdullah Bin Saif Al-Shamsi|54|Customer|Feedback|Polite|Positive|Rating collection|Patient|IPD|Procedure|Not Applicable|Stable|Present|Yes|Everything fine|No|No|5|10|0|5|Standard procedure follow-up.`,
  `MC540|Reem Al-Qassimi|Noura Bint Faisal Al-Mansouri|30|John (Attendant)|Follow-up|Brief|Neutral|Health check|Attendant|N/A|Visit|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|Duplicate call; patient already reached.`,
  `MC541|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Maktoum|147|Yasmin (Attendant)|Feedback|Mixed|Negative|Rating collection|Attendant|N/A|Clinic Visit|Staff Behavior|Neut to Neg|Present|Yes|Overall okay|Yes|Survey fatigue|5|10|3|5|Process Warning: Reduce survey/review fatigue.`,
  `MC542|Fatima Al-Zahra|Fatima Bint Sultan Al-Nahyan|75|Customer|Feedback|Polite|Positive|Rating collection|Patient|OPD|Hospital Visit|Not Applicable|Stable|Present|Yes|Everything excellent|No|No|5|10|0|5|Excellent Royal Hospital feedback.`,
  `MC543|Omar Al-Farsi|Khalid Bin Majid Al-Farsi|57|Fatima (Guardian)|Health Follow-up|Courteous|Positive|Recovery assessment|Guardian|N/A|Recovery|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|0|0|0|0|Pediatric recovery successful.`,
  `MC544|Aisha Al-Hammadi|Noor Bint Yousef Al-Hammadi|50|Zain Aldeen (Guar)|Health Check|Routine|Neutral|Recovery assessment|Guardian|N/A|Consultation|Not Applicable|Stable|N/A|N/A|N/A|No|No|0|0|0|0|CRM Issue: Duplicate contact for same visit.`,
  `MC545|Yousef Al-Kaabi|Rashid Bin Salem Al-Mazrouei|41|Sabreen|Follow-up|Polite|Neutral|Health check|Patient|OPD|Consultation|Not Applicable|Stable|Present|Yes|No notes|No|No|0|0|0|0|General health follow-up.`,
  `MC546|Noura Al-Mazrouei|Reem Bint Ali Al-Suwaidi|39|Tareem (Mother)|Health Follow-up|Polite|Positive|Recovery assessment|Attendant|N/A|Eye Visit|Not Applicable|Neut to Pos|Present|Yes|Everything good|No|No|0|0|0|0|Eye doctor visit follow-up.`,
  `MC547|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Qassimi|72|Customer|Feedback|Polite|Positive|Rating collection|Patient|OPD|Hospital Visit|Not Applicable|Stable|Present|Yes|God willing|No|No|5|8|0|5|NPS 8; check for improvement areas.`,
  `MC548|Ali Al-Balushi|Huda Bint Zayed Al-Balushi|54|Umm Amna|Health Follow-up|Polite|Positive|Recovery assessment|Guardian|N/A|Emergency|Not Applicable|Stable|Present|Yes|Everything fine|No|No|0|0|0|0|Standard emergency follow-up.`,
  `MC549|Mariam Al-Shamsi|Sultan Bin Nasser Al-Kaabi|84|Customer|Follow-up|Grateful|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Stable|Present|Yes|Attention and care|No|No|5|10|5|5|High trust in care quality.`,
  `MC550|Reem Al-Qassimi|Mona Bint Tariq Al-Shamsi|101|Yassin (Guardian)|Feedback|Courteous|Positive|Rating collection|Guardian|N/A|Food Quality|Service|Neut to Pos|Present|Yes|Everything fine|Yes|Food quality|5|10|0|5|Facility Issue: Improve IPD food quality.`,
  `MC551|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Mansouri|59|Ali (Brother)|Feedback|Polite|Positive|Rating collection|Patient|IPD|Procedure|Not Applicable|Stable|Present|Yes|Didnt fall short|No|No|5|10|0|5|Procedure recovery confirmed.`,
  `MC552|Fatima Al-Zahra|Yara Bint Abdullah Al-Maktoum|57|Customer|Feedback|Neutral|Positive|Qualitative feedback|Patient|OPD|Eye Consultation|Process|Neut to Pos|N/A|Yes|It is good|Yes|Redundant daily calls|0|0|0|0|CRM Issue: Stop redundant daily calls.`,
  `MC553|Omar Al-Farsi|Ali Bin Fahad Al-Nahyan|125|Hisham|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Consultation|Process|Stable|Present|Yes|Dr. Ghassan excellent|Yes|Appt change follow-up|5|10|5|5|Coordination: Fix appt change follow-up.`,
  `MC554|Aisha Al-Hammadi|Amna Bint Ahmed Al-Farsi|99|Customer|Feedback|Professional|Positive|Rating collection|Patient|IPD|Admission|Not Applicable|Neut to Pos|Present|Yes|Perfectly fine|No|No|5|10|5|5|High PSAT and NPS for Sharjah.`,
  `MC555|Yousef Al-Kaabi|Zayed Bin Omar Al-Hammadi|43|Ahmed|Service Request|Interrupted|Negative|General Complaint|Patient|OPD|Eye Visit|General|Neut to Neg|Absent|No|N/A|Yes|Complaint pending|0|0|0|0|Urgent Call-back: Patient has a specific complaint but was too busy to detail it.`,
  `MC556|Noura Al-Mazrouei|Hind Bint Khalid Al-Mazrouei|69|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Sharjah Visit|Not Applicable|Stable|Present|Yes|Amazing / Attention|No|No|5|10|5|0|Excellent feedback for Sharjah staff.`,
  `MC557|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Suwaidi|3|N/A|N/A|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Mark as abandoned.`,
  `MC558|Ali Al-Balushi|Yasmin Bint Rashid Al-Qassimi|109|Salma (Husband)|Feedback|Appreciative|Positive|Rating collection|Attendant|N/A|Sharjah Visit|Not Applicable|Neut to Pos|Present|Yes|10 out of 10|No|No|10|10|0|10|High PSAT and NPS; nursing praised.`,
  `MC559|Mariam Al-Shamsi|Abdullah Bin Saif Al-Balushi|45|Aisha|Health Follow-up|Reassuring|Positive|General Recovery|Patient|OPD|Eye Visit|Not Applicable|Neut to Pos|Present|Yes|Thank God|No|No|0|0|0|0|Successful Eye Centre follow-up.`,
  `MC560|Reem Al-Qassimi|Noura Bint Faisal Al-Kaabi|74|Abdulaziz|Feedback|Positive|Positive|Rating collection|Patient|OPD|Emergency|Not Applicable|Stable|Present|Yes|No delay / Empty ER|No|No|0|10|0|0|Service speed was a highlight.`,
  `MC561|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Shamsi|58|Customer|Health Follow-up|Positive|Positive|General Recovery|Patient|IPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Everything fine|No|No|5|10|5|0|Post-procedure recovery confirmed.`,
  `MC562|Fatima Al-Zahra|Fatima Bint Sultan Al-Mansouri|79|Anna (Mother)|Feedback|Positive|Positive|Rating collection|Guardian|N/A|Hospital Visit|Not Applicable|Neut to Pos|Present|Yes|No doubt|No|No|5|10|5|0|Strong pediatric IPD ratings.`,
  `MC563|Omar Al-Farsi|Khalid Bin Majid Al-Maktoum|70|Customer|Health Follow-up|Reassuring|Positive|Post-procedure|Patient|OPD|Procedure|Not Applicable|Stable|Present|Yes|Five rating|No|No|5|8|0|0|NPS 8; health recovered.`,
  `MC564|Aisha Al-Hammadi|Noor Bint Yousef Al-Nahyan|54|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Dr. Hana wonderful|No|No|0|0|0|0|Send Thank You to Dr. Hana for praise.`,
  `MC565|Yousef Al-Kaabi|Rashid Bin Salem Al-Farsi|68|Customer|Health Follow-up|Calm|Neutral|General Recovery|Patient|OPD|Visit|Service|Stable|N/A|Yes|Alhamdulillah|Yes|Nurse quality|0|0|0|0|Quality Check: Investigate previous comments regarding nurses.`,
  `MC566|Noura Al-Mazrouei|Reem Bint Ali Al-Hammadi|82|Shadi (Wife)|Health Follow-up|Informative|Neutral|General Recovery|Attendant|N/A|Consultation|Not Applicable|Neut to Pos|Present|Yes|Clear with Dr|No|No|0|0|0|0|Cardiology follow-up confirmed.`,
  `MC567|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Mazrouei|53|Salama (Mother)|Feedback|Professional|Positive|Rating collection|Guardian|OPD|Child Visit|Not Applicable|Neut to Pos|Present|Yes|Dr. Younes excellent|No|No|0|0|0|0|High loyalty to Dr. Younes.`,
  `MC568|Ali Al-Balushi|Huda Bint Zayed Al-Suwaidi|4|N/A|N/A|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Mark as abandoned.`,
  `MC569|Mariam Al-Shamsi|Sultan Bin Nasser Al-Qassimi|62|Ramia (Husband)|Health Follow-up|Reassuring|Positive|General Recovery|Attendant|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|No notes / Fine|No|No|0|0|0|0|Successful health follow-up.`,
  `MC570|Reem Al-Qassimi|Mona Bint Tariq Al-Balushi|107|Customer|Feedback|Positive|Positive|Rating collection|Patient|IPD|Hospital Experience|Not Applicable|Neut to Pos|Present|Yes|Really good|No|No|0|9|4|0|Strong IPD ratings.`,
  `MC571|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Kaabi|100|Customer|Feedback|Professional|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|Very happy|No|No|5|10|5|5|Ophthalmology success at SZR.`,
  `MC572|Fatima Al-Zahra|Yara Bint Abdullah Al-Shamsi|58|Customer|Feedback|Positive|Positive|Rating collection|Patient|OPD|Visit|Not Applicable|Neut to Pos|Present|Yes|Praise God|No|No|0|10|0|0|High NPS advocacy.`,
  `MC573|Omar Al-Farsi|Ali Bin Fahad Al-Mansouri|28|Abu May (Attendant)|Health Follow-up|Reassuring|Positive|General Recovery|Attendant|N/A|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything good|No|No|0|0|0|0|Successful Jumeirah follow-up.`,
  `MC574|Aisha Al-Hammadi|Amna Bint Ahmed Al-Maktoum|103|Customer|Feedback|Appreciative|Positive|Rating collection|Patient|OPD|Clinic Visit|Not Applicable|Stable|Present|Yes|Dr. Manar excellent|No|No|0|0|0|0|Dr. Manar is a key retention driver.`,
  `MC575|Yousef Al-Kaabi|Zayed Bin Omar Al-Nahyan|3|N/A|Voicemail|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Re-attempt call.`,
  `MC576|Noura Al-Mazrouei|Hind Bint Khalid Al-Farsi|146|Faisa (Mother)|Service Request|Concerned to reassured|Positive|Issue resolution|Guardian|N/A|Symptom check|Process|Neut to Pos|Present|Yes|Callback arranged|No|No|5|10|5|5|Ensure doctor callback is completed for runny nose.`,
  `MC577|Hassan Al-Suwaidi|Tariq Bin Mohammed Al-Hammadi|101|Ms. Rana|Feedback|Professional|Positive|Rating collection|Patient|IPD|Inpatient stay|Not Applicable|Neut to Pos|Present|Yes|Great services|No|No|10|10|5|10|Excellent IPD feedback.`,
  `MC578|Ali Al-Balushi|Yasmin Bint Rashid Al-Mazrouei|45|Customer|Follow-up|Brief|Neutral|Health check|Patient|IPD|Admission|Not Applicable|Stable|Present|Yes|Okay recovery|No|No|0|0|0|0|Brief follow-up successful.`,
  `MC579|Mariam Al-Shamsi|Abdullah Bin Saif Al-Suwaidi|51|Customer|Feedback|Positive|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Stable|Present|Yes|Helped a lot|No|No|0|10|0|0|Standard service maintenance.`,
  `MC580|Reem Al-Qassimi|Noura Bint Faisal Al-Qassimi|86|Customer|Feedback|Professional|Positive|Rating collection|Patient|OPD|Digestive Clinic|Not Applicable|Neut to Pos|Present|Yes|Perfectly fine|No|No|5|10|5|10|Dr. Abtan 10/10 performance noted.`,
  `MC581|Ahmed Al-Mansouri|Ahmed Bin Hamad Al-Balushi|36|Um Reem|Feedback|Positive|Positive|Qualitative feedback|Guardian|N/A|Visit|Not Applicable|Neut to Pos|Present|Yes|Everything excellent|No|No|0|0|0|0|Pediatric follow-up successful.`,
  `MC582|Fatima Al-Zahra|Fatima Bint Sultan Al-Kaabi|0|N/A|N/A|No transcript|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Dead air call.`,
  `MC583|Omar Al-Farsi|Khalid Bin Majid Al-Shamsi|81|Mr. Gagan|Feedback|Polite|Positive|Rating collection|Patient|OPD|Consultation|Not Applicable|Neut to Pos|Present|Yes|All good|No|No|5|9|5|10|Standard care follow-up.`,
  `MC584|Aisha Al-Hammadi|Noor Bint Yousef Al-Mansouri|17|N/A|Greeting|Brief|Neutral|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Abandoned call.`,
  `MC585|Yousef Al-Kaabi|Rashid Bin Salem Al-Maktoum|41|Muhammad|Follow-up|Polite|Positive|Health check|Patient|OPD|General visit|Not Applicable|Stable|Present|Yes|Praise be to God|No|No|0|0|0|0|General check-in for loyal patient.`,
  `MC586|Noura Al-Mazrouei|Reem Bint Ali Al-Nahyan|79|Sabihullah (Fa)|Feedback|Polite|Positive|Rating collection|Guardian|IPD|Inpatient stay|Not Applicable|Stable|Present|Yes|Completely satisfied|No|No|0|10|5|0|Strong Sharjah IPD feedback.`,
  `MC587|Hassan Al-Suwaidi|Faisal Bin Hassan Al-Farsi|302|Guardian|Service Request|Empathetic|Neutral|Diagnostic scheduling|Guardian|N/A|Service quality|Quality Issues|Stable|Present|Yes|Resolved|Yes|Staff behavior audit|6|10|0|6|Review long call for staff behavior audit.`,
  `MC588|Ali Al-Balushi|Huda Bint Zayed Al-Hammadi|61|Brother Majed|Feedback|Positive|Positive|Rating collection|Patient|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Excellent service|No|No|5|10|5|0|High satisfaction for procedure.`,
  `MC589|Mariam Al-Shamsi|Sultan Bin Nasser Al-Mazrouei|126|Attendant|Feedback|Polite|Positive|Rating collection|Attendant|N/A|Jumeirah clinic|General|Stable|Present|Yes|Everything perfect|No|No|5|9|0|5|Standard clinic performance high.`,
  `MC590|Reem Al-Qassimi|Mona Bint Tariq Al-Suwaidi|148|Customer|Feedback|Polite|Positive|Rating collection|Patient|OPD|Sharjah visit|Service|Neut to Pos|Present|Yes|Attention noted|Yes|Room hygiene|0|10|0|0|Audit Sharjah room hygiene.`,
  `MC591|Ahmed Al-Mansouri|Yousef Bin Khalfan Al-Qassimi|59|Fatima|Follow-up|Professional|Positive|Health check|Patient|OPD|Procedure|Not Applicable|Neut to Pos|Present|Yes|Good everything good|No|No|5|10|5|0|Successful recovery follow-up.`,
  `MC592|Fatima Al-Zahra|Yara Bint Abdullah Al-Balushi|33|Mia (Mother)|Health Follow-up|Reassuring|Positive|Health check|Guardian|N/A|Consultation|Not Applicable|Neut to Pos|Present|Yes|Thank you checking|No|No|0|0|0|0|High gratitude for check-in.`,
  `MC593|Omar Al-Farsi|Ali Bin Fahad Al-Kaabi|339|Guardian|Service Request|Satisfied|Positive|Rescheduling|Guardian|N/A|Son appt|Process|Neut to Pos|Present|Yes|Great service|No|No|5|10|5|5|Rescheduling handled efficiently.`,
  `MC594|Aisha Al-Hammadi|Amna Bint Ahmed Al-Shamsi|3|N/A|Voicemail|Automated|N/A|Voicemail|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|N/A|No|0|0|0|0|Re-attempt contact later.`,
];
