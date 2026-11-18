/**
 * Game-day helpers. Every "daily" mechanic rolls over at midnight Hong Kong
 * time (UTC+8, no DST), regardless of the server's own timezone.
 */

const HKT_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole HKT days since the Unix epoch. Consecutive calendar days differ by 1. */
export function hktDayNumber(date: Date): number {
  return Math.floor((date.getTime() + HKT_OFFSET_MS) / DAY_MS);
}

export function isSameHktDay(a: Date, b: Date): boolean {
  return hktDayNumber(a) === hktDayNumber(b);
}

/** The instant the HKT day containing `date` began. */
export function hktDayStart(date: Date): Date {
  return new Date(hktDayNumber(date) * DAY_MS - HKT_OFFSET_MS);
}

/** "YYYY-MM" of the HKT calendar month containing `date`. */
export function hktYearMonth(date: Date): string {
  const shifted = new Date(date.getTime() + HKT_OFFSET_MS);
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${month}`;
}
