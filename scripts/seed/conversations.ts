import type { Client, Conversation, Message, Order, OrderLine, RiskType } from "../../src/types";
import { formatEuro, weekdayName } from "../../src/lib/format";
import { brand } from "../../config/brand";
import type { Rng } from "./rng";

const company = brand.company.name;

export function addMinutes(dt: string, minutes: number): string {
  const [d, t] = dt.split("T");
  const [hh, mm] = t.split(":").map(Number);
  const total = hh * 60 + mm + Math.round(minutes);
  const h = Math.min(23, Math.floor(total / 60));
  const m = total % 60;
  return `${d}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

export function lineText(l: OrderLine): string {
  return `${l.qty} × ${l.name}`;
}

export function orderList(lines: OrderLine[], max = 6): string {
  const shown = lines.slice(0, max).map((l) => `– ${lineText(l)}`);
  if (lines.length > max) shown.push(`– y ${lines.length - max} productos más`);
  return shown.join("\n");
}

function deliveryDay(date: string): string {
  const d = new Date(date.slice(0, 10) + "T12:00:00");
  d.setDate(d.getDate() + (d.getDay() === 6 ? 2 : 1));
  return weekdayName(d.toISOString().slice(0, 10));
}

type Builder = { msgs: Message[]; t: string };

function say(b: Builder, from: Message["from"], text: string, gapMin: number, voiceSeconds?: number) {
  b.t = addMinutes(b.t, gapMin);
  b.msgs.push({ from, text, time: b.t, ...(voiceSeconds ? { voiceSeconds } : {}) });
}

const firstName = (c: Client) => c.contactName.split(" ")[0];

const yesReplies = [
  "si", "Sí, perfecto", "venga dale", "ok", "Así está bien, gracias", "si porfa", "vale",
  "Sí, lo de siempre", "perfecto", "Ok gracias", "dale", "si si", "Vale, ponlo",
];
const thanks = ["gracias", "perfecto gracias", "ok", "Gracias!", "vale", "genial", "Perfecto"];

/** Recordatorio de pedido habitual por WhatsApp que termina en pedido. */
export function routineWhatsapp(rng: Rng, client: Client, order: Order, start: string, id: string): Conversation {
  const b: Builder = { msgs: [], t: start };
  const lines = order.lines ?? [];
  const day = deliveryDay(order.date);
  const name = firstName(client);
  const opening = rng.pick([
    `Buenos días, ${name}. ¿Te preparo el pedido de esta semana? Lo habitual sería:\n${orderList(lines)}\n¿Lo dejo así?`,
    `Hola ${name}, buenos días. El ${day} pasa el camión por tu zona. ¿Te pongo lo de siempre?\n${orderList(lines)}`,
    `Buenas, ${name}. Para el reparto del ${day} tengo apuntado lo habitual:\n${orderList(lines)}\n¿Repetimos?`,
  ]);
  say(b, "agente", opening, 0);
  const variant = rng.weighted([
    ["yes", 55],
    ["change", 30],
    ["voice", 15],
  ] as const);
  let confirmText = "";
  if (variant === "yes") {
    say(b, "cliente", rng.pick(yesReplies), rng.int(3, 70));
    confirmText = `Hecho. Pedido registrado por ${formatEuro(order.total)}. Entrega el ${day} por la mañana.`;
  } else {
    const changed = lines[rng.int(0, Math.max(0, lines.length - 1))];
    const short = changed ? changed.name.split(" ").slice(0, 3).join(" ").toLowerCase() : "agua";
    if (variant === "change") {
      say(
        b,
        "cliente",
        rng.pick([
          `si pero pon una caja más de ${short}`,
          `Vale. El ${short} ponme ${(changed?.qty ?? 1) + 1} esta vez`,
          `si, añade ${short} que me quedé sin nada`,
          `Ok. Y súbeme el ${short}, que este finde hay fiesta en el pueblo`,
        ]),
        rng.int(4, 80),
      );
    } else {
      say(
        b,
        "cliente",
        rng.pick([
          `Oye, mira, ponme lo de siempre pero el ${short} ponme uno más, que el sábado tenemos una comunión. Venga, gracias.`,
          `Buenas, sí, lo de siempre. Y si puedes añade ${short}, que se me acabó ayer. Gracias, eh.`,
          `Hola, hola. Sí, mándamelo todo igual y una más de ${short}. Ah, y que vengan antes de las once si puede ser.`,
        ]),
        rng.int(4, 80),
        rng.int(8, 24),
      );
    }
    if (changed) changed.qty += 1;
    order.total = Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0) * 100) / 100;
    confirmText = `Apuntado. Te queda así:\n${orderList(lines)}\nTotal: ${formatEuro(order.total)}. Entrega el ${day} por la mañana.`;
  }
  say(b, "agente", confirmText, 1);
  if (rng.chance(0.55)) say(b, "cliente", rng.pick(thanks), rng.int(1, 30));
  return {
    id,
    clientId: client.id,
    channel: "whatsapp",
    purpose: "recordatorio",
    startedAt: start,
    outcome: "pedido_cerrado",
    summary: variant === "yes" ? "Pedido habitual confirmado" : "Pedido habitual con cambios",
    orderId: order.id,
    orderTotal: order.total,
    messages: b.msgs,
  };
}

/** Pedido habitual por llamada (clientes que prefieren hablar). */
export function routineCall(rng: Rng, client: Client, order: Order, start: string, id: string): Conversation {
  const b: Builder = { msgs: [], t: start };
  const lines = order.lines ?? [];
  const name = firstName(client);
  const day = deliveryDay(order.date);
  say(b, "agente", `Buenos días, ¿${name}? Le llamo de ${company} para el pedido del ${day}.`, 0);
  say(b, "cliente", rng.pick(["Sí, dime.", "Hola, sí, dime, que estoy con la cafetera.", "Ah, sí. Venga."]), 0);
  const names = lines.slice(0, 3).map((l) => l.name.split(" · ")[0].toLowerCase());
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names.at(-1)}` : names[0];
  say(b, "agente", `La última vez fueron ${lines.length} productos, entre ellos ${list}. ¿Lo repetimos igual?`, 0);
  say(b, "cliente", rng.pick([
    "Sí, igual. Bueno, espera… sí, igual.",
    "Igual, igual. Lo que pasa es que mañana no estoy, que lo dejen en el almacén.",
    "Sí, todo igual, ho.",
  ]), 1);
  say(b, "agente", `Perfecto. Queda registrado por ${formatEuro(order.total)} y le llega el ${day} por la mañana. Le mando el resumen por mensaje.`, 0);
  say(b, "cliente", rng.pick(["Vale, gracias.", "Venga, hasta luego.", "Muy bien, gracias, adiós."]), 0);
  return {
    id,
    clientId: client.id,
    channel: "llamada",
    purpose: "recordatorio",
    startedAt: start,
    durationSec: rng.int(55, 150),
    outcome: "pedido_cerrado",
    summary: "Pedido habitual por teléfono",
    orderId: order.id,
    orderTotal: order.total,
    messages: b.msgs,
  };
}

