/**
 * Genera los datos ficticios de la demo en /data. Siempre produce el mismo
 * resultado porque usa una semilla fija (config/brand.ts).
 *
 *   npm run seed
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { brand } from "../config/brand";
import type {
  ActivityEvent,
  AutonomyAction,
  BusinessType,
  Client,
  Conversation,
  LearnedRule,
  MonthlyResult,
  Order,
  OrderChannel,
  OrderLine,
  RiskType,
  TodaySummary,
} from "../src/types";
import { formatDate, formatDuration, formatEuro } from "../src/lib/format";
import { createRng } from "./seed/rng";
import { businessNameCandidates, nameCore, firstNames, reps, streets, surnames, zones, zoneWeights } from "./seed/names";
import { buildCatalog, families, familyMix, featured, typeProfile } from "./seed/catalog";
import {
  recoveryConversation,
  routineCall,
  routineNoOrder,
  routineNoReply,
  routineWhatsapp,
  toEmail,
} from "./seed/conversations";
import { buildStuckCases } from "./seed/stuck-cases";

const rng = createRng(brand.seed);
const NOW = brand.demoNow;
const TODAY = NOW.slice(0, 10);
const START = "2025-04-01";

// ── Fechas como índice de día desde START ───────────────────────────────────
const DAY = 86400000;
const toUTC = (d: string) => new Date(d + "T00:00:00Z").getTime();
const idx = (d: string) => Math.round((toUTC(d) - toUTC(START)) / DAY);
const iso = (i: number) => new Date(toUTC(START) + i * DAY).toISOString().slice(0, 10);
const dow = (i: number) => (new Date(toUTC(START) + i * DAY).getUTCDay() + 6) % 7; // 0 = lunes
const monthOf = (i: number) => new Date(toUTC(START) + i * DAY).getUTCMonth();
const TODAY_I = idx(TODAY);
const AGENT_I = idx(brand.agentStart);
const r2 = (n: number) => Math.round(n * 100) / 100;

// ── Catálogo ────────────────────────────────────────────────────────────────
const products = buildCatalog(rng);
const productById = new Map(products.map((p) => [p.id, p]));
const familyName = (id: string) => families.find((f) => f.id === id)!.name;

// ── Clientes ────────────────────────────────────────────────────────────────
interface Spec {
  id: string;
  name: string;
  type: BusinessType;
  zoneId: string;
  contact: string;
  cadence: number;
  ticket: number;
  since?: string;
  families?: string[];
  usual?: { productId: string; qty: number }[];
}

const specials: Spec[] = [
  { id: "c-peirao", name: "Bar O Peirao", type: "bar", zoneId: "cangas", contact: "Manolo Graña", cadence: 7, ticket: 330, since: "2016-03-14", families: ["barril", "envasada", "refrescos", "aguas", "licores", "cafe"], usual: [{ productId: featured.barrilPeirao, qty: 2 }] },
  { id: "c-lareira", name: "Restaurante A Lareira", type: "restaurante", zoneId: "vigo", contact: "Isabel Otero", cadence: 7, ticket: 610, families: ["barril", "refrescos", "aguas", "vinos", "cafe", "seca", "aceites", "limpieza"], usual: [{ productId: featured.aceite5L, qty: 3 }] },
  { id: "c-alameda", name: "Cafetería Alameda", type: "cafeteria", zoneId: "pontevedra", contact: "Pilar Seoane", cadence: 7, ticket: 240, families: ["envasada", "refrescos", "aguas", "cafe", "seca", "aceites"], usual: [{ productId: featured.aceite5L, qty: 1 }] },
  { id: "c-osarcos", name: "Taberna Os Arcos", type: "restaurante", zoneId: "ourense", contact: "Moncho Losada", cadence: 7, ticket: 330, families: ["barril", "refrescos", "aguas", "vinos", "cafe"], usual: [{ productId: featured.ribeiro, qty: 2 }, { productId: featured.cafeGrano, qty: 3 }] },
  { id: "c-rios", name: "Supermercado Ríos", type: "supermercado", zoneId: "vilagarcia", contact: "Roberto Ríos", cadence: 7, ticket: 1650 },
  { id: "c-vertigo", name: "Pub Vértigo", type: "pub", zoneId: "sanxenxo", contact: "Iago Piñeiro", cadence: 14, ticket: 470 },
  { id: "c-brais", name: "Cafetería Brais", type: "cafeteria", zoneId: "vigo", contact: "Brais Couto", cadence: 7, ticket: 260, families: ["envasada", "refrescos", "aguas", "cafe", "seca", "limpieza"], usual: [{ productId: featured.cafeGrano, qty: 5 }] },
  { id: "c-fogon", name: "Restaurante O Fogón", type: "restaurante", zoneId: "pontevedra", contact: "Rosa Varela", cadence: 7, ticket: 540 },
  { id: "c-bahia", name: "Hotel Bahía", type: "hotel", zoneId: "baiona", contact: "Beatriz Abal", cadence: 7, ticket: 1020, since: "2017-05-02" },
  { id: "c-martinez", name: "Ferretería Martínez", type: "ferreteria", zoneId: "vigo", contact: "Luis Martínez", cadence: 14, ticket: 260 },
];

// En hostelería evitamos "Bar Ferrol" y "Café Ferrol"; en tiendas basta con no repetir el nombre.
const keyOf = (name: string, type: BusinessType) =>
  ["bar", "cafeteria", "pub", "hotel", "restaurante"].includes(type) ? nameCore(name) : name;
const usedNames = new Set(specials.map((s) => keyOf(s.name, s.type)));
const usual = new Map<string, { productId: string; qty: number }[]>();
const clients: Client[] = [];
const zoneById = new Map(zones.map((z) => [z.id, z]));
const repForZone = (z: string) => reps.find((r) => r.zones.includes(z))!.id;

function randomSince(): string {
  // La mayoría son clientes antiguos.
  const year = rng.weighted([[2012, 1], [2014, 2], [2016, 3], [2018, 4], [2020, 4], [2022, 5], [2024, 4]] as const);
  const y = year + rng.int(0, 1);
  return `${y}-${String(rng.int(1, 12)).padStart(2, "0")}-${String(rng.int(1, 28)).padStart(2, "0")}`;
}

function pickFamilies(type: BusinessType): string[] {
  const mix = familyMix[type];
  const fams = Object.keys(mix).filter((f) => mix[f] >= 0.07 || rng.chance(0.6));
  return fams.length >= 1 ? fams : Object.keys(mix);
}

function buildUsual(c: Client, preset: { productId: string; qty: number }[] = []) {
  const mix = familyMix[c.type];
  const totalShare = c.families.reduce((s, f) => s + (mix[f] ?? 0.05), 0);
  const list = [...preset];
  for (const f of c.families) {
    const share = (mix[f] ?? 0.05) / totalShare;
    const already = list.filter((u) => productById.get(u.productId)!.familyId === f);
    const n = Math.max(0, (share >= 0.2 ? rng.int(2, 3) : rng.int(1, 2)) - already.length);
    const pool = products.filter(
      (p) => p.familyId === f && p.id !== featured.aceite5L && !list.some((u) => u.productId === p.id),
    );
    const chosen = rng.shuffle(pool).slice(0, n);
    const presetValue = already.reduce((s, u) => s + u.qty * productById.get(u.productId)!.price, 0);
    const budget = Math.max(0, c.avgTicket * share - presetValue);
    for (const p of chosen) {
      list.push({ productId: p.id, qty: Math.max(1, Math.round(budget / Math.max(1, n) / p.price)) });
    }
  }
  usual.set(c.id, list);
}

function makeClient(spec: Partial<Spec> & { type: BusinessType }, n: number): Client {
  const type = spec.type;
  const profile = typeProfile[type];
  let zoneId = spec.zoneId;
  if (!zoneId) {
    const weights = zoneWeights.map(([z, w]) => {
      const coastal = zoneById.get(z)!.coastal;
      const boost = (type === "hotel" || type === "pub") && coastal ? 1.8 : 1;
      return [z, w * boost] as const;
    });
    zoneId = rng.weighted(weights);
  }
  let name = spec.name;
  if (!name) {
    const candidates = rng.shuffle(businessNameCandidates(type));
    name = candidates.find((c) => !usedNames.has(keyOf(c, type))) ?? `${candidates[0]} ${n}`;
  }
  usedNames.add(keyOf(name, type));
  const contact = spec.contact ?? `${rng.pick(firstNames)} ${rng.pick(surnames)}`;
  const cadence = spec.cadence ?? (rng.chance(profile.weekly) ? 7 : 14);
  const ticket = spec.ticket ?? Math.round(rng.float(profile.ticket[0], profile.ticket[1]) * (cadence === 14 ? 1.5 : 1));
  const c: Client = {
    id: spec.id ?? `c-${String(n).padStart(3, "0")}`,
    name,
    type,
    zoneId,
    repId: repForZone(zoneId),
    contactName: contact,
    phone: `6${rng.int(0, 9)}${rng.int(0, 9)} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
    address: `${rng.pick(streets)}, ${rng.int(1, 120)}, ${zoneById.get(zoneId)!.name}`,
    since: spec.since ?? randomSince(),
    cadenceDays: cadence,
    avgTicket: ticket,
    families: spec.families ?? pickFamilies(type),
    status: "estable",
    controlGroup: false,
    contactPreference: rng.chance(0.14) ? "llamada" : "whatsapp",
    agentManaged: spec.id ? true : rng.chance(0.88),
    monthlyRevenue: 0,
  };
  if (spec.id) c.contactPreference = "whatsapp";
  buildUsual(c, spec.usual);
  return c;
}

for (const s of specials) clients.push(makeClient(s, 0));
const specialIds0 = new Set(specials.map((s) => s.id));
let counter = 1;
for (const [type, profile] of Object.entries(typeProfile) as [BusinessType, (typeof typeProfile)[BusinessType]][]) {
  const already = specials.filter((s) => s.type === type).length;
  for (let i = already; i < profile.count; i++) clients.push(makeClient({ type }, counter++));
}
const clientById = new Map(clients.map((c) => [c.id, c]));

// Algunos clientes prefieren el correo (sobre todo tiendas, supermercados y
// hoteles). Se usa un generador aparte para no alterar el resto de los datos.
{
  const rngEmail = createRng(brand.seed + 1);
  const emailShare: Partial<Record<BusinessType, number>> = { supermercado: 0.5, ferreteria: 0.5, hotel: 0.45, tienda: 0.3, panaderia: 0.1 };
  for (const c of clients) {
    if (specialIds0.has(c.id) || c.contactPreference !== "whatsapp") continue;
    if (rngEmail.chance(emailShare[c.type] ?? 0.04)) c.contactPreference = "email";
  }
  clientById.get("c-bahia")!.contactPreference = "email";
}
const asChannel = (conv: Conversation, c: Client) => (c.contactPreference === "email" && conv.channel === "whatsapp" ? toEmail(conv, c) : conv);

// ── Episodios de fuga ───────────────────────────────────────────────────────
type Group = "contacted" | "control" | "none";
interface Episode {
  clientId: string;
  type: RiskType;
  start: number;
  group: Group;
  outcome: "recovered" | "lost" | "open";
  current: boolean;
  contactDay?: number;
  recoveryDay?: number;
  familyId?: string;
  lowMult?: number;
  /** Solo afecta a los pedidos, no cuenta como episodio propio. */
  silent?: boolean;
}
const episodes: Episode[] = [];
const episodesOf = (id: string) => episodes.filter((e) => e.clientId === id);

