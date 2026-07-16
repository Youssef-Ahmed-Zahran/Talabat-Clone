/**
 * Formats an ISO date string into a short human-readable label,
 * e.g. "Jul 14, 02:35 PM"
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
