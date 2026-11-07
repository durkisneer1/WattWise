import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Zap,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  ShieldCheck,
  Check,
  RefreshCw,
  Info,
  ChevronDown,
  Radio,
  Activity,
  House,
  ExternalLink,
} from "lucide-react";
import {
  request,
  RiskSchema,
  PlanSchema,
  freshness,
  type Risk,
  type Plan,
  type Household,
  type Answer,
} from "./api";
import "./style.css";
const time = (s: string | null) =>
  s
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(s))
    : "Not supplied";
const initial: Household = {
  backup_power: "unknown",
  equipment: "unknown",
  transportation: "unknown",
};
function App() {
  const [county, setCounty] = useState("48201"),
    [risk, setRisk] = useState<Risk | null>(null),
    [plan, setPlan] = useState<Plan | null>(null),
    [household, setHousehold] = useState<Household>(initial),
    [completed, setCompleted] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [planning, setPlanning] = useState(false),
    [error, setError] = useState(""),
    [planError, setPlanError] = useState(""),
    [useAI, setUseAI] = useState(false),
    [evidence, setEvidence] = useState(false),
    [now, setNow] = useState(Date.now());
  const resultRef = useRef<HTMLElement>(null);
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
        setTimeout(
          () =>
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          50,
        );
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
    setPlan(null);
    setPlanError("");
    if (!risk || risk.status === "unsupported" || status === "stale") return;
    const abort = new AbortController();
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
          if (!abort.signal.aborted) setPlanError(e.message);
        })
        .finally(() => {
          if (!abort.signal.aborted) setPlanning(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      abort.abort();
      setPlanning(false);
    };
  }, [risk, household, completed, useAI, status]);
  const toggle = (id: string) =>
    setCompleted((v) =>
      v.includes(id) ? v.filter((x) => x !== id) : [...v, id],
    );
  const supported = risk && status !== "unsupported";
  const current = status === "current";
  return (
    <>
      <header className="header">
        <a href="#" className="brand" aria-label="WattWise home">
          <span className="brand-icon">
            <Zap size={21} fill="currentColor" />
          </span>
          Watt<span>Wise</span>
          <span className="beta">FIELD NOTES / 01</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#assessment">Area conditions</a>
          <a href="#prepare">Your preparation</a>
          <button
            onClick={() => {
              setEvidence(true);
              setTimeout(
                () =>
                  document
                    .getElementById("evidence")
                    ?.scrollIntoView({ behavior: "smooth" }),
                50,
              );
            }}
          >
            How it works <ArrowUpRight size={14} />
          </button>
        </nav>
        <span className="region">
          <span className="dot" /> HARRIS COUNTY, TX
        </span>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="line" /> WEATHER AWARE. HOUSEHOLD READY.
            </div>
            <h1>
              A little foresight.
              <br />A better <em>plan.</em>
            </h1>
            <p>
              Understand the weather ahead. Take practical steps to keep your
              household ready for a power disruption.
            </p>
            <div className="location-box">
              <label htmlFor="county">START WITH YOUR AREA</label>
              <div className="location-row">
                <MapPin size={20} />
                <select
                  id="county"
                  value={county}
                  onChange={(e) => {
                    generation.current++;
                    setCounty(e.target.value);
                    setRisk(null);
                    setPlan(null);
                    setBusy(false);
                    setError("");
                  }}
                >
                  <option value="48201">Harris County, Texas</option>
                  <option value="48157">
                    Fort Bend County · not yet supported
                  </option>
                  <option value="48339">
                    Montgomery County · not yet supported
                  </option>
                </select>
                <button className="primary" onClick={assess} disabled={busy}>
                  {busy ? (
                    <>
                      <RefreshCw size={17} className="spin" /> Checking weather
                    </>
                  ) : (
                    <>
                      Check my area <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
              <span className="location-note">
                County-level guidance. No address needed.
              </span>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="visual-caption">
              <Activity size={15} /> A CLEARER PICTURE OF WHAT’S AHEAD
            </div>
            <div className="radar">
              <div className="orbit o1" />
              <div className="orbit o2" />
              <div className="orbit o3" />
              <div className="cross c1" />
              <div className="cross c2" />
              <svg viewBox="0 0 360 260" className="county-art">
                <path d="M80 55 150 28 195 47 229 34 251 80 299 99 278 130 312 156 275 184 227 191 207 227 168 215 144 234 121 192 80 173 54 129Z" />
                <path
                  className="road"
                  d="M82 69 130 102 173 123 232 110 286 106M65 142 124 143 173 123 206 178 226 191M172 53 174 123 155 211"
                />
              </svg>
              <div className="map-point">
                <span />
                Houston
              </div>
              <div className="coordinate">29.76° N &nbsp; 95.37° W</div>
            </div>
            <div className="visual-footer">
              <span>HARRIS COUNTY</span>
              <span>
                REFERENCE WEATHER POINT <span className="cyan">↗</span>
              </span>
            </div>
          </div>
        </section>
        <div className="principles">
          <span>
            <MapPin size={15} /> One area assessment
          </span>
          <span>
            <House size={16} /> A plan for your household
          </span>
          <span>
            <ShieldCheck size={16} /> Sources you can inspect
          </span>
          <span className="prototype">EXPERIMENTAL PROTOTYPE</span>
        </div>
        <section id="assessment" ref={resultRef} className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / THE WEATHER AHEAD</span>
              <h2>Your area, in perspective.</h2>
            </div>
            {risk && (
              <button className="text-button" onClick={assess} disabled={busy}>
                <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
                assessment
              </button>
            )}
          </div>
          {!risk ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Radio size={28} />
              </span>
              <div>
                <h3>
                  {busy
                    ? "Reading the latest forecast…"
                    : "Start with a view of your area."}
                </h3>
                <p>
                  {busy
                    ? "Checking hourly weather inputs and their coverage."
                    : "Choose your county above to see the next 24-hour weather window."}
                </p>
              </div>
              <span className="empty-tag">NO FORECAST LOADED</span>
            </div>
          ) : (
            <>
              <div
                className={"assessment-grid " + (!current ? "not-current" : "")}
              >
                <article
                  className={
                    "risk-card " + (current ? risk.risk_band : "unknown")
                  }
                >
                  <div className="risk-top">
                    <span>
                      {risk.county_name ?? "Outside supported coverage"}
                    </span>
                    <span className="status">
                      <span className="dot" />
                      {status === "current"
                        ? risk.cached
                          ? "Cached forecast"
                          : "Forecast retrieved"
                        : status}
                    </span>
                  </div>
                  <div className="risk-label">
                    {current
                      ? "EXPERIMENTAL WEATHER INDEX"
                      : "ASSESSMENT STATUS"}
                  </div>
                  <h3>
                    {status === "stale"
                      ? "This forecast needs a refresh."
                      : risk.display_label}
                  </h3>
                  {current ? (
                    <>
                      <div className="score">
                        <strong>{risk.index_value}</strong>
                        <span>
                          / {risk.index_scale}
                          <small>weather index points</small>
                        </span>
                        <div
                          className="index-bars"
                          aria-label={`${risk.index_value} of 9 weather index points`}
                        >
                          {Array.from({ length: 9 }, (_, i) => (
                            <i
                              key={i}
                              className={
                                i < (risk.index_value ?? 0) ? "filled" : ""
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p>
                        Weather stress is {risk.risk_band}. Outages can still
                        happen at any index level. This is not a percentage
                        chance of losing power.
                      </p>
                    </>
                  ) : (
                    <p>
                      {status === "unsupported"
                        ? "Our first release covers Harris County only. Select Harris County to continue."
                        : status === "stale"
                          ? "This result is too old to use as a current assessment. Refresh to check for new weather data."
                          : "We don’t have a complete forecast right now. General preparation guidance is still available below."}
                    </p>
                  )}
                  <div className="forecast-window">
                    <span>FORECAST WINDOW · CENTRAL TIME</span>
                    <b>
                      {time(risk.valid_from)}
                      {risk.valid_to && <> → {time(risk.valid_to)}</>}
                    </b>
                  </div>
                </article>
                <div className="weather-panel">
                  <div className="panel-heading">
                    <h3>What’s behind the index</h3>
                    <span>24-HOUR OUTLOOK</span>
                  </div>
                  <div className="weather-metrics">
                    {[
                      {
                        icon: <Wind />,
                        label: "Peak wind gust",
                        value: current
                          ? risk.weather_features?.max_gust_kmh
                          : null,
                        unit: "km/h",
                      },
                      {
                        icon: <Droplets />,
                        label: "Total precipitation",
                        value: current
                          ? risk.weather_features?.precipitation_mm
                          : null,
                        unit: "mm",
                      },
                      {
                        icon: <Thermometer />,
                        label: "High temperature",
                        value: current
                          ? risk.weather_features?.max_temperature_c
                          : null,
                        unit: "°C",
                      },
                    ].map((m) => (
                      <div className="metric" key={m.label}>
                        {m.icon}
                        <span>{m.label}</span>
                        <strong>
                          {m.value != null ? m.value.toFixed(1) : "—"}{" "}
                          <small>{m.unit}</small>
                        </strong>
                      </div>
                    ))}
                  </div>
                  {current && risk.hourly.length > 0 ? (
                    <div className="sparkline">
                      <div className="chart-label">
                        <span>Forecast wind gusts</span>
                        <span>km/h</span>
                      </div>
                      <svg
                        viewBox="0 0 600 70"
                        role="img"
                        aria-label="Hourly wind gust forecast; exact values available in the table below"
                      >
                        <path
                          d={
                            "M " +
                            risk.hourly
                              .map(
                                (h, i) =>
                                  `${(i * 600) / 23},${65 - (h.gust_kmh / Math.max(100, ...risk.hourly.map((x) => x.gust_kmh))) * 60}`,
                              )
                              .join(" L ")
                          }
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <path d="M0 68H600" stroke="#d9e2e5" />
                      </svg>
                      <div className="chart-label">
                        <span>{time(risk.valid_from)}</span>
                        <span>+24 hours</span>
                      </div>
                      <details>
                        <summary>View hourly values</summary>
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Central time</th>
                                <th>Gust km/h</th>
                                <th>Rain mm</th>
                                <th>Temp °C</th>
                              </tr>
                            </thead>
                            <tbody>
                              {risk.hourly.map((h) => (
                                <tr key={h.time}>
                                  <td>{time(h.time)}</td>
                                  <td>{h.gust_kmh}</td>
                                  <td>{h.precipitation_mm}</td>
                                  <td>{h.temperature_c}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="no-weather">
                      <Info size={20} />
                      <p>
                        {status === "stale"
                          ? "Old weather values are hidden until the assessment is refreshed."
                          : "Weather inputs appear here after a supported forecast is available."}
                      </p>
                    </div>
                  )}
                  <div className="weather-foot">
                    <span>
                      Source:{" "}
                      <a
                        href="https://open-meteo.com/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open-Meteo ↗
                      </a>
                    </span>
                    <span>Retrieved {time(risk.fetched_at)}</span>
                  </div>
                </div>
              </div>
              {supported && (
                <div className="scope-note">
                  <Info size={15} />
                  <span>
                    Houston reference-point forecast for Harris County guidance.
                    Conditions vary across the county. This tool does not
                    monitor the power grid.
                  </span>
                </div>
              )}
            </>
          )}
        </section>
        <section id="prepare" className="section preparation">
          <div className="section-heading">
            <div>
              <span className="eyebrow">02 / YOUR NEXT STEPS</span>
              <h2>Same weather. Your own plan.</h2>
            </div>
            <span className="subheading">
              Small preparations make a difference.
            </span>
          </div>
          <div className="prep-grid">
            <aside className="questionnaire">
              <div className="panel-heading">
                <h3>A little about your household</h3>
                <House size={19} />
              </div>
              <p>
                Optional answers help prioritize your checklist. They never
                change the area assessment.
              </p>
              {(
                [
                  { key: "backup_power", label: "Do you have backup power?" },
                  {
                    key: "equipment",
                    label:
                      "Does anyone rely on electricity-dependent equipment?",
                  },
                  {
                    key: "transportation",
                    label: "Do you have reliable transportation?",
                  },
                ] as const
              ).map((q) => (
                <fieldset key={q.key}>
                  <legend>{q.label}</legend>
                  <div className="options">
                    {(
                      [
                        "yes",
                        "no",
                        "unknown",
                        "prefer_not_to_answer",
                      ] as Answer[]
                    ).map((a) => (
                      <label
                        key={a}
                        className={household[q.key] === a ? "selected" : ""}
                      >
                        <input
                          type="radio"
                          name={q.key}
                          value={a}
                          checked={household[q.key] === a}
                          onChange={() =>
                            setHousehold((h) => ({ ...h, [q.key]: a }))
                          }
                        />
                        {a === "unknown"
                          ? "Unsure"
                          : a === "prefer_not_to_answer"
                            ? "Prefer not to answer"
                            : a === "yes"
                              ? "Yes"
                              : "No"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <label className="ai-toggle">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                />
                <span>
                  Use AI-assisted wording if available
                  <small>
                    Only general actions and weather are sent to the provider.
                    Household answers stay on this server.
                  </small>
                </span>
              </label>
              <div className="privacy">
                <ShieldCheck size={15} />
                <span>
                  No names. No addresses. Answers are kept only for this
                  session.
                </span>
              </div>
            </aside>
            <div className="plan-panel">
              <div className="plan-heading">
                <h3>Your priorities</h3>
                <span>
                  {plan
                    ? plan.explanation_mode === "ai_selected_approved_text"
                      ? "AI-SELECTED APPROVED TEXT"
                      : "SOURCE-BACKED GUIDANCE"
                    : "READY WHEN YOU ARE"}
                </span>
              </div>
              <div aria-live="polite" aria-busy={planning}>
                {!supported ? (
                  <div className="plan-empty">
                    <ShieldCheck size={34} />
                    <h3>A practical plan starts here.</h3>
                    <p>
                      Check a supported county to build your source-linked
                      preparation checklist.
                    </p>
                  </div>
                ) : status === "stale" ? (
                  <div className="plan-empty">
                    <RefreshCw size={30} />
                    <h3>Refresh your area assessment.</h3>
                    <p>
                      Your selections are still here. Refresh to reconnect your
                      plan to a recent assessment.
                    </p>
                  </div>
                ) : planning ? (
                  <div className="plan-empty">
                    <RefreshCw className="spin" size={24} />
                    <p>Preparing your next steps…</p>
                  </div>
                ) : planError ? (
                  <div className="error" role="alert">
                    {planError}
                    <button onClick={assess}>Refresh assessment</button>
                  </div>
                ) : plan ? (
                  <>
                    {plan.actions.length === 0 && (
                      <div className="plan-empty">
                        <Check size={30} />
                        <h3>Your checklist is complete.</h3>
                        <p>
                          Review your preparations as circumstances change.
                          Completion is not a safety score.
                        </p>
                      </div>
                    )}
                    {plan.actions.map((a, i) => (
                      <article className="action" key={a.action_id}>
                        <span className="action-number">0{i + 1}</span>
                        <div>
                          <h4>{a.title}</h4>
                          <p>{a.explanation}</p>
                          {a.source_ids.map((id) => {
                            const source = plan.sources.find(
                              (s) => s.source_id === id,
                            );
                            return source ? (
                              <a
                                key={id}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.name} <ArrowUpRight size={12} />
                              </a>
                            ) : null;
                          })}
                        </div>
                        <button
                          className="complete-button"
                          aria-label={"Mark complete: " + a.title}
                          onClick={() => toggle(a.action_id)}
                        >
                          <Check size={16} />
                        </button>
                      </article>
                    ))}
                    <details className="checklist">
                      <summary>
                        <span>
                          Full preparation checklist{" "}
                          <small>
                            {plan.checklist.filter((a) => a.completed).length}{" "}
                            of {plan.checklist.length} completed
                          </small>
                        </span>
                        <ChevronDown size={17} />
                      </summary>
                      {plan.checklist.map((a) => (
                        <label key={a.action_id}>
                          <input
                            type="checkbox"
                            checked={completed.includes(a.action_id)}
                            onChange={() => toggle(a.action_id)}
                          />
                          <span>{a.title}</span>
                        </label>
                      ))}
                      <p>
                        Completion tracks your selections, not your household’s
                        safety.
                      </p>
                    </details>
                    <p className="plan-note">
                      {useAI &&
                      plan.explanation_mode === "approved_text_fallback"
                        ? "AI wording was not available or did not pass validation. Approved guidance is shown."
                        : "Prepared from reviewed public preparedness guidance."}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </section>
        <section id="evidence" className="evidence section">
          <button
            className="evidence-toggle"
            aria-expanded={evidence}
            onClick={() => setEvidence(!evidence)}
          >
            <div>
              <span className="eyebrow">03 / OPEN BY DESIGN</span>
              <h2>No black box. See the evidence.</h2>
              <p>
                Our inputs, rules, sources and limitations — all in one place.
              </p>
            </div>
            <span className="evidence-button">
              {evidence ? "Close methodology" : "Explore methodology"}{" "}
              <ChevronDown className={evidence ? "rotated" : ""} size={18} />
            </span>
          </button>
          {evidence && (
            <div className="evidence-content">
              <div>
                <h3>How the index works</h3>
                <p>
                  This experimental, project-designed index adds weather stress
                  points. It has not been calibrated against power outages.
                </p>
                <dl>
                  <dt>Wind gusts</dt>
                  <dd>40–&lt;60 km/h: 2 points; 60–&lt;80: 3; ≥80: 4.</dd>
                  <dt>Precipitation over 24 hours</dt>
                  <dd>25–&lt;75 mm: 2 points; ≥75 mm: 3.</dd>
                  <dt>Temperature extremes</dt>
                  <dd>Minimum ≤0 °C or maximum ≥38 °C: 2 points.</dd>
                  <dt>Index bands</dt>
                  <dd>
                    0–2 lower · 3–5 elevated · 6–9 high. Below-threshold inputs
                    add zero points.
                  </dd>
                </dl>
                <p>
                  No numerical outage probability is produced. Lower weather
                  stress does not rule out an outage.
                </p>
              </div>
              <div>
                <h3>Where the evidence comes from</h3>
                <dl>
                  <dt>Coverage</dt>
                  <dd>Harris County, Texas · FIPS 48201</dd>
                  <dt>Weather reference point</dt>
                  <dd>Houston · 29.76, −95.37</dd>
                  <dt>Assessment created</dt>
                  <dd>{time(risk?.assessment_created_at ?? null)}</dd>
                  <dt>Forecast issue time</dt>
                  <dd>Not supplied by the weather endpoint</dd>
                  <dt>Retrieved / expires</dt>
                  <dd>
                    {time(risk?.fetched_at ?? null)} /{" "}
                    {time(risk?.expires_at ?? null)}
                  </dd>
                  <dt>Method</dt>
                  <dd>
                    weather-index-v1 · refresh cache after 10 min; stale after
                    30 min
                  </dd>
                </dl>
                {risk?.evidence.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
              <div className="evidence-bottom">
                <h3>What this prototype can and can’t tell you</h3>
                <p>
                  It uses a live forecast when available, not grid telemetry or
                  a trained outage model. No historical model accuracy has been
                  established. The weather index is a rule-based calculation;
                  optional AI chooses from approved wording and cannot change
                  the assessment or invent advice. Checklist answers are not
                  persisted. Nearby facility availability, restoration timing
                  and battery runtime are outside this prototype.
                </p>
                <div className="source-links">
                  <a
                    href="https://open-meteo.com/en/docs"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Weather documentation <ExternalLink size={13} />
                  </a>
                  <a
                    href="https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/power-outage.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Red Cross guidance <ExternalLink size={13} />
                  </a>
                  <a
                    href="https://www.cdc.gov/prepare-your-health/take-action/power-sources.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CDC power checklist <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          <Zap size={18} /> WattWise
        </a>
        <span>Built for readiness. Designed for transparency.</span>
        <span>HOUSTON, TEXAS · EXPERIMENTAL PROTOTYPE</span>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
