import type { Risk } from "../api";
import { formatF, formatMph } from "./units";

/** Honest numeric cues — never framed as outage probability or safety score. */
export function minutesUntilExpiry(risk: Risk, now = Date.now()) {
  const ms = Date.parse(risk.expires_at) - now;
  return Math.max(0, Math.ceil(ms / 60000));
}

export function freshnessCue(risk: Risk, status: string | null, now = Date.now()) {
  if (status === "stale") {
    return "Assessment expired — refresh before building a new plan.";
  }
  if (status !== "current") return null;
  const mins = minutesUntilExpiry(risk, now);
  if (mins <= 5) {
    return `${mins} min left before this assessment goes stale.`;
  }
  return `Assessment stays current for about ${mins} more minutes.`;
}

export function indexCue(indexValue: number | null, scale: number | null) {
  if (indexValue == null || scale == null) return null;
  return `${indexValue} of ${scale} weather stress points (not an outage probability).`;
}

export type IndexDriver = {
  id: "wind" | "rain" | "temperature";
  label: string;
  points: number;
  maxPoints: number;
  detail: string;
};

/** Mirror of backend weather-index-v1 thresholds — display only, not a second scorer. */
export function indexDrivers(
  features: Risk["weather_features"],
): IndexDriver[] | null {
  if (!features) return null;
  const wind =
    features.max_gust_kmh >= 80
      ? 4
      : features.max_gust_kmh >= 60
        ? 3
        : features.max_gust_kmh >= 40
          ? 2
          : 0;
  const rain =
    features.precipitation_mm >= 75
      ? 3
      : features.precipitation_mm >= 25
        ? 2
        : 0;
  const temperature =
    features.min_temperature_c <= 0 || features.max_temperature_c >= 38
      ? 2
      : 0;
  return [
    {
      id: "wind",
      label: "Wind",
      points: wind,
      maxPoints: 4,
      detail: `Peak gust ${formatMph(features.max_gust_kmh)} mph`,
    },
    {
      id: "rain",
      label: "Rain",
      points: rain,
      maxPoints: 3,
      detail: `${features.precipitation_mm.toFixed(1)} mm in window`,
    },
    {
      id: "temperature",
      label: "Temp",
      points: temperature,
      maxPoints: 2,
      detail: `${formatF(features.min_temperature_c)}–${formatF(features.max_temperature_c)} °F`,
    },
  ];
}

/** Official Houston-area Outage Tracker (old Azure GIS host is gone). */
export function centerpointOutageUrl(lat: number, lon: number, zoom = 11) {
  // CenterPoint expects a base64 JSON view payload in ?location=
  // (same shape the tracker writes when you pan/zoom). Restoration times
  // still come only from the utility — never invented here.
  const payload = JSON.stringify({
    view: {
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      zoom,
      eventId: null,
    },
  });
  // Prefer raw base64 (no URI escaping) — matches CenterPoint's own links.
  const location = btoa(payload);
  return `https://tracker.centerpointenergy.com/map/texas?location=${location}`;
}
