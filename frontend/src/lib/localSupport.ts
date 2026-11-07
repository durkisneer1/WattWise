import type { CountyCoverage } from "./coverage";
import { COUNTIES, coverageFor } from "./coverage";
import { centerpointOutageUrl } from "./motivators";

export type SupportAnchor = {
  label: string;
  lat: number;
  lon: number;
  source: "county_ref" | "device" | "lookup";
};

export type SupportLink = {
  id: string;
  name: string;
  url: string;
  detail: string;
  kind: "call" | "outage" | "agency" | "search" | "directory";
};

type CountyPack = {
  fips: string;
  shortName: string;
  utilityLabel: string;
  oemName: string;
  oemUrl: string;
  oemPhone?: string;
  alertName: string;
  alertUrl: string;
  cityHelp?: { name: string; url: string; detail: string };
};

/** Official county/agency directories only — not a verified facility inventory. */
const COUNTY_PACKS: Record<string, CountyPack> = {
  "48201": {
    fips: "48201",
    shortName: "Harris County",
    utilityLabel: "CenterPoint Energy",
    oemName: "ReadyHarris / Harris County OEM",
    oemUrl: "https://www.readyharris.org/",
    alertName: "ReadyHarris alerts & cooling guidance",
    alertUrl: "https://www.readyharris.org/",
    cityHelp: {
      name: "Houston Resilience Hubs directory",
      url: "https://www.greenhoustontx.gov/resilience-hubs/index.html",
      detail:
        "City directory of community-serving hubs. Check the page for current sites — WattWise does not verify open status.",
    },
  },
  "48157": {
    fips: "48157",
    shortName: "Fort Bend County",
    utilityLabel: "CenterPoint Energy",
    oemName: "Fort Bend County Homeland Security & Emergency Management",
    oemUrl:
      "https://www.fortbendcountytx.gov/government/departments/homeland-security-emergency-management",
    oemPhone: "281-342-3411",
    alertName: "Fort Bend alerts & warnings",
    alertUrl:
      "https://www.fortbendcountytx.gov/government/departments/homeland-security-emergency-management/alerts-warnings",
  },
  "48339": {
    fips: "48339",
    shortName: "Montgomery County",
    utilityLabel: "CenterPoint Energy",
    oemName: "Montgomery County Office of Homeland Security & Emergency Management",
    oemUrl: "https://mctxoem.org/",
    oemPhone: "936-523-3900",
    alertName: "Montgomery County OEM preparedness",
    alertUrl: "https://mctxoem.org/emergency-preparedness/",
  },
  "48039": {
    fips: "48039",
    shortName: "Brazoria County",
    utilityLabel: "CenterPoint Energy",
    oemName: "Brazoria County Office of Emergency Management",
    oemUrl: "https://www.brazoriacountytx.gov/departments/emergency-management",
    oemPhone: "979-864-1201",
    alertName: "Brazoria County emergency management",
    alertUrl: "https://www.brazoriacountytx.gov/departments/emergency-management",
  },
};

function osmSearch(query: string, lat: number, lon: number) {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}#map=12/${lat}/${lon}`;
}

function mapsSearch(query: string, lat: number, lon: number) {
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lon},12z`;
}

function findHelpSearch(place: string) {
  return `https://www.findhelp.org/search?q=${encodeURIComponent(place)}`;
}

export function defaultAnchorForCounty(fips: string): SupportAnchor | null {
  const c = coverageFor(fips);
  if (!c) return null;
  return {
    label: c.refLabel,
    lat: c.lat,
    lon: c.lon,
    source: "county_ref",
  };
}

export function countyOptions(): CountyCoverage[] {
  return COUNTIES;
}

