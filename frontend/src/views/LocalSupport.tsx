import React, { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Info,
  LifeBuoy,
  MapPin,
  Navigation,
  Phone,
  PlugZap,
  Search,
  ShieldAlert,
  Crosshair,
} from "lucide-react";
import { COUNTIES, coverageFor } from "../lib/coverage";
import {
  buildSupportLinks,
  defaultAnchorForCounty,
  lookupPlace,
  type SupportAnchor,
  type SupportLink,
} from "../lib/localSupport";

type Props = {
  county: string;
  onCountyChange: (fips: string) => void;
};

function kindIcon(kind: SupportLink["kind"]) {
  switch (kind) {
    case "call":
      return <Phone size={16} aria-hidden />;
    case "outage":
      return <PlugZap size={16} aria-hidden />;
    case "search":
      return <Search size={16} aria-hidden />;
    case "agency":
      return <ShieldAlert size={16} aria-hidden />;
    case "directory":
      return <LifeBuoy size={16} aria-hidden />;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function Section({
  title,
  blurb,
  links,
}: {
  title: string;
  blurb: string;
  links: SupportLink[];
}) {
  if (links.length === 0) return null;
  return (
    <section className="support-section">
      <div className="support-section-head">
        <h3>{title}</h3>
        <p>{blurb}</p>
      </div>
      <ul className="support-list">
        {links.map((link) => (
          <li key={link.id} className="support-card">
            <span className="support-icon">{kindIcon(link.kind)}</span>
            <div>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.name} <ExternalLink size={13} aria-hidden />
              </a>
              <p>{link.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LocalSupport({ county, onCountyChange }: Props) {
  const selected = coverageFor(county);
  const [anchor, setAnchor] = useState<SupportAnchor | null>(() =>
    defaultAnchorForCounty(county),
  );
  const [placeQuery, setPlaceQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setAnchor(defaultAnchorForCounty(county));
    setNote("");
  }, [county]);

  const packs = useMemo(
    () => (anchor ? buildSupportLinks(county, anchor) : null),
    [county, anchor],
  );

  async function applyPlace(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const hit = await lookupPlace(placeQuery);
      if (!hit) {
        setNote(
          "No Texas match found for that place. Try a city or ZIP, or use the county reference point.",
        );
        return;
      }
      setAnchor(hit);
      setNote(`Focus updated to ${hit.label}. Search links now use that point.`);
    } catch {
      setNote("Place lookup failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setNote("This browser cannot share a device location.");
      return;
    }
    setGeoBusy(true);
    setNote("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAnchor({
          label: "Your device location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "device",
        });
        setNote(
          "Focus set from your device. WattWise still does not verify facility open status.",
        );
        setGeoBusy(false);
      },
      () => {
        setNote(
          "Location permission was denied or unavailable. Use county focus or a city/ZIP instead.",
        );
        setGeoBusy(false);
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
    );
  }

  function resetToCounty() {
    setAnchor(defaultAnchorForCounty(county));
    setPlaceQuery("");
    setNote("Back to the disclosed county reference weather point.");
  }

  return (
    <div className="support-layout">
      <header className="support-intro">
        <div>
          <p className="eyebrow">Local support</p>
          <h2>Help near where you are</h2>
          <p>
            Pick your county, optionally refine with a city, ZIP, or device
            location, then open the scoped directories and map searches below.
            WattWise does not invent open shelters or restoration times.
          </p>
        </div>
      </header>

      <section className="support-locator panel">
        <div className="support-locator-head">
          <MapPin size={18} aria-hidden />
          <div>
            <h3>Your focus area</h3>
            <p>Drives which county agencies and nearby searches appear first.</p>
          </div>
        </div>

        <div className="support-locator-grid">
          <label className="support-field">
            <span>County</span>
            <select
              value={county}
              onChange={(e) => onCountyChange(e.target.value)}
            >
              {COUNTIES.map((c) => (
                <option key={c.fips} value={c.fips}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <form className="support-place-form" onSubmit={applyPlace}>
            <label className="support-field">
              <span>City or ZIP (optional)</span>
              <input
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="e.g. Sugar Land, 77304, Manvel"
                autoComplete="postal-code"
              />
            </label>
            <button type="submit" className="primary" disabled={busy}>
              {busy ? "Looking up…" : "Set focus"}
            </button>
          </form>
        </div>

        <div className="support-locator-actions">
          <button
            type="button"
            className="primary primary-accent"
            onClick={useDeviceLocation}
            disabled={geoBusy}
          >
            <Navigation size={15} aria-hidden />
            {geoBusy ? "Locating…" : "Use my location"}
          </button>
          <button type="button" className="text-button" onClick={resetToCounty}>
            <Crosshair size={15} aria-hidden />
            Reset to county reference
          </button>
        </div>

        {anchor ? (
          <div className="support-focus-chip">
            <Crosshair size={14} aria-hidden />
            <div>
              <strong>{anchor.label}</strong>
              <span>
                {anchor.lat.toFixed(4)}° N · {Math.abs(anchor.lon).toFixed(4)}°
                W
                {anchor.source === "county_ref"
                  ? " · county weather reference"
                  : anchor.source === "device"
                    ? " · device location"
                    : " · place lookup"}
              </span>
            </div>
          </div>
        ) : null}

        {note ? <p className="support-note">{note}</p> : null}
      </section>

      <div className="panel panel-muted scope-note" style={{ margin: 0 }}>
        <Info size={16} aria-hidden />
        <span>
          Listings and map searches are starting points. WattWise does not
          verify that a facility is open, has power, has capacity, is
          accessible, or is safe to travel to. Confirm on the official page or
          by phone before you go.
        </span>
      </div>

      {packs && selected ? (
        <>
          <Section
            title="Need help now"
            blurb={`Immediate and county-routed help for ${selected.name}.`}
            links={packs.urgent}
          />
          <Section
            title="Power & outages"
            blurb="Utility tools for Greater Houston electric service — not a WattWise restoration ETA."
            links={packs.power}
          />
          <Section
            title="Nearby map searches"
            blurb={`Pre-centered on ${anchor?.label ?? "your focus"}. These open search results, not a curated open/closed inventory.`}
            links={packs.nearby}
          />
          <Section
            title={`${selected.name.replace(", Texas", "")} agencies`}
            blurb="Official emergency-management pages for the county you selected."
            links={packs.agencies}
          />
        </>
      ) : (
        <div className="plan-empty">
          <LifeBuoy size={28} />
          <h3>Select a supported county</h3>
          <p>Local support packs cover Harris, Fort Bend, Montgomery, and Brazoria.</p>
        </div>
      )}
    </div>
  );
}