const specialIds = new Set(specials.map((s) => s.id));
const pool = rng.shuffle(clients.filter((c) => !specialIds.has(c.id)));
const takeClient = (filter: (c: Client) => boolean = () => true) => {
  const i = pool.findIndex(filter);
  return pool.splice(i, 1)[0];
};
const mainFamily = (c: Client, exclude: string[] = []) => {
  const mix = familyMix[c.type];
  const options = c.families.filter((f) => (mix[f] ?? 0) >= 0.1 && !exclude.includes(f));
  return rng.pick(options.length ? options : c.families);
};
const contactDelay = (type: RiskType, cadence: number) =>
  ({ retraso: Math.ceil(cadence * 1.6), caida_volumen: 28, familia_abandonada: 14, nuevo_sin_repetir: cadence * 2 })[type];
/** El agente no escribe en domingo. */
const workday = (d: number) => (dow(d) === 6 ? d + 1 : d);

// Bar O Peirao: dejó el barril el 08/09 y no pide desde el 15/09.
episodes.push({ clientId: "c-peirao", type: "familia_abandonada", start: idx("2026-09-03"), group: "contacted", outcome: "open", current: true, familyId: "barril", silent: true });
episodes.push({ clientId: "c-peirao", type: "retraso", start: idx("2026-09-16"), group: "contacted", outcome: "open", current: true, contactDay: TODAY_I });
// Cafetería Brais: deja de comprar café.
episodes.push({ clientId: "c-brais", type: "familia_abandonada", start: TODAY_I - 23, group: "contacted", outcome: "open", current: true, familyId: "cafe", contactDay: TODAY_I - 1 });

