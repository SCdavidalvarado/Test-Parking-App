import type { ServiceSlot } from "@/types/database.types";

export type { ServiceSlot };

/** One Sunday + one service time. `date` is always a Sunday, as YYYY-MM-DD. */
export interface Selection {
  date: string;
  slot: ServiceSlot;
}

export const SERVICE_SLOTS: { id: ServiceSlot; label: string }[] = [
  { id: "8:00", label: "8:00 AM" },
  { id: "9:30", label: "9:30 AM" },
  { id: "11:30", label: "11:30 AM" },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

/** Date math on YYYY-MM-DD strings (done in UTC so time zones can't shift the day). */
export function addDays(date: string, days: number): string {
  const { y, m, d } = parts(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  const mm = String(t.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(t.getUTCDate()).padStart(2, "0");
  return `${t.getUTCFullYear()}-${mm}-${dd}`;
}

export function dayOfWeek(date: string): number {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function formatShort(date: string): string {
  const { m, d } = parts(date);
  return `Sun, ${MONTHS_SHORT[m - 1]} ${d}`;
}

export function formatLong(date: string): string {
  const { m, d } = parts(date);
  return `${MONTHS_LONG[m - 1]} ${d}`;
}

export function slotLabel(slot: ServiceSlot): string {
  return SERVICE_SLOTS.find((s) => s.id === slot)?.label ?? slot;
}

export function selectionKey(s: Selection): string {
  return `${s.date}|${s.slot}`;
}

export function isValidSelection(x: unknown): x is Selection {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(o.date) &&
    (o.slot === "8:00" || o.slot === "9:30" || o.slot === "11:30")
  );
}

export interface DallasNow {
  date: string; // YYYY-MM-DD in Dallas time
  minutes: number; // minutes since midnight in Dallas time
}

/** The current date and time in Dallas, no matter where the viewer is. */
export function getDallasNow(now: Date = new Date()): DallasNow {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) p[part.type] = part.value;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    minutes: (Number(p.hour) % 24) * 60 + Number(p.minute),
  };
}

/** Today if it's Sunday, otherwise the coming Sunday. */
export function thisSunday(today: string): string {
  const dow = dayOfWeek(today);
  return dow === 0 ? today : addDays(today, 7 - dow);
}

/**
 * What the app shows when nobody has picked anything: on a Sunday, the service
 * happening around now; on any other day, the coming Sunday's first service.
 */
export function autoSelection(now: DallasNow): Selection {
  const sunday = thisSunday(now.date);
  if (now.date !== sunday) return { date: sunday, slot: "8:00" };
  if (now.minutes < 9 * 60 + 15) return { date: sunday, slot: "8:00" };
  if (now.minutes < 11 * 60 + 15) return { date: sunday, slot: "9:30" };
  return { date: sunday, slot: "11:30" };
}

export interface SundayOption {
  date: string;
  short: string;
  long: string;
  tag: string;
  isPast: boolean;
}

/** The Sundays offered in the picker: next week, this Sunday, then the last six. */
export function sundayOptions(today: string): SundayOption[] {
  const sunday = thisSunday(today);
  const dates = [addDays(sunday, 7), sunday];
  for (let i = 1; i <= 6; i++) dates.push(addDays(sunday, -7 * i));
  return dates.map((date) => ({
    date,
    short: formatShort(date),
    long: formatLong(date),
    tag:
      date === sunday
        ? today === sunday
          ? "Today"
          : "This Sunday"
        : date === addDays(sunday, -7)
          ? "Last Sunday"
          : "",
    isPast: date < today,
  }));
}
