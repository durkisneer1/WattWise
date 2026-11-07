import type { Household } from "../api";
import { COUNTIES } from "./coverage";

/** Presentation-only weather samples. Never sent to /api/risk or used as live fallback. */
export type SampleDaily = {
  date: string;
  max_gust_kmh: number;
  precipitation_mm: number;
  min_temperature_c: number;
  max_temperature_c: number;
};

export type SampleHourly = {
  time: string;
  gust_kmh: number;
  precipitation_mm: number;
  temperature_c: number;
};

export type SampleWeather = {
  id: string;
  label: string;
  countyFips: string;
  countyLabel: string;
  refLabel: string;
  lat: number;
  lon: number;
  band: "lower" | "elevated" | "high";
  displayLabel: string;
  indexValue: number;
  maxGustKmh: number;
  precipitationMm: number;
  minTemperatureC: number;
  maxTemperatureC: number;
  story: string;
  hourly: SampleHourly[];
  daily: SampleDaily[];
};

function countyByFips(fips: string) {
  const c = COUNTIES.find((x) => x.fips === fips);
  if (!c) throw new Error(`Unknown sample county ${fips}`);
  return c;
}

function buildHourly(
  baseIso: string,
  peakGust: number,
  totalRain: number,
  minT: number,
  maxT: number,
): SampleHourly[] {
  const start = Date.parse(baseIso);
  return Array.from({ length: 24 }, (_, i) => {
    const t = new Date(start + i * 3600_000).toISOString();
    const wave = Math.sin((i / 24) * Math.PI);
    return {
      time: t,
      gust_kmh: Number((peakGust * (0.45 + 0.55 * wave)).toFixed(1)),
      precipitation_mm: Number(((totalRain / 24) * (0.4 + wave)).toFixed(2)),
      temperature_c: Number((minT + (maxT - minT) * wave).toFixed(1)),
    };
  });
}

function buildDaily(
  startDate: string,
  peakGust: number,
  rain: number,
  minT: number,
  maxT: number,
): SampleDaily[] {
  const start = Date.parse(`${startDate}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start + i * 86400_000);
    const date = d.toISOString().slice(0, 10);
    const fade = 1 - i * 0.08;
    return {
      date,
      max_gust_kmh: Number((peakGust * fade).toFixed(1)),
      precipitation_mm: Number((rain * (0.55 + (i % 3) * 0.15)).toFixed(1)),
      min_temperature_c: Number((minT + (i % 2)).toFixed(1)),
      max_temperature_c: Number((maxT - (i % 2) * 0.5).toFixed(1)),
    };
  });
}

const harris = countyByFips("48201");
const fortBend = countyByFips("48157");
const montgomery = countyByFips("48339");
const SAMPLE_BASE = "2026-11-07T18:00:00.000Z";
const SAMPLE_DAY = "2026-11-07";

export const SAMPLE_WEATHER: SampleWeather[] = [
  {
    id: "calm",
    label: "Calmer",
    countyFips: harris.fips,
    countyLabel: `${harris.name} · SAMPLE`,
    refLabel: harris.refLabel,
    lat: harris.lat,
    lon: harris.lon,
    band: "lower",
    displayLabel: "Lower weather stress",
    indexValue: 0,
    maxGustKmh: 28,
    precipitationMm: 1.2,
    minTemperatureC: 18,
    maxTemperatureC: 24,
    story:
      "Illustrative lower stress: light gusts and little rain. Still not an outage probability.",
    hourly: buildHourly(SAMPLE_BASE, 28, 1.2, 18, 24),
    daily: buildDaily(SAMPLE_DAY, 28, 1.2, 18, 24),
  },
  {
    id: "elevated",
    label: "Elevated",
    countyFips: fortBend.fips,
    countyLabel: `${fortBend.name} · SAMPLE`,
    refLabel: fortBend.refLabel,
    lat: fortBend.lat,
    lon: fortBend.lon,
    band: "elevated",
    displayLabel: "Elevated weather stress",
    indexValue: 5,
    maxGustKmh: 65,
    precipitationMm: 48,
    minTemperatureC: 19,
    maxTemperatureC: 25,
    story:
      "Illustrative elevated stress matching the synthetic fixture shape. Presentation only — not a live fetch.",
    hourly: buildHourly(SAMPLE_BASE, 65, 48, 19, 25),
    daily: buildDaily(SAMPLE_DAY, 65, 48, 19, 25),
  },
  {
    id: "high",
    label: "High",
    countyFips: montgomery.fips,
    countyLabel: `${montgomery.name} · SAMPLE`,
    refLabel: montgomery.refLabel,
    lat: montgomery.lat,
    lon: montgomery.lon,
    band: "high",
    displayLabel: "High weather stress",
    indexValue: 8,
    maxGustKmh: 88,
    precipitationMm: 90,
    minTemperatureC: 27,
    maxTemperatureC: 39,
    story:
      "Illustrative high stress: strong gusts, heavy rain, and heat extreme. Not a live forecast.",
    hourly: buildHourly(SAMPLE_BASE, 88, 90, 27, 39),
    daily: buildDaily(SAMPLE_DAY, 88, 90, 27, 39),
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
