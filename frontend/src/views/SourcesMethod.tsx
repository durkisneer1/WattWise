import React, { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { MethodSchema, request, type Method, type Risk } from "../api";
import { formatCentral } from "../lib/time";

type Props = {
  risk: Risk | null;
  status: string | null;
};

export function SourcesMethod({ risk, status }: Props) {
  const [method, setMethod] = useState<Method | null>(null);
  const [methodError, setMethodError] = useState("");

  useEffect(() => {
    let cancelled = false;
    request("/api/method", MethodSchema)
      .then((m) => {
        if (!cancelled) setMethod(m);
      })
      .catch(() => {
        if (!cancelled)
          setMethodError(
            "Could not load method rules from the server. Index rules below match the documented weather-index-v1 contract when the API is reachable.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stack">
      <p className="section-lead">
        This page reflects WattWise’s live weather-index method and the
        provenance of your current assessment when one is loaded. It is not an
        outage probability model.
      </p>

      <div className="grid-2">
        <section className="panel">
          <div className="plan-heading">
            <h3>How the index works</h3>
            <span>{method?.version ?? "weather-index-v1"}</span>
          </div>
          {methodError ? (
            <p className="error" role="status">
              {methodError}
            </p>
          ) : null}
          {method ? (
            <dl className="method-dl">
              <dt>Wind gusts</dt>
              <dd>{method.wind}</dd>
              <dt>Precipitation over 24 hours</dt>
              <dd>{method.rain}</dd>
              <dt>Temperature extremes</dt>
              <dd>{method.temperature}</dd>
              <dt>Index bands</dt>
              <dd>{method.bands}</dd>
              <dt>Scale</dt>
              <dd>0–{method.scale} weather index points</dd>
            </dl>
          ) : !methodError ? (
            <p className="section-lead">Loading method rules…</p>
          ) : (
            <dl className="method-dl">
              <dt>Wind gusts</dt>
              <dd>
                Peak gust: &lt;40 km/h = 0; 40–&lt;60 = 2; 60–&lt;80 = 3; ≥80 =
                4 points.
              </dd>
              <dt>Precipitation over 24 hours</dt>
              <dd>&lt;25 mm = 0; 25–&lt;75 = 2; ≥75 = 3 points.</dd>
              <dt>Temperature extremes</dt>
              <dd>Minimum ≤0 °C or maximum ≥38 °C = 2 points; otherwise 0.</dd>
              <dt>Index bands</dt>
              <dd>
                0–2 lower, 3–5 elevated, 6–9 high weather stress. Project-chosen
                thresholds; not calibrated to outages.
              </dd>
            </dl>
          )}
          <p className="plan-note">
            Probability is always null. Lower weather stress does not rule out
            an outage. No trained outage model is running in this release.
          </p>
        </section>

        <section className="panel">
          <div className="plan-heading">
            <h3>This assessment</h3>
            <span>{status ?? "none loaded"}</span>
          </div>
          {!risk ? (
            <div className="scope-note" style={{ margin: 0 }}>
              <Info size={15} />
              <span>
                Check your area on Area outlook to populate live timestamps,
                sources, evidence, and limitations here.
              </span>
            </div>
          ) : (
            <dl className="method-dl">
              <dt>Coverage</dt>
              <dd>
                {risk.county_name ?? "Outside coverage"}
                {risk.county_fips ? ` · FIPS ${risk.county_fips}` : ""}
              </dd>
              <dt>Geographic unit</dt>
              <dd>{risk.geographic_unit}</dd>
              <dt>Mode</dt>
              <dd>{risk.mode}</dd>
              <dt>Weather reference point</dt>
              <dd>Houston · 29.76, −95.37 (disclosed; not county-wide)</dd>
              <dt>Assessment created</dt>
              <dd>{formatCentral(risk.assessment_created_at)}</dd>
              <dt>Forecast issue time</dt>
              <dd>
                {risk.issued_at
                  ? formatCentral(risk.issued_at)
                  : "Not supplied by the weather endpoint"}
              </dd>
              <dt>Retrieved / expires</dt>
              <dd>
                {formatCentral(risk.fetched_at)} /{" "}
                {formatCentral(risk.expires_at)}
              </dd>
              <dt>Method version</dt>
              <dd>{risk.method_version}</dd>
              <dt>Cached result</dt>
              <dd>{risk.cached ? "Yes" : "No"}</dd>
            </dl>
          )}
          {risk?.evidence?.length ? (
            <div style={{ marginTop: 14 }}>
              <h4 className="subhead">Evidence strings</h4>
              {risk.evidence.map((e) => (
                <p key={e} className="plan-note">
                  {e}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {risk?.limitations?.length ? (
        <section className="panel">
          <h3>Limitations from this response</h3>
          <ul className="plain-list">
            {risk.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <h3>Source links</h3>
        <div className="source-links">
          {(risk?.sources?.length
            ? risk.sources
            : [
                {
                  source_id: "open_meteo",
                  name: "Open-Meteo documentation",
                  url: "https://open-meteo.com/en/docs",
                },
                {
                  source_id: "red_cross",
                  name: "American Red Cross · Power Outage Safety",
                  url: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies/types-of-emergencies/power-outage.html",
                },
                {
                  source_id: "cdc_power",
                  name: "CDC · Power Sources",
                  url: "https://www.cdc.gov/prepare-your-health/take-action/power-sources.html",
                },
              ]
          ).map((s) => (
            <a key={s.source_id} href={s.url} target="_blank" rel="noreferrer">
              {s.name} <ExternalLink size={13} aria-hidden />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
