import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { MapPin, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

type Props = {
  countyLabel: string;
  supported: boolean;
  lat: number;
  lon: number;
  refLabel: string;
  /** `stage` fills the map-first Area outlook. */
  variant?: "card" | "stage";
};

/** Real OpenStreetMap centered on the disclosed county reference weather point. */
export function CountyMap({
  countyLabel,
  supported,
  lat,
  lon,
  refLabel,
  variant = "card",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!supported || !containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([lat, lon], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const icon = L.divIcon({
      className: "ww-map-marker",
      html: `<span class="ww-map-marker-dot" aria-hidden="true"></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    L.marker([lat, lon], { icon })
      .addTo(map)
      .bindPopup(
        `<strong>${refLabel}</strong><br/>${lat.toFixed(2)}° N · ${Math.abs(lon).toFixed(2)}° W<br/><span style="font-size:12px;color:#5f7270">Open-Meteo forecast point for county guidance — not county-wide weather.</span>`,
      )
      .openPopup();

    L.circle([lat, lon], {
      radius: 12000,
      color: "#E5892E",
      weight: 1.5,
      fillColor: "#E5892E",
      fillOpacity: 0.08,
    }).addTo(map);

    mapRef.current = map;
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [supported, lat, lon, refLabel]);

  useEffect(() => {
    if (!supported || !mapRef.current) return;
    const map = mapRef.current;
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, [supported, lat, lon]);

  const coords = `${lat.toFixed(2)}° N · ${Math.abs(lon).toFixed(2)}° W`;

  return (
    <figure
      className={
        "county-map" + (variant === "stage" ? " county-map-stage" : "")
      }
    >
      <div className="county-map-frame county-map-live">
        {supported ? (
          <>
            <div
              ref={containerRef}
              className="county-map-leaflet"
              role="img"
              aria-label={`OpenStreetMap showing the WattWise reference weather point at ${coords}`}
            />
            <div className="map-callout">
              <Crosshair size={14} aria-hidden />
              <div>
                <strong>{refLabel}</strong>
                <span>{coords}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="county-map-unsupported">
            <p>Outside coverage — no reference map for this county.</p>
          </div>
        )}
      </div>
      {variant === "card" ? (
        <figcaption className="county-map-caption">
          <MapPin size={15} aria-hidden />
          <div>
            <strong>{countyLabel}</strong>
            <p>
              {supported
                ? `Live OpenStreetMap centered on the disclosed ${refLabel.toLowerCase()} used by WattWise. Conditions vary across the county. This is not grid telemetry or a radar product.`
                : "Select a supported county to see coverage scope."}
            </p>
          </div>
        </figcaption>
      ) : null}
    </figure>
  );
}