/** Recordatorio en el que el cliente dice que esta vez no necesita nada. */
export function routineNoOrder(rng: Rng, client: Client, start: string, id: string): Conversation {
  const b: Builder = { msgs: [], t: start };
  say(b, "agente", `Buenos días, ${firstName(client)}. ¿Te preparo el pedido de esta semana?`, 0);
  const reply = rng.pick([
    "esta semana nada, que tengo de sobra",
    "No, esta semana paso, que fue floja",
    "Nada, que cerramos el lunes por descanso. La que viene sí",
    "de momento no, ya te digo yo el jueves",
  ]);
  say(b, "cliente", reply, rng.int(5, 90));
  say(b, "agente", "Perfecto, sin problema. Te escribo la semana que viene. Si necesitas algo antes, me dices por aquí.", 1);
  return {
    id,
    clientId: client.id,
    channel: "whatsapp",
    purpose: "recordatorio",
    startedAt: start,
    outcome: "sin_pedido",
    summary: "No necesita pedido esta semana",
    messages: b.msgs,
  };
}

/** Recordatorio sin respuesta (o aún pendiente si es de hoy). */
export function routineNoReply(rng: Rng, client: Client, start: string, id: string, pending: boolean): Conversation {
  const b: Builder = { msgs: [], t: start };
  say(b, "agente", `Buenos días, ${firstName(client)}. ¿Te preparo el pedido de esta semana? Si es lo de siempre, contesta con un "sí" y lo dejo listo.`, 0);
  if (!pending) {
    say(b, "agente", "Te lo recuerdo por si se te pasó: el camión sale mañana a las 7:00. Si no me dices nada, esta semana no preparo pedido.", rng.int(180, 300));
  }
  return {
    id,
    clientId: client.id,
    channel: "whatsapp",
    purpose: "recordatorio",
    startedAt: start,
    outcome: pending ? "en_curso" : "sin_respuesta",
    summary: pending ? "Esperando respuesta al recordatorio" : "No ha contestado al recordatorio",
    messages: b.msgs,
  };
}

