import React from "react";
import { formatCentral, formatCentralHour } from "../lib/time";

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
  if (hourly.length === 0) return null;

  const maxGust = Math.max(40, ...hourly.map((h) => h.gust_kmh));
  const maxRain = Math.max(1, ...hourly.map((h) => h.precipitation_mm));
  const width = 600;
  const height = 120;
  const pad = 8;
  const step = width / Math.max(1, hourly.length - 1);

  const gustPath = hourly
    .map((h, i) => {
      const x = i * step;
      const y = height - pad - (h.gust_kmh / maxGust) * (height - pad * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="weather-timeline">
      <div className="timeline-legend">
        <span className="legend-gust">Wind gust (km/h)</span>
        <span className="legend-rain">Rain bars (mm)</span>
        <span>Central Time</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Hourly wind gust line and precipitation bars for the forecast window"
      >
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
          const barH = (h.precipitation_mm / maxRain) * (height - pad * 2) * 0.45;
          const x = i * step;
          return (
            <rect
              key={h.time + "-rain"}
              className="rain-bar"
              x={x - 4}
              y={height - pad - barH}
              width="8"
              height={Math.max(0, barH)}
              rx="1"
            />
          );
        })}
        <path className="gust-line" d={gustPath} fill="none" />
        {hourly.map((h, i) => {
          if (i % 4 !== 0 && i !== hourly.length - 1) return null;
          const y =
            height - pad - (h.gust_kmh / maxGust) * (height - pad * 2);
          return (
            <circle
              key={h.time + "-pt"}
              className="gust-point"
              cx={i * step}
              cy={y}
              r="3"
            />
          );
        })}
      </svg>
      <div className="timeline-axis">
        <span>{validFrom ? formatCentral(validFrom) : formatCentralHour(hourly[0].time)}</span>
        <span>+24 hours</span>
      </div>
      <details className="timeline-table">
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
              {hourly.map((h) => (
                <tr key={h.time}>
                  <td>{formatCentral(h.time)}</td>
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
  );
}
