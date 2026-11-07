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
    label: "Sample · calmer window",
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
    label: "Sample · elevated stress",
    countyLabel: "Fort Bend County · SAMPLE",
    band: "elevated",
    indexValue: 5,
    maxGustKmh: 65,
    precipitationMm: 48,
    maxTemperatureC: 25,
    story:
      "Illustrative elevated stress matching the synthetic fixture shape (gust + rain points). Presentation only — not a live Fort Bend fetch.",
  },
  {
    id: "high",
    label: "Sample · high stress",
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
    label: "Fictional household A",
    household: {
      backup_power: "yes",
      equipment: "unknown",
      transportation: "yes",
    },
    note: "Backup and transportation available. Area index must stay unchanged when you switch profiles. Checklist shows every eligible item (not a top-3-only list).",
  },
  {
    id: "household-b",
    label: "Fictional household B",
    household: {
      backup_power: "no",
      equipment: "yes",
      transportation: "no",
    },
    note: "No backup, equipment dependence, no reliable transportation. Priorities and checklist length change; the area assessment must not.",
  },
];

/** Demo counties to jump into live Area / Local support during rehearsal. */
export const DEMO_COUNTIES = [
  {
    fips: "48201",
    label: "Harris · Houston ref",
    tip: "Default live check + ReadyHarris / resilience hubs",
  },
  {
    fips: "48157",
    label: "Fort Bend · Sugar Land",
    tip: "Second county live fetch; OEM alerts directory",
  },
  {
    fips: "48339",
    label: "Montgomery · Conroe",
    tip: "Third county live fetch; MoCo OEM",
  },
  {
    fips: "48039",
    label: "Brazoria · Manvel",
    tip: "Manvel reference point; Brazoria OEM",
  },
] as const;

export const DEMO_BEATS = [
  {
    time: "0:00–0:30",
    show: "Name the resident problem: transparent area weather + household preparation. Outages hit households differently.",
  },
  {
    time: "0:30–1:20",
    show: "Live Area: check Harris, then flip Fort Bend or Montgomery. Show disclosed reference point on the map, 24h index, then 7-day unscored strip (not a weekly outage score). 30-day stays unavailable.",
  },
  {
    time: "1:20–2:10",
    show: "Prepare: apply household A, then B. Full checklist count matches visible rows. Mark one done; progress ring updates. Area index stays fixed.",
  },
  {
    time: "2:10–2:40",
    show: "Local support: same county focus, optional city/ZIP or device location. Open OEM + CenterPoint + nearby search — disclose unverified facility status.",
  },
  {
    time: "2:40–3:20",
    show: "Sources and method + required AI slide from docs/ai-validation.md. No-key mode is fallback, not a verified live AI run.",
  },
  {
    time: "3:20–4:00",
    show: "Next steps: validate AI usefulness, secure outage/forecast data, evaluate with residents/partners. No partnership claimed.",
  },
] as const;

export const TWO_PERSON_CHECKS = [
  "Alan: resident UI, preparation, presenter assets, UI/API integration",
  "Teammate: weather/outage data, index validation, Rust risk API",
  "Rehearse Harris + one other county (Fort Bend / Montgomery / Brazoria) before presenting",
  "Confirm 24h scored vs 7d unscored vs 30d unavailable wording",
  "Confirm Local support focus follows selected county; never invent open shelters",
  "Keep screenshot fallback (docs/screenshots/wattwise-desktop.jpg) if venue network fails — label it as recorded",
  "Never claim live AI, calibrated probability, or verified facility status without evidence",
] as const;

/** Documented color rationale for the studio swatch panel. */
export const COLOR_SYSTEM = [
  {
    name: "Bay ink",
    token: "--ink",
    hex: "#122A33",
    why: "Cool gulf / control-room slate for authority and map chrome — not purple AI chrome.",
  },
  {
    name: "Volt",
    token: "--orange",
    hex: "#E5892E",
    why: "Electrical signal / action amber. Warm enough to urge prep, cooler than lifestyle terracotta.",
  },
  {
    name: "Concrete",
    token: "--canvas",
    hex: "#E9EEF0",
    why: "Cool utility yard surface. Avoids the warm-cream (#F4F1EA) default that reads as generic lifestyle UI.",
  },
  {
    name: "Sea mist",
    token: "--sage",
    hex: "#D5E3DF",
    why: "Secondary calm panels for household and support — coastal, not avocado-cream.",
  },
] as const;
