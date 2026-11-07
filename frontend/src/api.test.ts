import { describe, it, expect } from "vitest";
import { RiskSchema, PlanSchema, MethodSchema, freshness } from "./api";
import {
  centerpointOutageUrl,
  freshnessCue,
  indexCue,
  indexDrivers,
  minutesUntilExpiry,
} from "./lib/motivators";
import { householdChecklistDelta } from "./lib/householdDelta";
import { HOUSEHOLD_PRESETS } from "./lib/studioSamples";
import riskFixture from "../../tests/fixtures/risk.json";
import planFixture from "../../tests/fixtures/plan.json";
describe("Rust to frontend contracts (synthetic test fixtures only)", () => {
  it("accepts the Rust risk and plan serialization", () => {
    expect(RiskSchema.parse(riskFixture).probability).toBeNull();
    expect(PlanSchema.parse(planFixture).language).toBe("en");
  });
  it("cannot silently accept a probability in index mode", () => {
    expect(
      RiskSchema.safeParse({ ...riskFixture, probability: 0.72 }).success,
    ).toBe(false);
  });
  it("rejects missing fields and unsafe source URLs", () => {
    expect(RiskSchema.safeParse({ risk_id: "partial" }).success).toBe(false);
    expect(
      PlanSchema.safeParse({
        ...planFixture,
        sources: [{ source_id: "x", name: "x", url: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });
  it("expires a result while the page stays open", () => {
    const r = RiskSchema.parse(riskFixture);
    expect(freshness(r, Date.parse(r.expires_at) - 1)).toBe("current");
    expect(freshness(r, Date.parse(r.expires_at))).toBe("stale");
  });
  it("preserves unavailable and unsupported states", () => {
    const r = RiskSchema.parse(riskFixture);
    expect(freshness({ ...r, status: "unavailable" })).toBe("unavailable");
    expect(freshness({ ...r, status: "unsupported" })).toBe("unsupported");
  });
  it("accepts the documented method payload shape", () => {
    expect(
      MethodSchema.parse({
        version: "weather-index-v1",
        scale: 9,
        wind: "gust rules",
        rain: "rain rules",
        temperature: "temp rules",
        bands: "band rules",
      }).version,
    ).toBe("weather-index-v1");
  });
  it("frames motivators without inventing probability", () => {
    const r = RiskSchema.parse(riskFixture);
    expect(indexCue(5, 9)).toBe("5 of 9 weather stress points");
    expect(indexCue(null, 9)).toBeNull();
    expect(minutesUntilExpiry(r, Date.parse(r.expires_at) - 120000)).toBe(2);
    expect(freshnessCue(r, "stale")).toMatch(/expired/i);
  });
  it("shows index drivers that sum to the fixture score", () => {
    const r = RiskSchema.parse(riskFixture);
    const drivers = indexDrivers(r.weather_features);
    expect(drivers).not.toBeNull();
    expect(drivers!.reduce((n, d) => n + d.points, 0)).toBe(r.index_value);
  });
  it("shows household A→B checklist growth without touching area risk", () => {
    const delta = householdChecklistDelta(
      HOUSEHOLD_PRESETS[0].household,
      HOUSEHOLD_PRESETS[1].household,
    );
    expect(delta.countB).toBeGreaterThan(delta.countA);
    expect(delta.onlyB.map((a) => a.id)).toEqual(
      expect.arrayContaining(["equipment_plan", "support_network"]),
    );
  });
  it("builds a CenterPoint tracker URL with a location view payload", () => {
    const url = centerpointOutageUrl(29.76, -95.37);
    expect(url).toContain("https://tracker.centerpointenergy.com/map/texas?");
    expect(url).toContain("location=");
    const encoded = new URL(url).searchParams.get("location");
    expect(encoded).toBeTruthy();
    const view = JSON.parse(atob(encoded!));
    expect(view.view.latitude).toBe(29.76);
    expect(view.view.longitude).toBe(-95.37);
    expect(view.view.zoom).toBe(11);
    expect(view.view.eventId).toBeNull();
  });
});
