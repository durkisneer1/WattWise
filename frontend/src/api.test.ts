import { describe, it, expect } from "vitest";
import { RiskSchema, PlanSchema, MethodSchema, freshness } from "./api";
import { freshnessCue, indexCue, minutesUntilExpiry } from "./lib/motivators";
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
    expect(indexCue(5, 9)).toContain("not an outage probability");
    expect(indexCue(null, 9)).toBeNull();
    expect(minutesUntilExpiry(r, Date.parse(r.expires_at) - 120000)).toBe(2);
    expect(freshnessCue(r, "stale")).toMatch(/expired/i);
  });
});
