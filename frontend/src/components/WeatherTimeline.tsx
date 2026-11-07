import React, { useState } from "react";
import { formatCentral, formatCentralHour } from "../lib/time";
import { formatF, formatMph, kmhToMph } from "../lib/units";

type Hour = {
  time: string;
  gust_kmh: number;
  precipitation_mm: number;
  temperature_c: number;
};

type Props = {
  hourly: Hour[];
  validFrom: string | null;
};

export function WeatherTimeline({ hourly, validFrom }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  if (hourly.length === 0) return null;

  const gustMph = hourly.map((h) => kmhToMph(h.gust_kmh));
  const maxGust = Math.max(25, ...gustMph);
  const maxRain = Math.max(1, ...hourly.map((h) => h.precipitation_mm));
  const width = 600;
  const height = 120;
  const pad = 8;
  const last = Math.max(1, hourly.length - 1);
  const step = width / last;

  const gustPath = gustMph
    .map((mph, i) => {
      const x = i * step;
      const y = height - pad - (mph / maxGust) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  function indexFromPointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const x = ((e.clientX - rect.left) / rect.width) * width;
    return Math.max(0, Math.min(last, Math.round(x / step)));
  }

  const active = hover != null ? hourly[hover] : null;
  const activeX = hover != null ? hover * step : 0;
  const activeGustY =
    hover != null
      ? height - pad - (gustMph[hover] / maxGust) * (height - pad * 2)
      : 0;
  const edge =
    hover == null ? null : hover <= 2 ? "start" : hover >= last - 2 ? "end" : "mid";

  return (
    <div className="weather-timeline">
      <div className="timeline-legend">
        <span className="legend-gust">Wind gust (mph)</span>
        <span className="legend-rain">Rain bars (mm)</span>
        <span>Central Time · hover for hour</span>
      </div>
      <div className="timeline-chart">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Hourly wind gust line and precipitation bars for the forecast window. Hover or focus to read each hour."
          onPointerMove={(e) => setHover(indexFromPointer(e))}
          onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => setHover(indexFromPointer(e))}
        >
          <rect
            className="timeline-hit"
            x="0"
            y="0"
            width={width}
            height={height}
            fill="transparent"
          />
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1="0"
              x2={width}
              y1={height - pad - f * (height - pad * 2)}
              y2={height - pad - f * (height - pad * 2)}
              className="timeline-grid"
            />
          ))}
          {hourly.map((h, i) => {
            const barH =
              (h.precipitation_mm / maxRain) * (height - pad * 2) * 0.45;
            const x = i * step;
            return (
              <rect
                key={h.time + "-rain"}
                className={
                  "rain-bar" + (hover === i ? " rain-bar-active" : "")
                }
                x={x - 4}
                y={height - pad - barH}
                width="8"
                height={Math.max(0, barH)}
                rx="1"
              />
            );
          })}
          <path className="gust-line" d={gustPath} fill="none" />
          {gustMph.map((mph, i) => {
            if (i % 4 !== 0 && i !== last && hover !== i) return null;
            const y = height - pad - (mph / maxGust) * (height - pad * 2);
            return (
              <circle
                key={hourly[i].time + "-pt"}
                className={
                  "gust-point" + (hover === i ? " gust-point-active" : "")
                }
                cx={i * step}
                cy={y}
                r={hover === i ? 4.5 : 3}
              />
            );
          })}
          {hover != null ? (
            <line
              className="timeline-crosshair"
              x1={activeX}
              x2={activeX}
              y1={pad / 2}
              y2={height - pad / 2}
            />
          ) : null}
          {hover != null ? (
            <circle
              className="gust-point gust-point-active"
              cx={activeX}
              cy={activeGustY}
              r="4.5"
            />
          ) : null}
        </svg>
        {active && hover != null ? (
          <div
            className="timeline-tooltip"
            data-edge={edge ?? "mid"}
            style={{ left: `${(hover / last) * 100}%` }}
            role="status"
          >
            <strong>{formatCentralHour(active.time)}</strong>
            <span className="tip-gust">
              Gust {formatMph(active.gust_kmh)} mph
            </span>
            <span className="tip-rain">
              Rain {active.precipitation_mm.toFixed(1)} mm
            </span>
            <span>Temp {formatF(active.temperature_c)} °F</span>
          </div>
        ) : null}
      </div>
      <div className="timeline-axis">
        <span>
          {validFrom
            ? formatCentral(validFrom)
            : formatCentralHour(hourly[0].time)}
        </span>
        <span>+24 hours</span>
      </div>
      <details className="timeline-table">
        <summary>View hourly values</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Central time</th>
                <th>Gust mph</th>
                <th>Rain mm</th>
                <th>Temp °F</th>
              </tr>
            </thead>
            <tbody>
              {hourly.map((h) => (
                <tr key={h.time}>
                  <td>{formatCentral(h.time)}</td>
                  <td>{formatMph(h.gust_kmh)}</td>
                  <td>{h.precipitation_mm}</td>
                  <td>{formatF(h.temperature_c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
