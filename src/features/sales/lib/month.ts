import { es } from "date-fns/locale";
import { format } from "date-fns";

// Months follow Venezuela time (UTC-4, no daylight saving), whatever the
// server's timezone: a sale at 23:00 on the 31st belongs to that month
const VE_OFFSET_MS = 4 * 60 * 60 * 1000;

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonth(value: string) {
  return MONTH_PATTERN.test(value);
}

// "2026-10" for the month a moment falls in, in Venezuela time
export function monthOf(date: Date) {
  const local = new Date(date.getTime() - VE_OFFSET_MS);
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentMonth() {
  return monthOf(new Date());
}

// "2026-10-20" for the day a moment falls on, in Venezuela time
export function dayOf(date: Date) {
  return new Date(date.getTime() - VE_OFFSET_MS).toISOString().slice(0, 10);
}

// The instant a "YYYY-MM-DD" day starts in Venezuela time
export function dayStart(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date) + VE_OFFSET_MS);
}

// The instants where the month starts and the next one starts
export function monthRange(month: string) {
  const [, year, mon] = month.match(MONTH_PATTERN) ?? [];
  if (!year) throw new Error(`Invalid month: ${month}`);
  const y = Number(year);
  const m = Number(mon) - 1;
  return {
    from: new Date(Date.UTC(y, m, 1) + VE_OFFSET_MS),
    to: new Date(Date.UTC(y, m + 1, 1) + VE_OFFSET_MS),
  };
}

export function shiftMonth(month: string, delta: number) {
  const { from } = monthRange(month);
  const local = new Date(from.getTime() - VE_OFFSET_MS);
  return monthOf(
    new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + delta, 1) +
        VE_OFFSET_MS,
    ),
  );
}

// "Octubre 2026" / "octubre"
export function monthLabel(month: string, withYear = true) {
  const [year, mon] = month.split("-").map(Number);
  const label = format(
    new Date(year, mon - 1, 1),
    withYear ? "MMMM yyyy" : "MMMM",
    {
      locale: es,
    },
  );
  return withYear ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}
