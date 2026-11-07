import React, { useEffect, useRef, useState } from "react";
import {
  request,
  RiskSchema,
  PlanSchema,
  freshness,
  type Risk,
  type Plan,
  type Household,
} from "./api";
import { AppShell, type ViewId } from "./components/AppShell";
import { AreaOutlook } from "./views/AreaOutlook";
import { PreparationPlan } from "./views/PreparationPlan";
import { LocalSupport } from "./views/LocalSupport";
import { SourcesMethod } from "./views/SourcesMethod";
import { HackathonStudio } from "./views/HackathonStudio";

const initial: Household = {
  backup_power: "unknown",
  equipment: "unknown",
  transportation: "unknown",
};

export function App() {
  const [view, setView] = useState<ViewId>("area");
  const [county, setCounty] = useState("48201");
  const [risk, setRisk] = useState<Risk | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [household, setHousehold] = useState<Household>(initial);
  const [completed, setCompleted] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [now, setNow] = useState(Date.now());
  const generation = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  async function assess() {
    setBusy(true);
    setError("");
    setPlan(null);
    setRisk(null);
    const token = ++generation.current;
    try {
      const r = await request("/api/risk?county_fips=" + county, RiskSchema);
      if (token === generation.current) {
        setRisk(r);
        setView("area");
      }
    } catch {
      setError(
        "We couldn’t reach the weather service. Check that the WattWise server is running and try again. No estimate is available.",
      );
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }

  const status = risk ? freshness(risk, now) : null;

  useEffect(() => {
    setPlanError("");
    if (!risk || risk.status === "unsupported" || status === "stale") {
      setPlan(null);
      return;
    }
    const abort = new AbortController();
    // Soft refresh: keep the current plan visible so checklist/details stay open.
    setPlanning(true);
    const timer = setTimeout(() => {
      request(
        "/api/plan",
        PlanSchema,
        { risk_id: risk.risk_id, household, completed, use_ai: useAI },
        abort.signal,
      )
        .then((p) => {
          if (p.risk_id !== risk.risk_id)
            throw new Error("Assessment mismatch");
          setPlan(p);
        })
        .catch((e) => {
          if (!abort.signal.aborted) {
            setPlanError(e.message);
            setPlan(null);
          }
        })
        .finally(() => {
          if (!abort.signal.aborted) setPlanning(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [risk, household, completed, useAI, status]);

  const toggle = (id: string) =>
    setCompleted((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );

  const supported = Boolean(risk && status !== "unsupported");
  const statusNote = risk
    ? status === "current"
      ? risk.cached
        ? "Cached forecast"
        : "Live forecast retrieved"
      : String(status)
    : busy
      ? "Checking weather…"
      : "No forecast loaded";

  function changeCounty(next: string) {
    generation.current++;
    setCounty(next);
    setRisk(null);
    setPlan(null);
    setBusy(false);
    setError("");
  }

  return (
    <AppShell view={view} onNavigate={setView} statusNote={statusNote}>
      {view === "area" ? (
        <AreaOutlook
          county={county}
          onCountyChange={changeCounty}
          risk={risk}
          status={status}
          now={now}
          busy={busy}
          error={error}
          onAssess={assess}
          onGoPrepare={() => setView("prepare")}
        />
      ) : null}
      {view === "prepare" ? (
        <PreparationPlan
          household={household}
          onHouseholdChange={setHousehold}
          useAI={useAI}
          onUseAIChange={setUseAI}
          plan={plan}
          risk={risk}
          planning={planning}
          planError={planError}
          completed={completed}
          onToggleComplete={toggle}
          supported={supported}
          status={status}
          onAssess={assess}
          onGoArea={() => setView("area")}
        />
      ) : null}
      {view === "support" ? (
        <LocalSupport county={county} onCountyChange={changeCounty} />
      ) : null}
      {view === "method" ? (
        <SourcesMethod risk={risk} status={status} />
      ) : null}
      {view === "studio" ? (
        <HackathonStudio
          onApplyHousehold={setHousehold}
          onApplyCounty={changeCounty}
          onGoPrepare={() => setView("prepare")}
          onGoArea={() => setView("area")}
          onGoSupport={() => setView("support")}
          onGoMethod={() => setView("method")}
        />
      ) : null}
    </AppShell>
  );
}