const riskOpeners: Record<RiskType, (c: Client, family: string, days: number) => string> = {
  retraso: (c, _f, days) =>
    `Hola ${firstName(c)}, te escribo de ${company}. Hace ${days} días que no nos pides y quería saber si va todo bien. ¿Te preparo algo para esta semana?`,
  caida_volumen: (c) =>
    `Hola ${firstName(c)}. Estas últimas semanas los pedidos vienen bastante más cortos de lo habitual. ¿Ha cambiado algo? Si te puedo ayudar en algo, dímelo.`,
  familia_abandonada: (c, family) =>
    `Hola ${firstName(c)}. He visto que hace unas semanas que no pides ${family.toLowerCase()}. ¿Lo estás comprando en otro sitio o ya no lo trabajas? Si es por algo nuestro, me gustaría saberlo.`,
  nuevo_sin_repetir: (c) =>
    `Hola ${firstName(c)}, soy el asistente de pedidos de ${company}. ¿Qué tal fue el primer pedido? Quería saber si te encajó todo y si te preparo el siguiente.`,
};

type RecoveryOutcome = "recuperado" | "sin_respuesta" | "en_curso" | "perdido";

/** Contacto a un cliente que se ha salido de su patrón. */
export function recoveryConversation(
  rng: Rng,
  client: Client,
  type: RiskType,
  outcome: RecoveryOutcome,
  familyName: string,
  daysSince: number,
  start: string,
  id: string,
  order?: Order,
): Conversation {
  const b: Builder = { msgs: [], t: start };
  const call = client.contactPreference === "llamada" && outcome !== "sin_respuesta";
  say(b, "agente", riskOpeners[type](client, familyName, daysSince), 0);
  let summary = "";
  if (outcome === "recuperado" && order) {
    const reason = rng.pick(
      {
        retraso: [
          "uy si, se me pasó con el lío de estas semanas. ponme lo de siempre",
          "Estuvimos cerrados por obras en la cocina. Abrimos el lunes, así que sí, mándame lo habitual",
          "Hola! Estuve de baja unos días y mi hermano no pidió nada. Sí, prepárame algo",
        ],
        caida_volumen: [
          "Bajó mucho la gente al acabar el verano, pero ya vuelve a moverse. Ponme lo normal esta semana",
          "Es que el precio de algunas cosas subió y estuve tirando de lo que tenía. Si me haces algo en el café, te pido lo de siempre",
        ],
        familia_abandonada: [
          `Lo cogí en el cash un par de veces porque me pillaba de paso. Pero mejor que me lo traigáis vosotros, ponme ${familyName.toLowerCase()} otra vez`,
          `Pues tenía stock de sobra. Ya me queda poco, añádelo al pedido`,
        ],
        nuevo_sin_repetir: [
          "Muy bien todo, lo que pasa es que aún me quedaba género. Ahora sí, prepárame otro igual",
          "Bien, bien. Mándame lo mismo y añade agua con gas",
        ],
      }[type],
    );
    say(b, "cliente", reason, rng.int(15, 200), rng.chance(0.25) ? rng.int(9, 26) : undefined);
    if (type === "caida_volumen" && reason.includes("café")) {
      say(b, "agente", "Puedo aplicarte un 4 % en el café en este pedido, que entra dentro de tus condiciones. ¿Te lo preparo así?", 1);
      say(b, "cliente", "venga", rng.int(2, 30));
    }
    say(
      b,
      "agente",
      call
        ? `Perfecto. Le preparo ${order.lines?.length ?? 0} productos por ${formatEuro(order.total)} y le llega mañana por la mañana. Le mando el resumen por mensaje.`
        : `Perfecto. Te queda así:\n${orderList(order.lines ?? [])}\nTotal: ${formatEuro(order.total)}. Te llega mañana por la mañana.`,
      1,
    );
    say(b, "cliente", rng.pick(thanks), rng.int(1, 20));
    summary = "Cliente recuperado con pedido";
  } else if (outcome === "perdido") {
    say(b, "cliente", rng.pick([
      "Gracias, pero ahora me lo trae otro distribuidor que me deja mejor precio",
      "Cerramos el negocio a final de mes, lo siento",
      "De momento no, que estoy probando con otra casa",
    ]), rng.int(30, 300));
    say(b, "agente", "Entendido, gracias por decírmelo. Si en algún momento cambia algo, aquí estamos.", 2);
    summary = "El cliente no quiere pedir";
  } else if (outcome === "en_curso") {
    say(b, "cliente", rng.pick([
      "Ahora no puedo, luego te digo",
      "Esta semana estoy liado, te escribo el viernes",
      "Déjame mirar el almacén y te digo",
    ]), rng.int(20, 200));
    say(b, "agente", "Perfecto, sin prisa. Te vuelvo a escribir mañana por si acaso.", 1);
    summary = "Pendiente de que el cliente confirme";
  } else {
    say(b, "agente", "Te dejo el mensaje por aquí. Si prefieres que te llame, dime a qué hora te viene bien.", rng.int(1200, 1600));
    summary = "Sin respuesta al contacto";
  }
  return {
    id,
    clientId: client.id,
    channel: call ? "llamada" : "whatsapp",
    purpose: "recuperacion",
    startedAt: start,
    ...(call ? { durationSec: rng.int(90, 260) } : {}),
    outcome:
      outcome === "recuperado" ? "pedido_cerrado" : outcome === "en_curso" ? "en_curso" : outcome === "perdido" ? "sin_pedido" : "sin_respuesta",
    summary,
    ...(order && outcome === "recuperado" ? { orderId: order.id, orderTotal: order.total } : {}),
    messages: b.msgs,
  };
}

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * Pasa una conversación de WhatsApp a correo: asunto, saludo y firma. No usa
 * el generador aleatorio, así que no altera el resto de los datos.
 */
