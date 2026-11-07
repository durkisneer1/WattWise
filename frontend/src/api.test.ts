import { describe, it, expect } from "vitest";
import { RiskSchema, PlanSchema, freshness } from "./api";
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
});
