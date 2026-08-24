export function bdt(n: number) {
  return `৳${Math.round(n).toLocaleString("en-BD")}`;
}

/** "07:30:00" -> "07:30" */
export function hhmm(t: string) {
  return t.slice(0, 5);
}

/** 325 -> "5h 25m" */
export function duration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function today() {
  return toISODate(new Date());
}

export function prettyDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function prettyDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dhaka",
  });
}

export function nightsBetween(a: string, b: string) {
  return Math.max(
    1,
    Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000),
  );
}

/** Departure + duration can spill into the next day — Agoda shows a +1 marker. */
export function arrivalDayOffset(depart: string, arrive: string) {
  const d = Number(depart.slice(0, 2)) * 60 + Number(depart.slice(3, 5));
  const a = Number(arrive.slice(0, 2)) * 60 + Number(arrive.slice(3, 5));
  return a < d ? 1 : 0;
}
