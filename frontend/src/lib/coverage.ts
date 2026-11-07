/** Supported counties — keep in sync with backend `risk::coverage`. */
export type CountyCoverage = {
  fips: string;
  name: string;
  placeHint: string;
  lat: number;
  lon: number;
  refLabel: string;
};

export const COUNTIES: CountyCoverage[] = [
  {
    fips: "48201",
    name: "Harris County, Texas",
    placeHint: "Houston reference",
    lat: 29.76,
    lon: -95.37,
    refLabel: "Houston reference weather point",
  },
  {
    fips: "48157",
    name: "Fort Bend County, Texas",
    placeHint: "Sugar Land reference",
    lat: 29.6197,
    lon: -95.6349,
    refLabel: "Sugar Land reference weather point",
  },
  {
    fips: "48339",
    name: "Montgomery County, Texas",
    placeHint: "Conroe reference",
    lat: 30.3119,
    lon: -95.4561,
    refLabel: "Conroe reference weather point",
  },
  {
    fips: "48039",
    name: "Brazoria County, Texas",
    placeHint: "Manvel reference",
    lat: 29.4855,
    lon: -95.3583,
    refLabel: "Manvel reference weather point",
  },
];

export function coverageFor(fips: string) {
  return COUNTIES.find((c) => c.fips === fips) ?? null;
}

export type HorizonId = "24h" | "7d";

export const HORIZONS: {
  id: HorizonId;
  label: string;
  detail: string;
}[] = [
  {
    id: "24h",
    label: "24 hours",
    detail: "Scored index for the next 24 hours",
  },
  {
    id: "7d",
    label: "7 days",
    detail: "Daily strip — not a weekly outage score",
  },
];
