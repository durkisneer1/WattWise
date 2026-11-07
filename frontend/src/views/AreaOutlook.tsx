import React, { useState } from "react";
import {
  ArrowRight,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  Info,
  Radio,
} from "lucide-react";
import type { Risk } from "../api";
import { CountyMap } from "../components/CountyMap";
import { WeatherTimeline } from "../components/WeatherTimeline";
import {
  COUNTIES,
  HORIZONS,
  coverageFor,
  type HorizonId,
} from "../lib/coverage";
import {
  centerpointOutageUrl,
  freshnessCue,
  indexCue,
  indexDrivers,
} from "../lib/motivators";
import { formatCentral } from "../lib/time";

type Props = {
  county: string;
  onCountyChange: (countyFips: string) => void;
  risk: Risk | null;
  status: string | null;
  now: number;
  busy: boolean;
  error: string;
  onAssess: () => void;
  onGoPrepare: () => void;
};

function formatDayLabel(date: string) {
  const parsed = Date.parse(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed)) return date;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function AreaOutlook({
  county,
  onCountyChange,
  risk,
  status,
  now,
  busy,
  error,
  onAssess,
  onGoPrepare,
}: Props) {
  const [horizon, setHorizon] = useState<HorizonId>("24h");
  const selected = coverageFor(county);
  const supported = Boolean(risk && status !== "unsupported");
  const current = status === "current";
  const cue = risk ? freshnessCue(risk, status, now) : null;
  const points = current
    ? indexCue(risk?.index_value ?? null, risk?.index_scale ?? null)
    : null;
  const drivers = current
    ? indexDrivers(risk?.weather_features ?? null)
    : null;
  const showMap = Boolean(selected);
  const mapLat = selected?.lat ?? 29.76;
  const mapLon = selected?.lon ?? -95.37;
  const mapRef = selected?.refLabel ?? "Reference weather point";
  const countyLabel =
    risk?.county_name ??
    selected?.name ??
    "County outside WattWise coverage";

  return (
    <div className="area-stage">
      <section className="map-stage" aria-label="Area assessment">
        <div className="map-stage-canvas">
          <CountyMap
            countyLabel={countyLabel}
            supported={showMap}
            lat={mapLat}
            lon={mapLon}
            refLabel={mapRef}
            variant="stage"
          />
        </div>

        <div className="map-stage-overlay">
          <div className="assess-dock panel">
            <p className="dock-kicker">Where are you checking?</p>
            <label className="sr-only" htmlFor="county">
              County
            </label>
            <div className="assess-controls">
              <div className="location-row tight">
                <MapPin size={16} aria-hidden />
                <select
                  id="county"
                  value={county}
                  onChange={(e) => onCountyChange(e.target.value)}
                >
                  {COUNTIES.map((c) => (
                    <option key={c.fips} value={c.fips}>
                      {c.name.replace(", Texas", "")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="primary primary-accent assess-go"
                onClick={onAssess}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <RefreshCw size={15} className="spin" /> Checking…
                  </>
                ) : (
                  <>
                    Check area <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
            <p className="location-note">
              County guidance · disclosed map reference · not the power grid
            </p>

            <div
              className="horizon-tabs"
              role="tablist"
              aria-label="Forecast horizon"
            >
              {HORIZONS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  role="tab"
                  aria-selected={horizon === h.id}
                  className={
                    "horizon-tab" + (horizon === h.id ? " active" : "")
                  }
                  onClick={() => setHorizon(h.id)}
                >
                  {h.id === "24h" ? "24 hours" : "7 days"}
                </button>
              ))}
            </div>
            <p className="horizon-detail">
              {HORIZONS.find((h) => h.id === horizon)?.detail}
            </p>

            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          {!risk ? (
            <div className="hero-card panel hero-card-empty">
              <span className="empty-icon">
                <Radio size={18} />
              </span>
              <div>
                <h2>
                  {busy
                    ? "Reading the latest forecast…"
                    : "Your area, then your plan."}
                </h2>
                <p>
                  {busy
                    ? `Pulling Open-Meteo for the ${selected?.placeHint ?? "selected"} point.`
                    : "Choose a county, then Check area for a live weather-stress index."}
                </p>
              </div>
            </div>
          ) : (
            <article
              className={
                "hero-card risk-card float-card " +
                (current ? risk.risk_band : "unknown")
              }
            >
              <div className="risk-top">
                <span>
                  {risk.county_name ?? "Outside supported coverage"}
                </span>
                <span className="status-chip">
                  <span className="dot" />
                  {status === "current"
                    ? risk.cached
                      ? "Cached"
                      : "Live"
                    : status}
                </span>
              </div>
              <div className="risk-label">
                {current
                  ? horizon === "7d"
                    ? "7-day outlook · 24h index still applies"
                    : "Experimental weather index"
                  : "Assessment status"}
              </div>
              <h2>
                {status === "stale"
                  ? "This forecast needs a refresh."
                  : risk.display_label}
              </h2>
              {current ? (
                <>
                  <div className="score">
                    <strong>{risk.index_value}</strong>
                    <span>
                      / {risk.index_scale}
                      <small>stress points</small>
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
                  {points ? <p className="motivator-line">{points}</p> : null}
                  {drivers ? (
                    <ul
                      className="driver-chips"
                      aria-label="What drives this index"
                    >
                      {drivers.map((d) => (
                        <li
                          key={d.id}
                          className={
                            "driver-chip" + (d.points > 0 ? " active" : "")
                          }
                        >
                          <span className="driver-chip-top">
                            <b>{d.label}</b>
                            <em>
                              +{d.points}/{d.maxPoints}
                            </em>
                          </span>
                          <span>{d.detail}</span>
                          <i
                            className="driver-meter"
                            aria-hidden
                            style={{
                              ["--driver-pct" as string]: `${(d.points / d.maxPoints) * 100}%`,
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="risk-blurb">
                    {horizon === "7d"
                      ? "Index stays 24h-only. The strip below is unscored daily weather — not a weekly outage score."
                      : `Not an outage probability. Stress band: ${risk.risk_band}.`}
                  </p>
                </>
              ) : (
                <p className="risk-blurb">
                  {status === "unsupported"
                    ? "That county code is outside WattWise coverage."
                    : status === "stale"
                      ? "Too old to use — refresh for a current assessment."
                      : "No complete forecast — missing data is not shown as zero stress."}
                </p>
              )}
              {cue ? (
                <p
                  className={
                    "motivator-cue" +
                    (status === "stale" ? " motivator-urgent" : "")
                  }
                >
                  {cue}
                </p>
              ) : null}
              <div className="forecast-window">
                <span>
                  {horizon === "7d"
                    ? "Scored window still 24h · Central Time"
                    : "24h window · Central Time"}
                </span>
                <b>
                  {formatCentral(risk.valid_from)}
                  {risk.valid_to ? (
                    <> → {formatCentral(risk.valid_to)}</>
                  ) : null}
                </b>
              </div>
              <div className="dock-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={onAssess}
                  disabled={busy}
                >
                  <RefreshCw size={15} className={busy ? "spin" : ""} />{" "}
                  Refresh
                </button>
                {current ? (
                  <button
                    type="button"
                    className="primary primary-accent"
                    onClick={onGoPrepare}
                  >
                    Build preparation plan
                  </button>
                ) : null}
              </div>
            </article>
          )}
        </div>
      </section>

      {risk ? (
        <section className="insight-rail">
          <div className="metric-strip">
            {[
              {
                icon: <Wind />,
                label: horizon === "7d" ? "24h peak gust" : "Peak gust",
                value: current ? risk.weather_features?.max_gust_kmh : null,
                unit: "km/h",
              },
              {
                icon: <Droplets />,
                label: horizon === "7d" ? "24h precip" : "Precipitation",
                value: current
                  ? risk.weather_features?.precipitation_mm
                  : null,
                unit: "mm",
              },
              {
                icon: <Thermometer />,
                label: horizon === "7d" ? "24h high temp" : "High temp",
                value: current
                  ? risk.weather_features?.max_temperature_c
                  : null,
                unit: "°C",
              },
            ].map((m) => (
              <div className="metric-tile" key={m.label}>
                {m.icon}
                <div>
                  <span>{m.label}</span>
                  <strong>
                    {m.value != null ? m.value.toFixed(1) : "—"}{" "}
                    <small>{m.unit}</small>
                  </strong>
                </div>
              </div>
            ))}
            <div className="metric-tile source-tile">
              <Info size={18} />
              <div>
                <span>Provenance</span>
                <strong>
                  Open-Meteo · {formatCentral(risk.fetched_at)}
                </strong>
              </div>
            </div>
          </div>

          <div className="panel utility-panel">
            <div className="plan-heading">
              <h3>Utility context</h3>
              <span>CenterPoint · not WattWise</span>
            </div>
            <p>
              Weather stress is not the grid. Open the utility outage map near
              this reference point — restoration notes stay on CenterPoint’s
              site.
            </p>
            <a
              className="primary"
              href={centerpointOutageUrl(mapLat, mapLon)}
              target="_blank"
              rel="noreferrer"
            >
              Open CenterPoint outage map
            </a>
          </div>

          {horizon === "24h" ? (
            <div className="panel timeline-panel">
              <div className="plan-heading">
                <h3>Next 24 hours</h3>
                <span>Gust line · rain bars</span>
              </div>
              {current && risk.hourly.length > 0 ? (
                <WeatherTimeline
                  hourly={risk.hourly}
                  validFrom={risk.valid_from}
                />
              ) : (
                <div className="no-weather">
                  <Info size={18} />
                  <p>
                    {status === "stale"
                      ? "Old weather values stay hidden until you refresh."
                      : "Hourly inputs appear after a supported forecast loads."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="panel timeline-panel">
              <div className="plan-heading">
                <h3>Next 7 days</h3>
                <span>Unscored daily outlook · index above stays 24h</span>
              </div>
              {current && risk.daily_outlook.length > 0 ? (
                <div className="daily-strip" role="list">
                  {risk.daily_outlook.map((day) => (
                    <article
                      key={day.date}
                      className="daily-card"
                      role="listitem"
                    >
                      <strong>{formatDayLabel(day.date)}</strong>
                      <span>
                        Gust {day.max_gust_kmh.toFixed(0)} km/h
                      </span>
                      <span>
                        Rain {day.precipitation_mm.toFixed(1)} mm
                      </span>
                      <span>
                        {day.min_temperature_c.toFixed(0)}–
                        {day.max_temperature_c.toFixed(0)} °C
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="no-weather">
                  <Info size={18} />
                  <p>
                    {status === "stale"
                      ? "Refresh for a current daily outlook strip."
                      : "Daily outlook appears after a supported forecast loads."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
