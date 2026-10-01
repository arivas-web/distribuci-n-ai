import type { ActivityEvent, Conversation, Message } from "@/types";
import type { ClientLite } from "@/lib/data/types";
import { createRng } from "@/lib/rng";
import { formatEuro } from "@/lib/format";

/** Suma minutos a una fecha-hora local "aaaa-mm-ddThh:mm:ss". */
export function addMinutes(dt: string, minutes: number): string {
  const [d, t] = dt.split("T");
  const [hh, mm] = t.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, hh * 60 + mm + Math.round(minutes));
  return `${d}T${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00`;
}

const products = [
  "Cerveza lager especial Cíes · Barril 30 L",
  "Agua mineral Fonte Clara · Caja 24 × 50 cl",
  "Refresco de cola Fresca · Caja 24 × 20 cl",
  "Café en grano mezcla 80/20 Café Atlántida · Bolsa 1 kg",
  "Albariño Pazo de Lusía · Caja 6 × 75 cl",
  "Tónica Nébora · Caja 24 × 20 cl",
  "Aceite de girasol Olivar del Sur · Garrafa 5 L",
  "Lavavajillas máquina industrial Brillo Pro · Garrafa 20 L",
  "Cerveza lager especial Ons · Caja 24 × 1/3",
  "Servilletas 30×30 Hostel Clean · Caja 3.000 uds",
];

const replies = ["si", "venga dale", "Sí, lo de siempre", "ok perfecto", "si porfa", "vale, ponlo"];

/**
 * Genera un evento simulado para el modo demo. Usa una semilla por número de
 * evento para que la secuencia sea siempre la misma.
 */
export function liveTick(
  n: number,
  now: string,
  clients: ClientLite[],
): { event: ActivityEvent; conversation: Conversation; orderAmount?: number } {
  const rng = createRng(9000 + n * 7919);
  const pool = clients.filter((c) => c.status === "estable" || c.status === "recuperado");
  const c = pool[Math.floor(rng.next() * pool.length)];
  const first = c.contactName.split(" ")[0];
  const kind = rng.weighted([
    ["pedido", 55],
    ["recordatorio", 30],
    ["riesgo", 15],
  ] as const);
  const id = `live-${n}`;
  const t0 = now;
  const msgs: Message[] = [];
  let event: ActivityEvent;
  let orderAmount: number | undefined;
  let conversation: Conversation;

  if (kind === "pedido") {
    const lines = rng
      .shuffle(products)
      .slice(0, rng.int(3, 6))
      .map((p) => `– ${rng.int(1, 4)} × ${p}`);
    orderAmount = Math.round(c.avgTicket * rng.float(0.8, 1.2) * 100) / 100;
    msgs.push({ from: "agente", time: addMinutes(t0, -14), text: `Buenos días, ${first}. ¿Te preparo el pedido de esta semana? Lo habitual sería:\n${lines.join("\n")}` });
    msgs.push({ from: "cliente", time: addMinutes(t0, -1), text: rng.pick(replies) });
    msgs.push({ from: "agente", time: t0, text: `Hecho. Pedido registrado por ${formatEuro(orderAmount)}. Entrega mañana por la mañana.` });
    conversation = { id, clientId: c.id, channel: "whatsapp", purpose: "recordatorio", startedAt: msgs[0].time, outcome: "pedido_cerrado", summary: "Pedido habitual confirmado", orderTotal: orderAmount, messages: msgs };
    event = { id, time: t0, type: "pedido_cerrado", clientId: c.id, text: `Pedido cerrado y registrado en el ERP · ${lines.length} productos`, amount: orderAmount, conversationId: id };
  } else if (kind === "recordatorio") {
    msgs.push({ from: "agente", time: t0, text: `Buenas, ${first}. ¿Te preparo el pedido de esta semana? Si es lo de siempre, contesta con un "sí" y lo dejo listo.` });
    conversation = { id, clientId: c.id, channel: "whatsapp", purpose: "recordatorio", startedAt: t0, outcome: "en_curso", summary: "Esperando respuesta al recordatorio", messages: msgs };
    event = { id, time: t0, type: "recordatorio", clientId: c.id, text: "Recordatorio enviado · esperando respuesta", conversationId: id };
  } else {
    msgs.push({ from: "agente", time: t0, text: `Hola, ${first}. Esta semana no nos has pedido y quería saber si va todo bien. ¿Te preparo algo para el viernes?` });
    conversation = { id, clientId: c.id, channel: "whatsapp", purpose: "recuperacion", startedAt: t0, outcome: "en_curso", summary: "Contacto por retraso en el pedido", messages: msgs };
    event = { id, time: t0, type: "contacto_riesgo", clientId: c.id, text: "Contacto: se está retrasando", conversationId: id };
  }
  return { event, conversation, orderAmount };
}
