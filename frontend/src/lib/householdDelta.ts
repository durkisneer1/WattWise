import type { Household } from "../api";

/** Action eligibility mirror of backend plan.rs — for Studio demo deltas only. */
const BANK: {
  id: string;
  title: string;
  when: (h: Household) => boolean;
}[] = [
  {
    id: "equipment_plan",
    title: "Review your equipment backup plan",
    when: (h) => h.equipment === "yes",
  },
  {
    id: "support_network",
    title: "Arrange a support contact",
    when: (h) => h.transportation === "no",
  },
  {
    id: "backup_review",
    title: "Review your backup arrangements",
    when: (h) => h.backup_power === "yes",
  },
  {
    id: "lighting",
    title: "Gather lighting and batteries",
    when: () => true,
  },
  {
    id: "communication",
    title: "Keep a way to stay informed",
    when: () => true,
  },
  {
    id: "supplies",
    title: "Check your essential supplies",
    when: () => true,
  },
  {
    id: "contacts",
    title: "Write down important contacts",
    when: () => true,
  },
];

export function eligibleActions(household: Household) {
  return BANK.filter((a) => a.when(household));
}

export function householdChecklistDelta(a: Household, b: Household) {
  const left = eligibleActions(a);
  const right = eligibleActions(b);
  const leftIds = new Set(left.map((x) => x.id));
  const rightIds = new Set(right.map((x) => x.id));
  const onlyA = left.filter((x) => !rightIds.has(x.id));
  const onlyB = right.filter((x) => !leftIds.has(x.id));
  return {
    countA: left.length,
    countB: right.length,
    actionsA: left,
    actionsB: right,
    onlyA,
    onlyB,
    shared: left.filter((x) => rightIds.has(x.id)).length,
  };
}
