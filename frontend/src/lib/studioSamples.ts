import type { Household } from "../api";

/** Presentation-only weather samples. Never sent to /api/risk or used as live fallback. */
export type SampleWeather = {
  id: string;
  label: string;
  countyLabel: string;
  band: "lower" | "elevated" | "high";
  indexValue: number;
  maxGustKmh: number;
  precipitationMm: number;
  maxTemperatureC: number;
  story: string;
};

export const SAMPLE_WEATHER: SampleWeather[] = [
  {
    id: "calm",
    label: "Calmer",
    countyLabel: "Harris County · SAMPLE",
    band: "lower",
    indexValue: 0,
    maxGustKmh: 28,
    precipitationMm: 1.2,
    maxTemperatureC: 24,
    story:
      "Illustrative lower stress: light gusts and little rain. Still not an outage probability.",
  },
  {
    id: "elevated",
    label: "Elevated",
    countyLabel: "Fort Bend County · SAMPLE",
    band: "elevated",
    indexValue: 5,
    maxGustKmh: 65,
    precipitationMm: 48,
    maxTemperatureC: 25,
    story:
      "Illustrative elevated stress matching the synthetic fixture shape. Presentation only — not a live fetch.",
  },
  {
    id: "high",
    label: "High",
    countyLabel: "Montgomery County · SAMPLE",
    band: "high",
    indexValue: 8,
    maxGustKmh: 88,
    precipitationMm: 90,
    maxTemperatureC: 39,
    story:
      "Illustrative high stress: strong gusts, heavy rain, and heat extreme. Not a live forecast.",
  },
];

export type HouseholdPreset = {
  id: string;
  label: string;
  household: Household;
  note: string;
};

export const HOUSEHOLD_PRESETS: HouseholdPreset[] = [
  {
    id: "household-a",
    label: "Household A · more prepared",
    household: {
      backup_power: "yes",
      equipment: "unknown",
      transportation: "yes",
    },
    note: "Backup + transportation. Checklist stays shorter; area index must not change.",
  },
  {
    id: "household-b",
    label: "Household B · more exposed",
    household: {
      backup_power: "no",
      equipment: "yes",
      transportation: "no",
    },
    note: "No backup, equipment dependence, no transport. Priorities expand; area index stays fixed.",
  },
];

export const DEMO_COUNTIES = [
  {
    fips: "48201",
    label: "Harris",
    tip: "Houston reference",
  },
  {
    fips: "48157",
    label: "Fort Bend",
    tip: "Sugar Land reference",
  },
  {
    fips: "48339",
    label: "Montgomery",
    tip: "Conroe reference",
  },
  {
    fips: "48039",
    label: "Brazoria",
    tip: "Manvel reference",
  },
] as const;

export const DEMO_BEATS = [
  {
    time: "0:00",
    show: "Problem: transparent area weather + household prep that changes with answers.",
  },
  {
    time: "0:30",
    show: "Area: live county check → 24h scored index → 7-day unscored strip. Index ≠ outage %.",
  },
  {
    time: "1:20",
    show: "Prepare: Household A then B. Full checklist count matches rows. Area stays fixed.",
  },
  {
    time: "2:10",
    show: "Local support: same county focus + optional place. OEM / CenterPoint / nearby search — status unverified.",
  },
  {
    time: "2:40",
    show: "Method + AI slide from docs/ai-validation.md. No-key = fallback, not a live AI win.",
  },
  {
    time: "3:20",
    show: "Next steps only — no partnership claims.",
  },
] as const;

export const PRODUCT_TOUR = [
  {
    id: "area",
    step: "01",
    title: "Area weather",
    body: "Live Open-Meteo index for Harris, Fort Bend, Montgomery, or Brazoria. Toggle 24 hours (scored) vs 7 days (unscored strip).",
    cta: "Open Area outlook",
    target: "area" as const,
  },
  {
    id: "prepare",
    step: "02",
    title: "Household preparation",
    body: "Answers reorder a full checklist — never the area score. Progress counts every visible item.",
    cta: "Open preparation",
    target: "prepare" as const,
  },
  {
    id: "support",
    step: "03",
    title: "Local support near you",
    body: "County agencies, outage tools, and map searches centered on your focus point. We do not invent open shelters.",
    cta: "Open Local support",
    target: "support" as const,
  },
  {
    id: "method",
    step: "04",
    title: "Sources & method",
    body: "Provenance, index rules, and honest AI status for the judges slide.",
    cta: "Open Sources & method",
    target: "method" as const,
  },
] as const;

export const TWO_PERSON_CHECKS = [
  "Alan: resident UI, preparation, presenter assets, UI/API integration",
  "Teammate: weather/outage data, index validation, Rust risk API",
  "Rehearse Harris + one other county before presenting",
  "Show 24h scored vs 7d unscored wording clearly",
  "Local support: never invent open/capacity status",
  "Screenshot fallback labeled as recorded if venue network fails",
  "No live-AI or probability claims without docs evidence",
] as const;

export const COLOR_SYSTEM = [
  {
    name: "Bay ink",
    token: "--ink",
    hex: "#122A33",
    why: "Cool gulf / control-room slate for authority and map chrome.",
  },
  {
    name: "Volt",
    token: "--orange",
    hex: "#E5892E",
    why: "Electrical signal for CTAs — urgency without lifestyle terracotta.",
  },
  {
    name: "Concrete",
    token: "--canvas",
    hex: "#E9EEF0",
    why: "Cool utility surface instead of warm-cream defaults.",
  },
  {
    name: "Sea mist",
    token: "--sage",
    hex: "#D5E3DF",
    why: "Coastal secondary panels for household and support.",
  },
] as const;
