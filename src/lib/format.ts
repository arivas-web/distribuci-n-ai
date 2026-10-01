/**
 * Formatos españoles. Se formatea a mano porque Intl en es-ES no agrupa los
 * miles en números de cuatro cifras (1234 €) y queremos 1.234 € siempre.
 */

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatNumber(value: number, decimals = 0): string {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const out = groupThousands(int) + (dec ? "," + dec : "");
  return negative ? "−" + out : out;
}

/** 1.234,56 € */
export function formatEuro(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)} €`;
}

/** 12.400 € (sin decimales, para cifras resumen). */
export function formatEuroShort(value: number): string {
  return formatEuro(Math.round(value), 0);
}

/** 12,4 k€ para ejes de gráficos. */
export function formatEuroCompact(value: number): string {
  if (Math.abs(value) >= 1000) return `${formatNumber(value / 1000, value >= 10000 ? 0 : 1)} k€`;
  return `${formatNumber(value, 0)} €`;
}

export function formatPercent(value: number, decimals = 0): string {
  return `${formatNumber(value * 100, decimals)} %`;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parse(date: string): Date {
  // Las fechas de la demo son locales y sin zona horaria.
  const [d, t] = date.split("T");
  const [y, m, day] = d.split("-").map(Number);
  if (!t) return new Date(y, m - 1, day);
  const [hh, mm, ss] = t.split(":").map(Number);
  return new Date(y, m - 1, day, hh || 0, mm || 0, ss || 0);
}

export { parse as parseDate };

/** dd/mm/aaaa */
export function formatDate(date: string): string {
  const d = parse(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** dd/mm */
export function formatDayMonth(date: string): string {
  const d = parse(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** 12:40 */
export function formatTime(date: string): string {
  const d = parse(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const weekdays = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const months = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
export const monthsShort = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Día de la semana con lunes = 0. */
export function weekdayIndex(date: string): number {
  return (parse(date).getDay() + 6) % 7;
}

export function weekdayName(date: string): string {
  return weekdays[weekdayIndex(date)];
}

/** "miércoles, 30 de septiembre" */
export function formatLongDate(date: string): string {
  const d = parse(date);
  return `${weekdayName(date)}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

/** "sep 2026" a partir de "2026-09" */
export function formatMonth(month: string, long = false): string {
  const [y, m] = month.split("-").map(Number);
  return long ? `${months[m - 1]} ${y}` : `${monthsShort[m - 1]} ${String(y).slice(2)}`;
}

/** 2 min 15 s */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} s`;
  return s ? `${m} min ${s} s` : `${m} min`;
}

/** 0:14 para notas de voz */
export function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}

/** Días entre dos fechas (b − a). */
export function daysBetween(a: string, b: string): number {
  const da = parse(a.slice(0, 10));
  const db = parse(b.slice(0, 10));
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** "hace 15 días", "ayer", "hoy" */
export function formatAgo(date: string, now: string): string {
  const d = daysBetween(date, now);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 60) return `hace ${d} días`;
  const m = Math.round(d / 30);
  return `hace ${m} meses`;
}

export function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