export function buildSupportLinks(
  fips: string,
  anchor: SupportAnchor,
): {
  urgent: SupportLink[];
  power: SupportLink[];
  nearby: SupportLink[];
  agencies: SupportLink[];
} {
  const pack = COUNTY_PACKS[fips];
  const place = pack?.shortName ?? "Houston area";
  const near = `${anchor.lat.toFixed(3)}, ${anchor.lon.toFixed(3)}`;

  const urgent: SupportLink[] = [
    {
      id: "911",
      name: "Call 911 for life-threatening emergencies",
      url: "tel:911",
      detail: "Immediate danger, medical emergency, or downed live wires with people at risk.",
      kind: "call",
    },
    {
      id: "211",
      name: "Call 211 Texas for local help",
      url: "https://www.211texas.org/",
      detail: `Live operators can route ${place} residents to food, shelter, utility, and cooling help. Hours and programs vary.`,
      kind: "call",
    },
    {
      id: "findhelp",
      name: `FindHelp resources near ${place}`,
      url: findHelpSearch(place),
      detail:
        "Community program search scoped to your selected county name. Confirm eligibility and hours on each listing.",
      kind: "directory",
    },
    {
      id: "redcross-shelter",
      name: "American Red Cross open shelter finder",
      url: "https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter.html",
      detail:
        "National open-shelter map from Red Cross. Only shelters they list as open are shown there — WattWise does not maintain a parallel inventory.",
      kind: "directory",
    },
  ];

  const power: SupportLink[] = [
    {
      id: "centerpoint-outage",
      name: "CenterPoint Energy outage map",
      url: centerpointOutageUrl(anchor.lat, anchor.lon),
      detail: `Live outage tracker for ${pack?.utilityLabel ?? "Greater Houston electric service"}, opened near ${anchor.label}. Restoration notes come from the utility — not WattWise.`,
      kind: "outage",
    },
    {
      id: "centerpoint-action",
      name: "CenterPoint Action Center",
      url: "https://actioncenter.centerpointenergy.com/en-us",
      detail: "Storm prep, safety tips, and utility restoration guidance.",
      kind: "outage",
    },
    {
      id: "centerpoint-phone",
      name: "Report a CenterPoint outage by phone",
      url: "tel:7132072222",
      detail: "713-207-2222 · published CenterPoint electric outage line.",
      kind: "call",
    },
  ];

  const nearby: SupportLink[] = [
    {
      id: "search-cooling",
      name: "Search cooling centers near your focus point",
      url: mapsSearch(`cooling center near ${place}`, anchor.lat, anchor.lon),
      detail: `Map search centered on ${anchor.label} (${near}). Results are not WattWise-verified open facilities.`,
      kind: "search",
    },
    {
      id: "search-library",
      name: "Search public libraries nearby",
      url: osmSearch(`library near ${place}`, anchor.lat, anchor.lon),
      detail:
        "Libraries are often listed as temporary cooling or charging spots when activated — confirm on the county OEM page before traveling.",
      kind: "search",
    },
    {
      id: "search-pharmacy",
      name: "Search pharmacies & groceries nearby",
      url: mapsSearch(`pharmacy grocery near ${place}`, anchor.lat, anchor.lon),
      detail: "Useful for ice, batteries, and supplies. Hours change during outages.",
      kind: "search",
    },
    {
      id: "osm-here",
      name: "Open map at your focus point",
      url: `https://www.openstreetmap.org/?mlat=${anchor.lat}&mlon=${anchor.lon}#map=12/${anchor.lat}/${anchor.lon}`,
      detail: `Pinned to ${anchor.label}. Use this when sharing a meeting point or checking roads.`,
      kind: "search",
    },
  ];

  const agencies: SupportLink[] = [];
  if (pack) {
    agencies.push({
      id: "oem",
      name: pack.oemName,
      url: pack.oemUrl,
      detail: pack.oemPhone
        ? `Official county emergency management. Phone ${pack.oemPhone}.`
        : "Official county emergency management and heat/storm guidance.",
      kind: "agency",
    });
    agencies.push({
      id: "alerts",
      name: pack.alertName,
      url: pack.alertUrl,
      detail: "Sign up for alerts and read the latest county guidance before you travel.",
      kind: "agency",
    });
    if (pack.cityHelp) {
      agencies.push({
        id: "city-help",
        name: pack.cityHelp.name,
        url: pack.cityHelp.url,
        detail: pack.cityHelp.detail,
        kind: "directory",
      });
    }
  }

  return { urgent, power, nearby, agencies };
}

/** Resolve a Texas city or ZIP to coordinates via Open-Meteo geocoding. */
export async function lookupPlace(
  query: string,
  signal?: AbortSignal,
): Promise<SupportAnchor | null> {
  const q = query.trim();
  if (q.length < 2) return null;
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?" +
    new URLSearchParams({
      name: q,
      count: "5",
      language: "en",
      format: "json",
      countryCode: "US",
    });
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: Array<{
      name: string;
      latitude: number;
      longitude: number;
      admin1?: string;
      country_code?: string;
    }>;
  };
  const hit =
    data.results?.find(
      (r) =>
        r.country_code === "US" &&
        (r.admin1 === "Texas" || r.admin1 === "TX"),
    ) ?? data.results?.[0];
  if (!hit) return null;
  return {
    label: `${hit.name}${hit.admin1 ? `, ${hit.admin1}` : ""}`,
    lat: hit.latitude,
    lon: hit.longitude,
    source: "lookup",
  };
}
