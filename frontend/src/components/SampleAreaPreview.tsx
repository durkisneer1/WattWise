import React, { useState } from "react";
import {
  AlertTriangle,
  Droplets,
  Info,
  Thermometer,
  Wind,
} from "lucide-react";
import { CountyMap } from "./CountyMap";
import { WeatherTimeline } from "./WeatherTimeline";
import { HORIZONS, type HorizonId } from "../lib/coverage";
import {
  centerpointOutageUrl,
  indexCue,
  indexDrivers,
} from "../lib/motivators";
import type { SampleWeather } from "../lib/studioSamples";

type Props = {
  sample: SampleWeather;
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

/** Full Area-outlook chrome fed only by labeled Studio samples — never live API. */
export function SampleAreaPreview({ sample, onGoPrepare }: Props) {
  const [horizon, setHorizon] = useState<HorizonId>("24h");
  const features = {
    max_gust_kmh: sample.maxGustKmh,
    precipitation_mm: sample.precipitationMm,
    min_temperature_c: sample.minTemperatureC,
    max_temperature_c: sample.maxTemperatureC,
  };
  const drivers = indexDrivers(features);
  const points = indexCue(sample.indexValue, 9);

  return (
    <div className="area-stage sample-area-stage" aria-label="Sample Area outlook">
      <div className="sample-area-banner" role="status">
        <AlertTriangle size={16} aria-hidden />
        <div>
          <strong>Presentation mode · offline sample</strong>
          <span>
            Labeled illustration only. This never replaces a missing live
            forecast.
          </span>
        </div>
      </div>

      <section className="map-stage" aria-label="Sample area assessment">
        <div className="map-stage-canvas">
          <CountyMap
            countyLabel={sample.countyLabel}
            supported
            lat={sample.lat}
            lon={sample.lon}
            refLabel={sample.refLabel}
            variant="stage"
          />
        </div>

        <div className="map-stage-overlay">
          <div className="assess-dock panel">
            <p className="dock-kicker">Offline sample scenario</p>
            <div
              className="horizon-tabs"
              role="tablist"
              aria-label="Sample forecast horizon"
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
          </div>

          <article
            className={"hero-card risk-card float-card " + sample.band}
          >
            <div className="risk-top">
              <span>{sample.countyLabel}</span>
              <span className="status-chip">
                <span className="dot" />
                presentation only
              </span>
            </div>
            <div className="risk-label">
              {horizon === "7d"
                ? "7-day outlook · 24h index still applies"
                : "Illustrative weather index"}
            </div>
            <h2>{sample.displayLabel}</h2>
            <div className="score">
              <strong>{sample.indexValue}</strong>
              <span>
                / 9<small>sample points</small>
              </span>
              <div
                className="index-bars"
                aria-label={`${sample.indexValue} of 9 sample weather index points`}
              >
                {Array.from({ length: 9 }, (_, i) => (
                  <i
                    key={i}
                    className={i < sample.indexValue ? "filled" : ""}
                  />
                ))}
              </div>
            </div>
            {points ? <p className="motivator-line">{points}</p> : null}
            {drivers ? (
              <ul
                key={sample.id}
                className="driver-chips driver-chips-play"
                aria-label="What drives this sample index"
              >
                {drivers.map((d, i) => (
                  <li
                    key={d.id}
                    className={
                      "driver-chip" + (d.points > 0 ? " active" : "")
                    }
                    style={{
                      ["--driver-delay" as string]: `${i * 90}ms`,
                      ["--driver-pct" as string]: `${(d.points / d.maxPoints) * 100}%`,
                    }}
                  >
                    <span className="driver-chip-top">
                      <b>{d.label}</b>
                      <em>
                        +{d.points}/{d.maxPoints}
                      </em>
                    </span>
                    <span>{d.detail}</span>
                    <i className="driver-meter" aria-hidden />
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="risk-blurb">
              {horizon === "7d"
                ? "Index stays 24h-only. The strip below is unscored daily weather — not a weekly outage score."
                : sample.story}
            </p>
            <div className="forecast-window">
              <span>
                {horizon === "7d"
                  ? "Sample scored window still 24h · Central Time"
                  : "Sample 24h window · Central Time"}
              </span>
              <b>Offline illustration · not a live fetch</b>
            </div>
            <div className="dock-actions">
              <button
                type="button"
                className="primary primary-accent"
                onClick={onGoPrepare}
              >
                Build preparation plan
              </button>
            </div>
          </article>
        </div>
      </section>

      <section className="insight-rail">
        <div className="metric-strip">
          {[
            {
              icon: <Wind />,
              label: horizon === "7d" ? "24h peak gust" : "Peak gust",
              value: sample.maxGustKmh,
              unit: "km/h",
            },
            {
              icon: <Droplets />,
              label: horizon === "7d" ? "24h precip" : "Precipitation",
              value: sample.precipitationMm,
              unit: "mm",
            },
            {
              icon: <Thermometer />,
              label: horizon === "7d" ? "24h high temp" : "High temp",
              value: sample.maxTemperatureC,
              unit: "°C",
            },
          ].map((m) => (
            <div className="metric-tile" key={m.label}>
              {m.icon}
              <div>
                <span>{m.label}</span>
                <strong>
                  {m.value.toFixed(1)} <small>{m.unit}</small>
                </strong>
              </div>
            </div>
          ))}
          <div className="metric-tile source-tile">
            <Info size={18} />
            <div>
              <span>Provenance</span>
              <strong>Studio sample · not Open-Meteo live</strong>
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
            this sample reference point — restoration notes stay on
            CenterPoint’s site.
          </p>
          <a
            className="primary"
            href={centerpointOutageUrl(sample.lat, sample.lon)}
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
              <span>Sample gust line · rain bars</span>
            </div>
            <WeatherTimeline
              hourly={sample.hourly}
              validFrom={sample.hourly[0]?.time ?? SAMPLE_FALLBACK}
            />
          </div>
        ) : (
          <div className="panel timeline-panel">
            <div className="plan-heading">
              <h3>Next 7 days</h3>
              <span>Unscored daily outlook · index above stays 24h</span>
            </div>
            <div className="daily-strip" role="list">
              {sample.daily.map((day) => (
                <article key={day.date} className="daily-card" role="listitem">
                  <strong>{formatDayLabel(day.date)}</strong>
                  <span>Gust {day.max_gust_kmh.toFixed(0)} km/h</span>
                  <span>Rain {day.precipitation_mm.toFixed(1)} mm</span>
                  <span>
                    {day.min_temperature_c.toFixed(0)}–
                    {day.max_temperature_c.toFixed(0)} °C
                  </span>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const SAMPLE_FALLBACK = "2026-11-07T18:00:00.000Z";