// 23 casos de fuga actuales más (25 en total), con un 15 % en grupo de control.
const currentPlan: RiskType[] = [
  ...Array(7).fill("retraso"),
  ...Array(6).fill("caida_volumen"),
  ...Array(5).fill("familia_abandonada"),
  ...Array(5).fill("nuevo_sin_repetir"),
];
const controlSlots = new Set([3, 9, 14, 20]);
currentPlan.forEach((type, i) => {
  const c = takeClient((c) => c.type !== "ferreteria" || type !== "familia_abandonada");
  const group: Group = controlSlots.has(i) ? "control" : "contacted";
  let start: number;
  const ep: Episode = { clientId: c.id, type, start: 0, group, outcome: "open", current: true };
  if (type === "retraso") {
    start = TODAY_I - Math.round(c.cadenceDays * rng.float(2.1, 2.9));
  } else if (type === "caida_volumen") {
    start = TODAY_I - rng.int(42, 70);
    ep.lowMult = rng.float(0.42, 0.6);
  } else if (type === "familia_abandonada") {
    start = TODAY_I - rng.int(21, 42);
    ep.familyId = mainFamily(c);
  } else {
    start = TODAY_I - rng.int(35, 63);
    c.since = iso(start);
  }
  ep.start = start;
  if (group === "contacted") ep.contactDay = Math.min(TODAY_I, workday(start + contactDelay(type, c.cadenceDays)));
  episodes.push(ep);
});

// Episodios cerrados desde que trabaja el agente.
for (let i = 0; i < 82; i++) {
  const type = rng.weighted([["retraso", 35], ["caida_volumen", 22], ["familia_abandonada", 28], ["nuevo_sin_repetir", 15]] as const);
  const c = takeClient((c) => c.type !== "ferreteria" || type !== "familia_abandonada");
  const group: Group = rng.chance(0.15) ? "control" : "contacted";
  const recovered = rng.chance(group === "contacted" ? 0.67 : 0.24);
  // Más episodios a medida que el agente cubre más clientes.
  const start = AGENT_I + Math.floor(Math.sqrt(rng.next()) * (TODAY_I - 45 - AGENT_I));
  const ep: Episode = { clientId: c.id, type, start, group, outcome: recovered ? "recovered" : "lost", current: false };
  if (type === "caida_volumen") ep.lowMult = rng.float(0.4, 0.6);
  if (type === "familia_abandonada") ep.familyId = mainFamily(c);
  if (type === "nuevo_sin_repetir") c.since = iso(start);
  if (group === "contacted") ep.contactDay = workday(start + contactDelay(type, c.cadenceDays));
  if (recovered) {
    ep.recoveryDay =
      group === "contacted"
        ? ep.contactDay!
        : start + { retraso: c.cadenceDays * rng.int(3, 5), caida_volumen: rng.int(50, 80), familia_abandonada: rng.int(40, 70), nuevo_sin_repetir: rng.int(30, 60) }[type];
    ep.recoveryDay = Math.min(ep.recoveryDay, TODAY_I - 2);
  }
  episodes.push(ep);
}

// Algunos clientes se perdieron antes de que llegara el agente.
for (let i = 0; i < 8; i++) {
  const c = takeClient();
  episodes.push({ clientId: c.id, type: "retraso", start: rng.int(60, AGENT_I - 20), group: "none", outcome: "lost", current: false });
}

// Unos cuantos clientes nuevos que sí repiten.
for (let i = 0; i < 14; i++) {
  const c = takeClient((c) => c.type !== "supermercado");
  c.since = iso(rng.int(30, TODAY_I - 50));
}

// ── Pedidos ─────────────────────────────────────────────────────────────────
const coastalSeason = [0.72, 0.8, 0.9, 1, 1.05, 1.2, 1.45, 1.55, 1.15, 0.95, 0.85, 1.05];
const inlandSeason = [0.8, 0.88, 0.95, 1, 1.02, 1.05, 1.05, 0.92, 1, 1, 0.95, 1.15];
function season(c: Client, day: number) {
  const coastal = zoneById.get(c.zoneId)!.coastal;
  let s = (coastal ? coastalSeason : inlandSeason)[monthOf(day)];
  if (["tienda", "supermercado", "ferreteria", "panaderia"].includes(c.type)) s = 1 + (s - 1) * 0.4;
  if (c.type === "hotel" && coastal) s = 1 + (s - 1) * 1.3;
  return s;
}

const orders: Order[] = [];
const skips: { clientId: string; day: number }[] = [];
let orderCounter = 1;

