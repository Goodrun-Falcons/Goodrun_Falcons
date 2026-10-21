/** "350 m" under a kilometre (to the nearest 10 m), "4.2 km" above. */
export function formatDistance(meters: number): string {
  const rounded = Math.round(meters / 10) * 10;
  // Checked after rounding, so 995 m reads "1.0 km" rather than "1000 m".
  if (rounded < 1000) return `${rounded} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** "~4 min", or "~1 h 5 min" past the hour. Never "~0 min". */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `~${minutes} min`;
  const rest = minutes % 60;
  return `~${Math.floor(minutes / 60)} h${rest ? ` ${rest} min` : ''}`;
}
