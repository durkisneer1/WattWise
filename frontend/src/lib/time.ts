export function formatCentral(s: string | null) {
  return s
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(s))
    : "Not supplied";
}

export function formatCentralHour(s: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(s));
}
