// ── Late Night Surcharge Helper ──────────────────────────────────────────────
// Returns true if time string (HH:MM) is between 12:00 AM and 5:00 AM (exclusive)
export const isLateNightTime = (timeStr) => {
  if (!timeStr) return false;
  const [hourStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  // 00:00 → 04:59 inclusive = late night (12AM to before 5AM)
  return hour >= 0 && hour < 5;
};

export const LATE_NIGHT_SURCHARGE = 500;

// ── Travel Date Restriction Helper ──────────────────────────────────────────
// Returns true if the given date string (YYYY-MM-DD) is today or tomorrow
export const isTodayOrTomorrow = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const selected = new Date(dateStr + 'T00:00:00');
  return selected.getTime() === today.getTime() || selected.getTime() === tomorrow.getTime();
};

export const BASE_URL = '';