export function toEmail(conv: Conversation, client: Client): Conversation {
  const name = firstName(client);
  const day = weekdayName(conv.startedAt.slice(0, 10));
  const subject = {
    recordatorio: `Pedido habitual · ${capitalize(day)}`,
    recuperacion: `${company} · ¿Va todo bien?`,
    incidencia: "Incidencia con tu pedido",
    seguimiento: "Tu pedido",
  }[conv.purpose];
  const shortReplies = ["Sí, adelante con el pedido.", "Perfecto, así está bien.", "De acuerdo, preparadlo como siempre."];
  const messages = conv.messages.map((m, i) => {
    if (m.from === "cliente") {
      let text = capitalize(m.text.trim());
      if (text.length < 30) {
        const prev = conv.messages[i - 1]?.text ?? "";
        text = /registrado|Total:/.test(prev) ? "Recibido, gracias." : shortReplies[Number(m.time.slice(15, 16)) % 3];
      }
      return { from: m.from, time: m.time, text: `${text}\n\n${name}` };
    }
    const body = m.text
      .replace(/^(Buenos días|Hola|Buenas),? ?([\wáéíóúñÁÉÍÓÚÑ]+)?[.,]? */, "")
      .replace(/^buenos días\. */i, "")
      .replace('contesta con un "sí"', "responde a este correo");
    return { from: m.from, time: m.time, text: `Hola, ${name}:\n\n${capitalize(body)}\n\nUn saludo,\nEquipo de pedidos de ${company}` };
  });
  return { ...conv, channel: "email", subject, durationSec: undefined, messages };
}
