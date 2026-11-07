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
} from "lucide-react";
import type { Household } from "../api";
import {
  COLOR_SYSTEM,
  DEMO_BEATS,
  DEMO_COUNTIES,
  HOUSEHOLD_PRESETS,
  SAMPLE_WEATHER,
  TWO_PERSON_CHECKS,
  type SampleWeather,
} from "../lib/studioSamples";

type Props = {
  onApplyHousehold: (household: Household) => void;
  onApplyCounty: (fips: string) => void;
  onGoPrepare: () => void;
  onGoArea: () => void;
  onGoSupport: () => void;
  onGoMethod: () => void;
};

export function HackathonStudio({
  onApplyHousehold,
  onApplyCounty,
  onGoPrepare,
  onGoArea,
  onGoSupport,
  onGoMethod,
}: Props) {
  const [sample, setSample] = useState<SampleWeather>(SAMPLE_WEATHER[1]);
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const [rehearsedCounty, setRehearsedCounty] = useState<string | null>(null);

  return (
    <div className="stack studio">
      <div className="studio-banner" role="status">
        <AlertTriangle size={18} aria-hidden />
        <div>
          <strong>Presentation mode — samples only</strong>
          <p>
            Weather cards below are labeled illustrations for rehearsal and
            offline backup. They are never sent to the live API and never
            replace a missing forecast. County jump buttons and household
            presets only set session UI state for the live resident flows.
          </p>
        </div>
      </div>

      <p className="section-lead">
        Rehearse against the current product: multi-county Area outlook,
        24h / 7d / 30d horizons, unified preparation checklist, and
        location-scoped Local support. Prefer live fetches when the network
        works; keep{" "}
        <code>docs/screenshots/wattwise-desktop.jpg</code> as a recorded
        fallback with its November 7, 2026 timestamp.
      </p>

      <section className="panel">
        <div className="plan-heading">
          <h3>
            <Clock size={16} aria-hidden /> Four-minute demo beats
          </h3>
          <span>Synced to current UI</span>
        </div>
        <ol className="demo-beats">
          {DEMO_BEATS.map((beat) => (
            <li key={beat.time}>
              <strong>{beat.time}</strong>
              <span>{beat.show}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel panel-muted">
        <div className="plan-heading">
          <h3>
            <MapPinned size={16} aria-hidden /> Live county rehearsal
          </h3>
          <span>Sets session county · not a sample forecast</span>
        </div>
        <p className="plan-note" style={{ marginTop: 0 }}>
          These jump into the real Area or Local support views with the selected
          FIPS. Weather still comes from Open-Meteo when you press Check area.
        </p>
        <div className="studio-county-grid">
          {DEMO_COUNTIES.map((c) => (
            <div key={c.fips} className="studio-county-card">
              <h4>{c.label}</h4>
              <p>{c.tip}</p>
              <div className="studio-county-actions">
                <button
                  type="button"
                  className="primary primary-accent"
                  onClick={() => {
                    onApplyCounty(c.fips);
                    setRehearsedCounty(c.fips);
                    onGoArea();
                  }}
                >
                  Area <ArrowRight size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    onApplyCounty(c.fips);
                    setRehearsedCounty(c.fips);
                    onGoSupport();
                  }}
                >
                  <LifeBuoy size={14} aria-hidden /> Support
                </button>
              </div>
              {rehearsedCounty === c.fips ? (
                <p className="preset-applied">
                  <CheckCircle2 size={14} aria-hidden /> Session county set to{" "}
                  {c.fips}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-button"
          style={{ marginTop: 12 }}
          onClick={onGoMethod}
        >
          Open Sources & method
        </button>
      </section>

      <section className="panel">
        <div className="plan-heading">
          <h3>
            <Presentation size={16} aria-hidden /> Sample weather scenarios
          </h3>
          <span>Not live data</span>
        </div>
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
          <div className="risk-label">Illustrative weather index · 24h sample</div>
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
          <p className="plan-note">
            Horizons reminder: live product scores 24h only; 7d is an unscored
            daily strip; 30d stays unavailable. Do not improvise a monthly
            outage %.
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="plan-heading">
          <h3>
            <Users size={16} aria-hidden /> Fictional household presets
          </h3>
          <span>Applies to prepare form only</span>
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
                  onGoPrepare();
                }}
              >
                Apply answers & open prepare
              </button>
              {appliedPreset === preset.id ? (
                <p className="preset-applied">
                  <CheckCircle2 size={14} aria-hidden /> Applied to session
                  answers (live area assessment untouched)
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

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
          <p className="plan-note" style={{ marginTop: 0 }}>
            Earlier ink/orange/cream drifted toward a generic lifestyle look.
            Current tokens are cooler utility colors: bay night, volt signal,
            concrete yard, sea mist.
          </p>
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
            Required AI slide title: “AI we used and how we checked it.” Status:
            deterministic weather index; optional AI wording not verified live
            without a key — see docs/ai-validation.md.
          </p>
        </section>
      </div>
    </div>
  );
}
