/** Display helpers — API weather stays metric; convert only at the edge. */

export function kmhToMph(kmh: number) {
  return kmh * 0.621371;
}

export function cToF(c: number) {
  return (c * 9) / 5 + 32;
}

export function formatMph(kmh: number, digits = 0) {
  return kmhToMph(kmh).toFixed(digits);
}

export function formatF(c: number, digits = 0) {
  return cToF(c).toFixed(digits);
}

/** Rewrite known metric evidence phrases for resident-facing mph / °F. */
export function displayEvidence(text: string) {
  return text
    .replace(/Peak gust ([\d.]+) km\/h/g, (_m, kmh: string) => {
      return `Peak gust ${formatMph(Number(kmh))} mph`;
    })
    .replace(
      /Temperature range ([\d.]+)[–-]([\d.]+) °C/g,
      (_m, minC: string, maxC: string) => {
        return `Temperature range ${formatF(Number(minC))}–${formatF(Number(maxC))} °F`;
      },
    );
}