function buildLines(c: Client, factor: number, drop: Set<string>): OrderLine[] {
  const mix = familyMix[c.type];
  const lines: OrderLine[] = [];
  for (const u of usual.get(c.id)!) {
    const p = productById.get(u.productId)!;
    if (drop.has(p.familyId)) continue;
    if ((mix[p.familyId] ?? 0) < 0.08 && rng.chance(0.3)) continue;
    const q = u.qty * factor * rng.float(0.8, 1.2);
    const qty = q < 1 ? (rng.chance(q) ? 1 : 0) : Math.round(q);
    if (qty > 0) lines.push({ productId: p.id, name: `${p.name} · ${p.format}`, qty, price: p.price });
  }
  if (!lines.length) {
    const u = usual.get(c.id)!.find((u) => !drop.has(productById.get(u.productId)!.familyId)) ?? usual.get(c.id)![0];
    const p = productById.get(u.productId)!;
    lines.push({ productId: p.id, name: `${p.name} · ${p.format}`, qty: 1, price: p.price });
  }
  return lines;
}

function finalize(o: Order) {
  const lines = o.lines!;
  o.total = r2(lines.reduce((s, l) => s + l.qty * l.price, 0));
  o.margin = r2(lines.reduce((s, l) => s + l.qty * (l.price - productById.get(l.productId)!.cost), 0));
  const byFamily: Record<string, number> = {};
  for (const l of lines) {
    const f = productById.get(l.productId)!.familyId;
    byFamily[f] = r2((byFamily[f] ?? 0) + l.qty * l.price);
  }
  o.byFamily = byFamily;
}

const holidays = new Set(["2025-12-25", "2026-01-01", "2026-01-06", "2025-05-01", "2026-05-01", "2025-07-25", "2026-07-25", "2025-08-15", "2026-08-15"]);

for (const c of clients) {
  const eps = episodesOf(c.id);
  const sinceI = Math.max(0, idx(c.since));
  const hosteleria = ["bar", "cafeteria", "restaurante", "pub"].includes(c.type);
  const coastal = zoneById.get(c.zoneId)!.coastal;
  const augustClosure = hosteleria && !coastal && rng.chance(0.18);
  const januaryClosure = hosteleria && coastal && rng.chance(0.1);
  const fixed = c.id === "c-peirao";
  let first = idx(c.since) >= 0 ? sinceI : rng.int(0, c.cadenceDays - 1);
  if (fixed) first = idx("2025-04-01"); // martes
  const nuevo = eps.find((e) => e.type === "nuevo_sin_repetir");
  if (nuevo) first = nuevo.start;
  const injected = new Set<Episode>();

  for (let k = 0; ; k++) {
    let day = first + k * c.cadenceDays;
    if (!fixed && k > 0 && rng.chance(c.cadenceDays === 7 ? 0.25 : 0.4)) day += rng.pick([-1, 1, c.cadenceDays === 14 ? 2 : 1]);
    while (holidays.has(iso(day)) || dow(day) === 6) day += 1;
    if (day > TODAY_I) break;
    if (day < sinceI) continue;

    // Una recuperación provoca un pedido justo ese día.
    let skipRegular = false;
    for (const e of eps) {
      if (e.recoveryDay !== undefined && !injected.has(e) && day >= e.recoveryDay) {
        injected.add(e);
        if (day !== e.recoveryDay) {
          emit(c, e.recoveryDay, eps, true);
          if (day - e.recoveryDay < c.cadenceDays / 2) skipRegular = true;
        }
      }
    }
    if (skipRegular) continue;

    const m = monthOf(day);
    const dom = Number(iso(day).slice(8, 10));
    if (augustClosure && m === 7 && dom <= 16 && day < 365) continue;
    if (januaryClosure && m === 0 && dom >= 12) continue;
    if (!fixed && k > 0 && rng.chance(c.cadenceDays === 7 ? 0.03 : 0.02)) {
      skips.push({ clientId: c.id, day });
      continue;
    }
    emit(c, day, eps, false);
  }
}

function emit(c: Client, day: number, eps: Episode[], forced: boolean) {
  const forcedByRecovery = forced || eps.some((e) => e.recoveryDay === day && e.group === "contacted");
  let mult = 1;
  const drop = new Set<string>();
  let recoveredAmountKind: { type: RiskType; low?: number; familyId?: string } | undefined;
  for (const e of eps) {
    if (day < e.start) continue;
    const recovered = e.recoveryDay !== undefined && day >= e.recoveryDay;
    const attributed = recovered && e.group === "contacted" && day - e.recoveryDay! <= 60;
    switch (e.type) {
      case "retraso":
        if (!recovered) return;
        if (attributed) recoveredAmountKind = { type: "retraso" };
        break;
      case "nuevo_sin_repetir":
        if (day > e.start && !recovered) return;
        if (attributed && day > e.start) recoveredAmountKind = { type: "nuevo_sin_repetir" };
        break;
      case "caida_volumen": {
        if (e.outcome === "lost" && day >= e.start + 56) return;
        if (recovered) {
          mult *= 0.95;
          if (attributed) recoveredAmountKind = { type: "caida_volumen", low: e.lowMult };
        } else {
          const progress = Math.min(1, (day - e.start) / 42);
          mult *= 1 - (1 - e.lowMult!) * progress;
        }
        break;
      }
      case "familia_abandonada":
        if (!recovered) drop.add(e.familyId!);
        else if (attributed) recoveredAmountKind = { type: "familia_abandonada", familyId: e.familyId };
        break;
    }
  }
  const factor = season(c, day) * mult * rng.float(0.88, 1.12);
  const channel: OrderChannel =
    (day >= AGENT_I && c.agentManaged && rng.chance(0.96)) || forcedByRecovery
      ? "agente"
      : rng.weighted([["comercial", 50], ["telefono", 30], ["web", 20]] as const);
  const o: Order = {
    id: `o-${orderCounter++}`,
    clientId: c.id,
    date: iso(day),
    total: 0,
    margin: 0,
    channel,
    byFamily: {},
    lines: buildLines(c, factor, drop),
  };
  finalize(o);
  if (recoveredAmountKind) {
    const k = recoveredAmountKind;
    o.recoveredAmount = r2(
      k.type === "caida_volumen" ? o.total * (1 - k.low! / 0.95) : k.type === "familia_abandonada" ? (o.byFamily[k.familyId!] ?? 0) : o.total,
    );
  }
  orders.push(o);
}

