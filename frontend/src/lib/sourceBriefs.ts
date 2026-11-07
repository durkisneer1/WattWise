/**
 * Short, source-attributed briefs for in-app reading.
 * Full guidance stays on the official pages — we do not invent clinical advice.
 */
export const SOURCE_BRIEFS: Record<
  string,
  { blurb: string; moreLabel: string }
> = {
  red_cross: {
    blurb:
      "American Red Cross power-outage guidance covers household planning, lighting and supplies, staying informed, and arranging help if you may need to stay home or leave safely.",
    moreLabel: "Additional details provided here (Red Cross)",
  },
  cdc_power: {
    blurb:
      "CDC power-source guidance covers flashlights and batteries, ways to stay informed, and preparing backup power options for essential needs before an outage.",
    moreLabel: "Additional details provided here (CDC)",
  },
};

/** Extra context for backup / equipment actions — still points readers to the source. */
export const ACTION_BRIEFS: Record<string, string> = {
  backup_review:
    "If you already have backup power, review which essential needs it covers and keep non-electric options ready. Confirm fuel, charge, and safe use before you need them.",
  equipment_plan:
    "If anyone relies on electricity-dependent equipment, plan with your care team or equipment provider before an outage — WattWise does not calculate clinical safety windows.",
  lighting:
    "Keep flashlights, lanterns, and spare batteries where everyone can find them in the dark.",
  communication:
    "Have a charged phone, power bank, and a battery-powered radio or weather radio for alerts.",
  supplies:
    "Check food and water stores ahead of storms so you are not shopping at the last minute.",
  contacts:
    "Write key numbers on paper in case devices lose power or signal.",
  support_network:
    "Agree with a trusted contact how they can help if you need to stay home or leave during an outage.",
};
