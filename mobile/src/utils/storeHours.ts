/**
 * Helper to check if the current time is within a specific open/close window.
 */
function isTimeWithinRange(openTimeStr: string, closeTimeStr: string): boolean {
  const now = new Date();
  const [openH, openM] = openTimeStr.split(':').map(Number);
  const [closeH, closeM] = closeTimeStr.split(':').map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (openMinutes <= closeMinutes) {
    // Same-day range, e.g. 09:00 – 22:00
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  } else {
    // Overnight range, e.g. 22:00 – 02:00
    return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
  }
}

/**
 * Determines if a store is currently open based on its standard and overtime schedules.
 */
export function isStoreOpen(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  overtimeOpenTime?: string | null | undefined,
  overtimeCloseTime?: string | null | undefined,
): boolean {
  // If standard hours are completely missing, consider it open 24/7 (default fallback)
  if (!openTime || !closeTime) return true;

  // Check standard hours
  if (isTimeWithinRange(openTime, closeTime)) return true;

  // If overtime is configured, check it too
  if (overtimeOpenTime && overtimeCloseTime) {
    if (isTimeWithinRange(overtimeOpenTime, overtimeCloseTime)) return true;
  }

  return false;
}

/**
 * Returns a human-readable label for the store's hours.
 */
export function storeHoursLabel(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  overtimeOpenTime?: string | null | undefined,
  overtimeCloseTime?: string | null | undefined,
): string | null {
  if (!openTime || !closeTime) return null;
  const open = isStoreOpen(openTime, closeTime, overtimeOpenTime, overtimeCloseTime);
  
  if (open) {
    return `Open · Closes ${closeTime}`; // Could be improved to show which session it's in, but standard is fine
  } else {
    const nextOpen = overtimeOpenTime || openTime;
    return `Closed · Opens ${nextOpen}`;
  }
}