orders.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

// Los clientes de los casos atascados tienen su pedido de hoy dentro del caso.
for (let i = orders.length - 1; i >= 0; i--) {
  if (specialIds.has(orders[i].clientId) && orders[i].date === TODAY) orders.splice(i, 1);
}

// ── Estado de cada cliente ──────────────────────────────────────────────────
const ordersByClient = new Map<string, Order[]>();
for (const o of orders) {
  if (!ordersByClient.has(o.clientId)) ordersByClient.set(o.clientId, []);
  ordersByClient.get(o.clientId)!.push(o);
}

function revenueBetween(clientId: string, from: number, to: number) {
  return (ordersByClient.get(clientId) ?? [])
    .filter((o) => idx(o.date) >= from && idx(o.date) < to)
    .reduce((s, o) => s + o.total, 0);
}

for (const c of clients) {
  const list = ordersByClient.get(c.id) ?? [];
  c.lastOrder = list.at(-1)?.date;
  c.monthlyRevenue = Math.round(revenueBetween(c.id, TODAY_I - 91, TODAY_I + 1) / 3);
  const eps = episodesOf(c.id).filter((e) => !e.silent);
  const current = eps.find((e) => e.current);
  const reference = current ? current.start : TODAY_I + 1;
  const ref = list.filter((o) => idx(o.date) < reference && idx(o.date) >= reference - 180);
  if (ref.length) c.avgTicket = Math.round(ref.reduce((s, o) => s + o.total, 0) / ref.length);
  if (current) {
    c.status = "en_riesgo";
    c.controlGroup = current.group === "control";
    const baseline = Math.round(revenueBetween(c.id, current.start - 91, current.start) / 3) || Math.round(c.avgTicket * (30 / c.cadenceDays));
    const days = TODAY_I - (c.lastOrder ? idx(c.lastOrder) : current.start);
    const weeks = Math.max(1, Math.round((TODAY_I - current.start) / 7));
    const cadenceText = c.cadenceDays === 7 ? "cada semana" : "cada 15 días";
    let summary = "";
    let atStake = baseline;
    let familyId: string | undefined;
    if (c.id === "c-peirao") {
      summary = `Pedía cada semana, lleva ${days} días sin pedir y hace 3 semanas que no compra cerveza de barril.`;
      familyId = "barril";
    } else if (current.type === "retraso") {
      summary = `Pedía ${cadenceText} y lleva ${days} días sin pedir.`;
    } else if (current.type === "caida_volumen") {
      const recent = revenueBetween(c.id, TODAY_I - 28, TODAY_I + 1) / 28;
      const before = revenueBetween(c.id, current.start - 56, current.start) / 56;
      const drop = Math.max(20, Math.round((1 - recent / before) * 100));
      summary = `Sus pedidos han bajado un ${drop} % en las últimas ${weeks} semanas.`;
      atStake = Math.round(baseline * (drop / 100));
    } else if (current.type === "familia_abandonada") {
      familyId = current.familyId;
      summary = `Hace ${weeks} semanas que no compra ${familyName(current.familyId!).toLowerCase()}.`;
      const famRevenue = (ordersByClient.get(c.id) ?? [])
        .filter((o) => idx(o.date) >= current.start - 91 && idx(o.date) < current.start)
        .reduce((s, o) => s + (o.byFamily[current.familyId!] ?? 0), 0);
      atStake = Math.round(famRevenue / 3);
    } else {
      summary = `Hizo su primer pedido el ${formatDate(c.since)} y no ha vuelto a pedir.`;
      atStake = Math.round(c.avgTicket * (30 / c.cadenceDays));
    }
    // En O Peirao el patrón se rompe cuando deja el barril, antes de dejar de pedir.
    const since = c.id === "c-peirao" ? "2026-09-03" : iso(current.start);
    c.risk = { type: current.type, since, summary, familyId, monthlyAtStake: atStake };
  } else {
    const last = eps.filter((e) => !e.current).at(-1);
    if (last?.outcome === "lost") c.status = "perdido";
    else if (last?.outcome === "recovered" && last.group === "contacted") {
      c.status = "recuperado";
      c.recoveredAt = iso(last.recoveryDay!);
    }
    if (last?.group === "control") c.controlGroup = true;
  }
}

// ── Actividad del agente ────────────────────────────────────────────────────
const WINDOW_STATS = TODAY_I - 29; // 30 días para estadísticas
const WINDOW_DETAIL = TODAY_I - 6; // 7 días con detalle completo
const conversations: Conversation[] = [];
const events: ActivityEvent[] = [];
let convCounter = 1;
let eventCounter = 1;
const stats = { reminders: 0, orders: 0, ordersAmount: 0, calls: 0, riskContacts: 0, escalations: 0, conversations: 0, noReply: 0 };

