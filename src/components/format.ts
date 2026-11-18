/**
 * Shared date, time and number formatting for UI components.
 *
 * Everything is pinned to one locale and to the game clock (HKT), so the
 * server render and the browser hydrate to the same text whatever the
 * visitor's locale or time zone is.
 */

export const GAME_LOCALE = "en-US";
export const GAME_TIME_ZONE = "Asia/Hong_Kong";

type DateInput = Date | string | number;

function buildFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(GAME_LOCALE, { ...options, timeZone: GAME_TIME_ZONE });
}

const FORMATTERS = {
  date: buildFormatter({ year: "numeric", month: "numeric", day: "numeric" }),
  shortDate: buildFormatter({ month: "short", day: "numeric" }),
  time: buildFormatter({ hour: "2-digit", minute: "2-digit" }),
  shortDateTime: buildFormatter({ month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
} as const;

export type GameDateStyle = keyof typeof FORMATTERS;

function format(value: DateInput, style: GameDateStyle): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return FORMATTERS[style].format(date);
}

/** "11/18/2026" */
export function formatGameDate(value: DateInput): string {
  return format(value, "date");
}

/** "Nov 18" */
export function formatGameShortDate(value: DateInput): string {
  return format(value, "shortDate");
}

/** "09:41 PM" */
export function formatGameTime(value: DateInput): string {
  return format(value, "time");
}

/** "Nov 18, 09:41 PM" */
export function formatGameDateTime(value: DateInput): string {
  return format(value, "shortDateTime");
}
