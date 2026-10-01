/**
 * Capa de datos. Hoy lee los JSON generados por `npm run seed`; para conectar
 * una fuente real (ERP, CRM, canal de mensajería) basta con reimplementar
 * estas funciones manteniendo los tipos de `src/types`.
 *
 * Solo se usa desde componentes de servidor: los JSON grandes no llegan al
 * navegador, solo lo que cada pantalla necesita.
 */
import { readFileSync } from "fs";
import path from "path";
import type {
  ActivityEvent,
  AutonomyAction,
  Client,
  Conversation,
  LearnedRule,
  Order,
  Product,
  RuleProposal,
  StuckCase,
  TodaySummary,
} from "@/types";
import type { ClientLite, Meta, Results, WeekPoint } from "./types";

export type * from "./types";

const cache = new Map<string, unknown>();
function load<T>(name: string): T {
  if (!cache.has(name)) {
    const file = path.join(process.cwd(), "data", name);
    cache.set(name, JSON.parse(readFileSync(file, "utf8")));
  }
  return cache.get(name) as T;
}

export const getMeta = () => load<Meta>("meta.json");
export const getClients = () => load<Client[]>("clients.json");
export const getClient = (id: string) => getClients().find((c) => c.id === id);
export const getProducts = () => load<Product[]>("products.json");
export const getOrders = () => load<Order[]>("orders.json");
export const getConversations = () => load<Conversation[]>("conversations.json");
export const getActivity = () => load<ActivityEvent[]>("activity.json");
export const getCasesData = () => load<{ cases: StuckCase[]; ruleProposals: RuleProposal[] }>("cases.json");
export const getResults = () => load<Results>("results.json");
export const getAutonomy = () => load<{ actions: AutonomyAction[]; rules: LearnedRule[] }>("autonomy.json");
export const getSummary = () =>
  load<{ today: TodaySummary; stats30: Record<string, number> }>("summary.json");

export function getOrdersForClient(clientId: string): Order[] {
  return getOrders().filter((o) => o.clientId === clientId);
}

/** Lunes de la semana de una fecha (aaaa-mm-dd). */
export function weekStart(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/** Serie semanal de facturación de un cliente desde el inicio del historial. */
export function weeklySeries(clientId: string, familyId?: string, fromDate?: string): WeekPoint[] {
  const meta = getMeta();
  const start = weekStart(fromDate ?? meta.historyStart);
  const end = weekStart(meta.today);
  const map = new Map<string, WeekPoint>();
  for (let d = new Date(start + "T12:00:00Z"); d.toISOString().slice(0, 10) <= end; d.setUTCDate(d.getUTCDate() + 7)) {
    const w = d.toISOString().slice(0, 10);
    map.set(w, { week: w, total: 0, ...(familyId ? { family: 0 } : {}) });
  }
  for (const o of getOrdersForClient(clientId)) {
    const p = map.get(weekStart(o.date));
    if (!p) continue;
    p.total += o.total;
    if (familyId) p.family! += o.byFamily[familyId] ?? 0;
  }
  return [...map.values()].map((p) => ({
    ...p,
    total: Math.round(p.total),
    ...(familyId ? { family: Math.round(p.family!) } : {}),
  }));
}

export function getClientsLite(): ClientLite[] {
  const zones = new Map(getMeta().zones.map((z) => [z.id, z.name]));
  return getClients().map((c) => ({
    id: c.id,
    name: c.name,
    zone: zones.get(c.zoneId) ?? c.zoneId,
    type: c.type,
    status: c.status,
    avgTicket: c.avgTicket,
    contactName: c.contactName,
  }));
}
