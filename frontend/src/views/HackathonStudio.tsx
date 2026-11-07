import React, { useState } from "react";
import {
  AlertTriangle,
  Presentation,
  Users,
  Palette,
  Clock,
  CheckCircle2,
  MapPinned,
  LifeBuoy,
  ArrowRight,
  House,
  BookOpen,
  Play,
} from "lucide-react";
import type { Household } from "../api";
import { householdChecklistDelta } from "../lib/householdDelta";
import {
  COLOR_SYSTEM,
  DEMO_BEATS,
  DEMO_COUNTIES,
  HOUSEHOLD_PRESETS,
  PRODUCT_TOUR,
  SAMPLE_WEATHER,
  TWO_PERSON_CHECKS,
  type SampleWeather,
} from "../lib/studioSamples";

type Props = {
  onApplyHousehold: (household: Household) => void;
  onAssessCounty: (fips: string) => void;
  onGoPrepare: () => void;
  onGoArea: () => void;
  onGoSupport: () => void;
  onGoMethod: () => void;
};

export function HackathonStudio({
  onApplyHousehold,
  onAssessCounty,
  onGoPrepare,
  onGoArea,
  onGoSupport,
  onGoMethod,
}: Props) {
  const [sample, setSample] = useState<SampleWeather>(SAMPLE_WEATHER[1]);
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const [liveCounty, setLiveCounty] = useState<string>(DEMO_COUNTIES[0].fips);
  const [samplesOpen, setSamplesOpen] = useState(false);
  const [activeHousehold, setActiveHousehold] = useState<string>(
    HOUSEHOLD_PRESETS[0].id,
  );
  const householdDelta = householdChecklistDelta(
    HOUSEHOLD_PRESETS[0].household,
    HOUSEHOLD_PRESETS[1].household,
  );
  const activeActions =
    activeHousehold === HOUSEHOLD_PRESETS[1].id
      ? householdDelta.actionsB
      : householdDelta.actionsA;

  function goTour(target: (typeof PRODUCT_TOUR)[number]["target"]) {
    switch (target) {
      case "area":
        onGoArea();
        return;
      case "prepare":
        onGoPrepare();
        return;
      case "support":
        onGoSupport();
        return;
      case "method":
        onGoMethod();
        return;
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }

  function runLiveCheck() {
    onAssessCounty(liveCounty);
  }

  return (
    <div className="stack studio">
      <header className="studio-hero">
        <div className="studio-banner" role="status">
          <AlertTriangle size={18} aria-hidden />
          <div>
            <strong>Hackathon Studio · presentation sandbox</strong>
            <p>
              Jump into the live resident product, compare fictional households,
              and keep labeled sample weather for offline backup. Samples never
              replace a missing live forecast.
            </p>
          </div>
        </div>
      </header>

      <section className="panel studio-run">
        <div className="plan-heading">
          <h3>
            <Play size={16} aria-hidden /> Run a live area check
          </h3>
          <span>Real Open-Meteo · not a sample</span>
        </div>
        <p className="plan-note" style={{ marginTop: 0 }}>
          Pick a county, then jump straight into Area outlook and fetch the
          weather index. After it loads, flip <b>24 hours</b> / <b>7 days</b> in
          the dock.
        </p>
        <div className="studio-live-row">
          <label className="support-field">
            <span>County</span>
            <select
              value={liveCounty}
              onChange={(e) => setLiveCounty(e.target.value)}
            >
              {DEMO_COUNTIES.map((c) => (
                <option key={c.fips} value={c.fips}>
                  {c.label} · {c.tip}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="primary primary-accent assess-go"
            onClick={runLiveCheck}
          >
            Check area live <ArrowRight size={16} aria-hidden />
          </button>
        </div>
        <div className="studio-county-chips" role="list">
          {DEMO_COUNTIES.map((c) => (
            <button
              key={c.fips}
              type="button"
              role="listitem"
              className={
                "studio-chip" + (liveCounty === c.fips ? " active" : "")
              }
              onClick={() => setLiveCounty(c.fips)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="plan-heading">
          <h3>
            <MapPinned size={16} aria-hidden /> Product walkthrough
          </h3>
          <span>Four stops judges should see</span>
        </div>
        <div className="studio-tour">
          {PRODUCT_TOUR.map((stop) => (
            <article key={stop.id} className="studio-tour-card">
              <span className="studio-step">{stop.step}</span>
              <div>
                <h4>{stop.title}</h4>
                <p>{stop.body}</p>
                <button
                  type="button"
                  className="primary"
                  onClick={() => goTour(stop.target)}
                >
                  {stop.cta} <ArrowRight size={14} aria-hidden />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="plan-heading">
          <h3>
            <Users size={16} aria-hidden /> Compare households
          </h3>
          <span>Preparation only · area index stays fixed</span>
        </div>
        <div className="studio-flip" role="group" aria-label="Household flip">
          {HOUSEHOLD_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={
                "studio-flip-tab" +
                (activeHousehold === preset.id ? " active" : "")
              }
              aria-pressed={activeHousehold === preset.id}
              onClick={() => {
                setActiveHousehold(preset.id);
                onApplyHousehold(preset.household);
                setAppliedPreset(preset.id);
              }}
            >
              {preset.id === "household-a" ? "Household A" : "Household B"}
              <small>
                {preset.id === "household-a"
                  ? `${householdDelta.countA} actions`
                  : `${householdDelta.countB} actions`}
              </small>
            </button>
          ))}
        </div>
        <div className="studio-morph" aria-live="polite">
          <p className="studio-morph-lead">
            <strong>
              {activeHousehold === "household-a"
                ? householdDelta.countA
                : householdDelta.countB}{" "}
              checklist items
            </strong>{" "}
            for{" "}
            {activeHousehold === "household-a"
              ? "Household A · more prepared"
              : "Household B · more exposed"}
            . Same live weather index — only prep changes.
          </p>
          <ul className="studio-morph-list" key={activeHousehold}>
            {activeActions.map((action) => {
              const added =
                activeHousehold === "household-b" &&
                householdDelta.onlyB.some((x) => x.id === action.id);
              return (
                <li
                  key={action.id}
                  className={
                    "studio-morph-item" + (added ? " studio-morph-added" : "")
                  }
                >
                  <CheckCircle2 size={15} aria-hidden />
                  <span>
                    {action.title}
                    {added ? <em> + added for B</em> : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {activeHousehold === "household-b" &&
          householdDelta.onlyB.length > 0 ? (
            <p className="studio-delta-callout">
              +{householdDelta.onlyB.length} actions because no backup +
              equipment + no transportation.
            </p>
          ) : (
            <p className="studio-delta-callout muted">
              Flip to B to see the checklist grow for a more exposed household.
            </p>
          )}
        </div>
        <div className="preset-grid">
          {HOUSEHOLD_PRESETS.map((preset) => (
            <div key={preset.id} className="preset-card">
              <h4>{preset.label}</h4>
              <ul className="plain-list">
                <li>Backup power: {preset.household.backup_power}</li>
                <li>Equipment: {preset.household.equipment}</li>
                <li>Transportation: {preset.household.transportation}</li>
              </ul>
              <p className="plan-note">{preset.note}</p>
              <button
                type="button"
                className="primary primary-accent"
                onClick={() => {
                  onApplyHousehold(preset.household);
                  setAppliedPreset(preset.id);
                  setActiveHousehold(preset.id);
                  onGoPrepare();
                }}
              >
                <House size={15} aria-hidden /> Apply & open prepare
              </button>
              {appliedPreset === preset.id ? (
                <p className="preset-applied">
                  <CheckCircle2 size={14} aria-hidden /> Applied to session
                  answers
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-muted">
        <div className="plan-heading">
          <h3>
            <Clock size={16} aria-hidden /> Four-minute beats
          </h3>
          <span>docs/demo.md</span>
        </div>
        <ol className="demo-beats compact">
          {DEMO_BEATS.map((beat) => (
            <li key={beat.time}>
              <strong>{beat.time}</strong>
              <span>{beat.show}</span>
            </li>
          ))}
        </ol>
        <div className="studio-quick-links">
          <button type="button" className="text-button" onClick={onGoSupport}>
            <LifeBuoy size={14} aria-hidden /> Local support
          </button>
          <button type="button" className="text-button" onClick={onGoMethod}>
            <BookOpen size={14} aria-hidden /> Sources & method
          </button>
        </div>
      </section>

      <details
        className="panel studio-samples"
        open={samplesOpen}
        onToggle={(e) =>
          setSamplesOpen((e.target as HTMLDetailsElement).open)
        }
      >
        <summary>
          <span>
            <Presentation size={16} aria-hidden /> Offline sample weather
            <small>Labeled illustrations · never a silent live fallback</small>
          </span>
        </summary>
        <div className="sample-tabs">
          {SAMPLE_WEATHER.map((s) => (
            <button
              key={s.id}
              type="button"
              className={
                "sample-tab" + (sample.id === s.id ? " sample-tab-active" : "")
              }
              onClick={() => setSample(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <article className={"sample-card risk-card " + sample.band}>
          <div className="risk-top">
            <span>{sample.countyLabel}</span>
            <span className="status-chip">
              <span className="dot" />
              presentation only
            </span>
          </div>
          <div className="risk-label">Illustrative 24h weather index</div>
          <h3>
            {sample.band === "lower"
              ? "Lower weather stress"
              : sample.band === "elevated"
                ? "Elevated weather stress"
                : "High weather stress"}
          </h3>
          <div className="score">
            <strong>{sample.indexValue}</strong>
            <span>
              / 9<small>sample points</small>
            </span>
          </div>
          <div className="grid-metrics" style={{ marginTop: 12 }}>
            <div className="metric">
              <span>Peak wind gust</span>
              <strong>
                {sample.maxGustKmh.toFixed(1)} <small>km/h</small>
              </strong>
            </div>
            <div className="metric">
              <span>Total precipitation</span>
              <strong>
                {sample.precipitationMm.toFixed(1)} <small>mm</small>
              </strong>
            </div>
            <div className="metric">
              <span>High temperature</span>
              <strong>
                {sample.maxTemperatureC.toFixed(1)} <small>°C</small>
              </strong>
            </div>
          </div>
          <p style={{ marginTop: 12 }}>{sample.story}</p>
        </article>
      </details>

      <div className="grid-2">
        <section className="panel">
          <div className="plan-heading">
            <h3>
              <Users size={16} aria-hidden /> Two-person checklist
            </h3>
          </div>
          <ul className="plain-list">
            {TWO_PERSON_CHECKS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="plan-heading">
            <h3>
              <Palette size={16} aria-hidden /> Color system
            </h3>
            <span>Gulf grid</span>
          </div>
          <div className="swatches">
            {COLOR_SYSTEM.map((c) => (
              <div key={c.token}>
                <i style={{ background: c.hex }} />
                {c.name} {c.hex}
                <small>{c.why}</small>
              </div>
            ))}
          </div>
          <p className="plan-note" style={{ marginTop: 12 }}>
            Required AI slide: “AI we used and how we checked it.” See
            docs/ai-validation.md — no-key mode is fallback only.
          </p>
        </section>
      </div>
    </div>
  );
}