const randTime = (day: number, fromMin: number, toMin: number) => {
  const m = rng.int(fromMin, toMin);
  return `${iso(day)}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
};
const nowMinutes = Number(NOW.slice(11, 13)) * 60 + Number(NOW.slice(14, 16));
const pushEvent = (e: Omit<ActivityEvent, "id">) => {
  if (e.time > NOW) return;
  events.push({ id: `ev-${eventCounter++}`, ...e });
};

const recoveryOrderIds = new Set<string>();
const recoveryEpisodes = episodes.filter((e) => e.contactDay !== undefined && e.contactDay >= WINDOW_STATS && !e.silent);
for (const e of recoveryEpisodes) {
  if (e.recoveryDay !== undefined) {
    const o = (ordersByClient.get(e.clientId) ?? []).find((o) => o.date === iso(e.recoveryDay!));
    if (o) recoveryOrderIds.add(o.id);
  }
}

// Pedidos habituales cerrados por el agente.
const todayPending: Order[] = [];
for (const o of orders) {
  const day = idx(o.date);
  if (o.channel !== "agente" || day < WINDOW_STATS || recoveryOrderIds.has(o.id)) continue;
  const c = clientById.get(o.clientId)!;
  if (day === TODAY_I && rng.chance(0.1)) {
    todayPending.push(o);
    continue;
  }
  stats.orders++;
  stats.conversations++;
  if (c.contactPreference === "llamada") stats.calls++;
  else stats.reminders++;
  const latest = day === TODAY_I ? nowMinutes - 25 : 13 * 60 + 30;
  const start = day === TODAY_I ? randTime(day, 7 * 60 + 30, 10 * 60 + 45) : randTime(day, 7 * 60 + 30, latest - 60);
  if (day < WINDOW_DETAIL) {
    stats.ordersAmount += o.total;
    continue;
  }
  const convId = `conv-${convCounter++}`;
  const conv = asChannel(c.contactPreference === "llamada" ? routineCall(rng, c, o, start, convId) : routineWhatsapp(rng, c, o, start, convId), c);
  finalize(o);
  conv.orderTotal = o.total;
  const closeTime = conv.messages.filter((m) => m.from === "agente").at(-1)!.time;
  if (closeTime > NOW) {
    // Aún no ha contestado: lo dejamos como pendiente.
    stats.orders--;
    todayPending.push(o);
    continue;
  }
  o.time = closeTime;
  stats.ordersAmount += o.total;
  conversations.push(conv);
  if (conv.channel === "llamada") {
    pushEvent({ time: start, type: "llamada", clientId: c.id, text: `Llamada para el pedido habitual · ${formatDuration(conv.durationSec!)}`, conversationId: convId });
  } else {
    pushEvent({ time: start, type: "recordatorio", clientId: c.id, text: `Recordatorio de pedido habitual por ${conv.channel === "email" ? "correo" : "WhatsApp"}`, conversationId: convId });
  }
  pushEvent({ time: closeTime, type: "pedido_cerrado", clientId: c.id, text: `Pedido cerrado y registrado en el ERP · ${o.lines!.length} productos`, amount: o.total, conversationId: convId });
}

// Pedidos de hoy que aún esperan respuesta: no existen todavía.
for (const o of todayPending) {
  orders.splice(orders.indexOf(o), 1);
  const c = clientById.get(o.clientId)!;
  const start = randTime(TODAY_I, 8 * 60, nowMinutes - 10);
  const convId = `conv-${convCounter++}`;
  conversations.push(asChannel(routineNoReply(rng, c, start, convId, true), c));
  pushEvent({ time: start, type: "recordatorio", clientId: c.id, text: "Recordatorio enviado · esperando respuesta", conversationId: convId });
  stats.reminders++;
  stats.conversations++;
}

// Semanas sin pedido.
for (const s of skips) {
  const c = clientById.get(s.clientId)!;
  if (s.day < WINDOW_STATS || s.day < AGENT_I || !c.agentManaged) continue;
  stats.reminders++;
  stats.conversations++;
  const noReply = rng.chance(0.4);
  if (noReply) stats.noReply++;
  if (s.day < WINDOW_DETAIL || s.day === TODAY_I) continue;
  const start = randTime(s.day, 8 * 60, 11 * 60);
  const convId = `conv-${convCounter++}`;
  const conv = asChannel(noReply ? routineNoReply(rng, c, start, convId, false) : routineNoOrder(rng, c, start, convId), c);
  conversations.push(conv);
  pushEvent({
    time: noReply ? conv.messages.at(-1)!.time : conv.messages[1].time,
    type: noReply ? "sin_respuesta" : "recordatorio",
    clientId: c.id,
    text: noReply ? "No ha contestado al recordatorio" : "No necesita pedido esta semana",
    conversationId: convId,
  });
}

// Contactos a clientes en riesgo.
const riskTypeText: Record<RiskType, string> = {
  retraso: "se está retrasando",
  caida_volumen: "está pidiendo menos",
  familia_abandonada: "ha dejado una familia",
  nuevo_sin_repetir: "es nuevo y no ha repetido",
};
for (const e of recoveryEpisodes) {
  const c = clientById.get(e.clientId)!;
  if (c.id === "c-peirao" || c.id === "c-brais") continue; // tienen su propio caso
  stats.riskContacts++;
  stats.conversations++;
  const day = e.contactDay!;
  const start = randTime(day, 9 * 60, day === TODAY_I ? nowMinutes - 30 : 12 * 60 + 30);
  const lastBefore = (ordersByClient.get(c.id) ?? []).filter((o) => idx(o.date) < day).at(-1);
  const daysSince = lastBefore ? day - idx(lastBefore.date) : day - e.start;
  const order = e.recoveryDay === day ? (ordersByClient.get(c.id) ?? []).find((o) => o.date === iso(day)) : undefined;
  const outcome = order ? "recuperado" : e.outcome === "lost" ? "perdido" : day >= TODAY_I - 2 ? "en_curso" : rng.chance(0.55) ? "sin_respuesta" : "en_curso";
  const convId = `conv-${convCounter++}`;
  const famName = e.familyId ? familyName(e.familyId) : "";
  const conv = asChannel(recoveryConversation(rng, c, e.type, outcome, famName, daysSince, start, convId, order), c);
  if (order) {
    order.time = conv.messages.filter((m) => m.from === "agente").at(-1)!.time;
    if (order.time > NOW) continue;
    conv.orderTotal = order.total;
  }
  conversations.push(conv);
  if (day < WINDOW_DETAIL) continue;
  pushEvent({ time: start, type: "contacto_riesgo", clientId: c.id, text: `Contacto: ${riskTypeText[e.type]}`, conversationId: convId });
  if (order) {
    pushEvent({ time: order.time!, type: "pedido_cerrado", clientId: c.id, text: "Cliente recuperado · pedido cerrado y registrado en el ERP", amount: order.total, conversationId: convId });
  } else if (outcome === "sin_respuesta") {
    pushEvent({ time: conv.messages.at(-1)!.time, type: "sin_respuesta", clientId: c.id, text: "Sin respuesta al contacto", conversationId: convId });
  }
}

// Casos atascados.
const lastFamilyOrder = (clientId: string, familyId: string) =>
  (ordersByClient.get(clientId) ?? []).filter((o) => (o.byFamily[familyId] ?? 0) > 0).at(-1)?.date;
const stuck = buildStuckCases({
  client: (id) => clientById.get(id)!,
  product: (id) => {
    const p = productById.get(id);
    if (!p) throw new Error(`Producto desconocido: ${id}`);
    return p;
  },
  repName: (id) => reps.find((r) => r.id === id)!.name,
  familyName,
  usual: (id) => usual.get(id)!,
  lastFamilyOrder,
  today: TODAY,
});
for (const conv of stuck.conversations) {
  conversations.push(conv);
  const sc = stuck.cases.find((k) => k.conversationId === conv.id)!;
  const first = conv.messages[0];
  pushEvent({
    time: first.time,
    type: conv.purpose === "recuperacion" ? "contacto_riesgo" : first.from === "cliente" ? "recordatorio" : "recordatorio",
    clientId: conv.clientId,
    text: first.from === "cliente" ? "Mensaje del cliente" : conv.purpose === "recuperacion" ? "Contacto: cliente en riesgo" : "Recordatorio de pedido habitual por WhatsApp",
    conversationId: conv.id,
  });
  pushEvent({ time: sc.openedAt, type: "escalado", clientId: conv.clientId, text: sc.blocked, conversationId: conv.id, caseId: sc.id });
}
stats.escalations += stuck.cases.length;
stats.conversations += stuck.cases.length;

// Casos resueltos por el equipo en días anteriores.
const pastResolutions = [
  "Descuento del 7 % en refrescos aprobado",
  "Sustitución de tónica de 20 cl por lata aprobada",
  "Entrega adelantada al lunes aprobada",
  "Pedido de feria aprobado tras confirmar con el cliente",
  "Abono de 3 cajas dañadas aprobado",
  "Pago a 45 días aprobado para este pedido",
  "Cambio de albariño por godello confirmado",
  "Visita del comercial programada",
];
for (let d = WINDOW_STATS; d < TODAY_I; d++) {
  if (dow(d) === 6) continue;
  const n = rng.int(0, 2);
  for (let k = 0; k < n; k++) {
    stats.escalations++;
    if (d < WINDOW_DETAIL) continue;
    const c = rng.pick(clients.filter((c) => c.status === "estable"));
    pushEvent({ time: randTime(d, 9 * 60, 18 * 60), type: "resuelto_equipo", clientId: c.id, text: `${rng.pick(pastResolutions)} por ${rng.pick([brand.user.name, ...reps.map((r) => r.name)])}` });
  }
}

// Avisos de entrega: un evento agrupado por día.
for (let d = WINDOW_DETAIL; d <= TODAY_I; d++) {
  if (dow(d) === 6) continue;
  const prev = iso(d - (dow(d) === 0 ? 2 : 1));
  const ids = [...new Set(orders.filter((o) => o.date === prev).map((o) => o.clientId))].filter((id) => clientById.get(id)!.agentManaged);
  if (!ids.length) continue;
  pushEvent({ time: `${iso(d)}T07:15:00`, type: "aviso_entrega", clientId: "", clientIds: ids, text: `Ha avisado a ${ids.length} clientes de que su pedido llega hoy` });
}

events.sort((a, b) => a.time.localeCompare(b.time));
conversations.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

// ── Resumen de hoy ──────────────────────────────────────────────────────────
const todayEvents = events.filter((e) => e.time.startsWith(TODAY));
const monthPrefix = TODAY.slice(0, 7);
const summary: TodaySummary = {
  attended: new Set(todayEvents.flatMap((e) => e.clientIds ?? [e.clientId])).size,
  ordersClosed: todayEvents.filter((e) => e.type === "pedido_cerrado").length,
  ordersAmount: r2(todayEvents.filter((e) => e.type === "pedido_cerrado").reduce((s, e) => s + (e.amount ?? 0), 0)),
  autonomousRate: 1 - stats.escalations / stats.conversations,
  recoveredThisMonth: r2(orders.filter((o) => o.date.startsWith(monthPrefix)).reduce((s, o) => s + (o.recoveredAmount ?? 0), 0)),
};

// ── Resultados ──────────────────────────────────────────────────────────────
const months: string[] = [];
for (let d = AGENT_I; d <= TODAY_I; d++) {
  const m = iso(d).slice(0, 7);
  if (!months.includes(m)) months.push(m);
}
const counted = episodes.filter((e) => !e.silent && e.group !== "none");
const monthly: MonthlyResult[] = months.map((m) => {
  const inMonth = orders.filter((o) => o.date.startsWith(m) && o.recoveredAmount);
  const eps = counted.filter((e) => iso(e.start).startsWith(m));
  return {
    month: m,
    recoveredSales: r2(inMonth.reduce((s, o) => s + o.recoveredAmount!, 0)),
    recoveredMargin: r2(inMonth.reduce((s, o) => s + o.recoveredAmount! * (o.margin / o.total), 0)),
    contactedAtRisk: eps.filter((e) => e.group === "contacted").length,
    contactedRecovered: eps.filter((e) => e.group === "contacted" && e.outcome === "recovered").length,
    controlAtRisk: eps.filter((e) => e.group === "control").length,
    controlRecovered: eps.filter((e) => e.group === "control" && e.outcome === "recovered").length,
  };
});
const groupSummary = (g: Group) => {
  const list = counted.filter((e) => e.group === g);
  return {
    total: list.length,
    recovered: list.filter((e) => e.outcome === "recovered").length,
    lost: list.filter((e) => e.outcome === "lost").length,
    open: list.filter((e) => e.outcome === "open").length,
  };
};
const results = {
  monthly,
  contacted: groupSummary("contacted"),
  control: groupSummary("control"),
  monthlyServiceCost: brand.monthlyServiceCost,
};

// ── Autonomía ───────────────────────────────────────────────────────────────
const autonomy: AutonomyAction[] = [
  { id: "recordatorio", name: "Enviar recordatorio de pedido habitual", description: "Escribe al cliente el día que le toca pedir con su pedido de siempre.", level: "autonomo", accuracy: 0.993, cases: stats.reminders },
  { id: "erp", name: "Registrar pedido en el ERP", description: "Da de alta el pedido confirmado con sus líneas y fecha de entrega.", level: "autonomo", accuracy: 0.997, cases: stats.orders },
  { id: "cambios", name: "Aceptar cambios en el pedido habitual", description: "Suma, quita o cambia cantidades cuando el cliente lo pide.", level: "autonomo", accuracy: 0.981, cases: Math.round(stats.orders * 0.42) },
  { id: "riesgo", name: "Contactar a un cliente que se sale de su patrón", description: "Escribe por WhatsApp o correo, o llama, cuando un cliente se retrasa, pide menos o deja una familia.", level: "actua_avisa", accuracy: 0.941, cases: stats.riskContacts + 2 },
  { id: "llamar", name: "Llamar a un cliente", description: "Llama a quien prefiere el teléfono o no contesta por WhatsApp ni por correo.", level: "actua_avisa", accuracy: 0.928, cases: stats.calls },
  { id: "descuento", name: "Aplicar descuento dentro de margen", description: "Ofrece hasta un 5 % si el margen del pedido sigue por encima del 18 %.", level: "actua_avisa", accuracy: 0.957, cases: 38 },
  { id: "sustituir", name: "Sustituir producto sin stock", description: "Propone un producto equivalente cuando el habitual no está disponible.", level: "propone", accuracy: 0.884, cases: 46 },
  { id: "incidencias", name: "Gestionar incidencias y abonos pequeños", description: "Abona roturas o faltas de menos de 30 € y avisa a reparto.", level: "propone", accuracy: 0.903, cases: 14 },
  { id: "condiciones", name: "Cambiar condiciones de pago", description: "Plazos, aplazamientos y condiciones especiales.", level: "observa", accuracy: 0, cases: 3 },
];
const rules: LearnedRule[] = [
  { id: "rule-1", text: "Si un cliente pide fuera del horario de reparto, ofrecerle la siguiente ruta disponible sin consultar.", origin: `${brand.user.name} lo aprobó 3 veces seguidas`, createdAt: "2026-05-12", applied: 41, active: true, actionId: "cambios" },
  { id: "rule-2", text: "Si un cliente dice que está de vacaciones, no volver a escribirle hasta la fecha que indique.", origin: "Decisión de Marta Iglesias en 4 casos", createdAt: "2026-06-03", applied: 27, active: true, actionId: "riesgo" },
  { id: "rule-3", text: "Cuando un bar de costa pide más del doble en julio o agosto, servir sin confirmar si no tiene facturas pendientes.", origin: `${brand.user.name} lo aprobó 5 veces`, createdAt: "2026-07-08", applied: 18, active: true, actionId: "cambios" },
  { id: "rule-4", text: "Sustituir el agua de 1,5 L por la de 50 cl cuando no hay stock, manteniendo los mismos litros.", origin: "Decisión de Lucía Fernández en 3 casos", createdAt: "2026-08-21", applied: 12, active: true, actionId: "sustituir" },
];

// ── Escritura ───────────────────────────────────────────────────────────────
const out = path.join(__dirname, "..", "data");
mkdirSync(out, { recursive: true });
const write = (name: string, data: unknown) => writeFileSync(path.join(out, name), JSON.stringify(data) + "\n");

// En el historial solo guardamos las líneas de los pedidos recientes.
const compactOrders = orders.map((o) => {
  const { lines: _lines, ...rest } = o; // eslint-disable-line @typescript-eslint/no-unused-vars
  return idx(o.date) >= WINDOW_DETAIL && o.channel === "agente" ? o : rest;
});

write("meta.json", { now: NOW, today: TODAY, historyStart: START, agentStart: brand.agentStart, zones, reps, families });
write("clients.json", clients);
write("products.json", products);
write("orders.json", compactOrders);
write("conversations.json", conversations);
write("activity.json", events);
write("cases.json", stuck);
write("results.json", results);
write("autonomy.json", { actions: autonomy, rules });
write("summary.json", { today: summary, stats30: stats });

// ── Comprobaciones ──────────────────────────────────────────────────────────
const atRisk = clients.filter((c) => c.status === "en_riesgo");
console.log(`Clientes: ${clients.length} · productos: ${products.length} · pedidos: ${orders.length}`);
console.log(`En riesgo: ${atRisk.length} (control: ${atRisk.filter((c) => c.controlGroup).length}) · recuperados: ${clients.filter((c) => c.status === "recuperado").length} · perdidos: ${clients.filter((c) => c.status === "perdido").length}`);
console.log(`Conversaciones: ${conversations.length} · eventos: ${events.length} · casos atascados: ${stuck.cases.length}`);
console.log(`Hoy: ${summary.attended} clientes atendidos · ${summary.ordersClosed} pedidos · ${formatEuro(summary.ordersAmount)} · autonomía ${(summary.autonomousRate * 100).toFixed(1)} %`);
console.log(`Recuperado este mes: ${formatEuro(summary.recoveredThisMonth)}`);
console.log(`Contactados: ${JSON.stringify(results.contacted)} · control: ${JSON.stringify(results.control)}`);
for (const m of monthly) console.log(`  ${m.month}: ventas ${formatEuro(m.recoveredSales)} · margen ${formatEuro(m.recoveredMargin)}`);
const monthRevenue = orders.filter((o) => o.date.startsWith("2026-08")).reduce((s, o) => s + o.total, 0);
const janRevenue = orders.filter((o) => o.date.startsWith("2026-01")).reduce((s, o) => s + o.total, 0);
console.log(`Facturación agosto 2026: ${formatEuro(monthRevenue, 0)} · enero 2026: ${formatEuro(janRevenue, 0)}`);
