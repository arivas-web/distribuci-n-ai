import type { CaseOption, Client, Conversation, Message, OrderLine, Product, RuleProposal, StuckCase } from "../../src/types";
import { formatDate, formatEuro } from "../../src/lib/format";
import { brand } from "../../config/brand";
import { featured } from "./catalog";
import { orderList } from "./conversations";

const company = brand.company.name;

export interface CaseInput {
  client: (id: string) => Client;
  product: (id: string) => Product;
  repName: (id: string) => string;
  familyName: (id: string) => string;
  /** Productos habituales del cliente con la cantidad habitual. */
  usual: (clientId: string) => { productId: string; qty: number }[];
  lastFamilyOrder: (clientId: string, familyId: string) => string | undefined;
  today: string;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function msgs(date: string, list: [Message["from"], string, string, number?][]): Message[] {
  return list.map(([from, time, text, voiceSeconds]) => ({
    from,
    time: `${date}T${time}:00`,
    text,
    ...(voiceSeconds ? { voiceSeconds } : {}),
  }));
}

export function buildStuckCases(input: CaseInput) {
  const { client, product, today } = input;
  const yesterday = (() => {
    const d = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const line = (productId: string, qty: number, price?: number): OrderLine => {
    const p = product(productId);
    return { productId, name: `${p.name} · ${p.format}`, qty, price: price ?? p.price };
  };
  const totalOf = (lines: OrderLine[]) => r2(lines.reduce((s, l) => s + l.qty * l.price, 0));
  const marginOf = (lines: OrderLine[]) =>
    r2(lines.reduce((s, l) => s + l.qty * (l.price - product(l.productId).cost), 0));
  const order = (lines: OrderLine[]) => ({ total: totalOf(lines), margin: marginOf(lines), lines });
  const usualLines = (clientId: string, exclude: string[] = []) =>
    input
      .usual(clientId)
      .filter((u) => !exclude.includes(product(u.productId).familyId) && !exclude.includes(u.productId))
      .map((u) => line(u.productId, u.qty));
  const pct = (o: { total: number; margin: number }) => `${(Math.round((o.margin / o.total) * 1000) / 10).toLocaleString("es-ES")} %`;

  const baseContext = (c: Client) => [
    { label: "Pide", value: `${c.cadenceDays === 7 ? "Cada semana" : "Cada 15 días"} · ${formatEuro(c.avgTicket, 0)} de media` },
    { label: "Último pedido", value: c.lastOrder ? formatDate(c.lastOrder) : "—" },
    { label: "Comercial", value: input.repName(c.repId) },
  ];

  const cases: StuckCase[] = [];
  const conversations: Conversation[] = [];

  // 1. Bar O Peirao · falta de permiso (historia guiada)
  {
    const c = client("c-peirao");
    const barril = product(featured.barrilPeirao);
    const price8 = r2(barril.price * 0.92);
    const price5 = r2(barril.price * 0.95);
    const rest = usualLines(c.id, ["barril"]);
    const o8 = order([line(barril.id, 2, price8), ...rest]);
    const o5 = order([line(barril.id, 2, price5), ...rest]);
    const lastBarril = input.lastFamilyOrder(c.id, "barril");
    const conv: Conversation = {
      id: "conv-peirao",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "recuperacion",
      startedAt: `${today}T10:14:00`,
      outcome: "escalado",
      summary: "Valora una oferta de la competencia en cerveza de barril",
      caseId: "case-peirao",
      messages: msgs(today, [
        ["agente", "10:14", `Hola, Manolo. Te escribo de ${company}. Hace 15 días que no nos pides y hace unas semanas que no te llevamos barril. ¿Va todo bien por el Peirao?`],
        ["cliente", "10:31", "Hola, sí, todo bien. Mira, te soy sincero: vino uno de otra distribuidora y me deja el barril de 30 a 96 euros, y encima me cambia el grifo gratis. Y claro, estoy probando. Lo demás os lo sigo pidiendo, pero esta semana no me hizo falta.", 21],
        ["agente", "10:32", "Gracias por contármelo, Manolo. Déjame ver qué puedo hacer con el precio del barril y te digo algo hoy mismo."],
        ["cliente", "10:40", "vale"],
      ]),
    };
    conversations.push(conv);
    const options: CaseOption[] = [
      {
        id: "a",
        label: "Ofrecer un 8 % en barril durante 3 meses",
        consequence: `Barril a ${formatEuro(price8)}. Margen del pedido ${pct(o8)}. Recupera unos ${formatEuro(c.risk?.monthlyAtStake ?? 0, 0)} al mes.`,
        resultingMargin: o8.margin / o8.total,
        recommended: true,
        ruleKey: "descuento-competencia-barril",
        followUp: {
          messages: [
            { from: "agente", text: `Manolo, te puedo dejar el barril de 30 L a ${formatEuro(price8)} durante los próximos tres meses, y el grifo te lo revisa nuestro técnico sin coste. ¿Te preparo el pedido de esta semana con los dos barriles de siempre?` },
            { from: "cliente", text: "Pues así sí. Venga, ponme dos barriles y lo de siempre" },
            { from: "agente", text: `Hecho. Te queda así:\n${orderList(o8.lines)}\nTotal: ${formatEuro(o8.total)}. Te llega mañana por la mañana.` },
            { from: "cliente", text: "gracias" },
          ],
          order: o8,
          outcome: "pedido_cerrado",
          confirmation: `Manolo ha aceptado. Pedido de ${formatEuro(o8.total)} cerrado.`,
        },
      },
      {
        id: "b",
        label: "Ofrecer solo el 5 % autorizado",
        consequence: `Barril a ${formatEuro(price5)}. Margen ${pct(o5)}. Es probable que no iguale la otra oferta.`,
        resultingMargin: o5.margin / o5.total,
        followUp: {
          messages: [
            { from: "agente", text: `Manolo, lo máximo que te puedo hacer es dejarte el barril a ${formatEuro(price5)}. ¿Te preparo los dos de siempre?` },
            { from: "cliente", text: "Uf, se queda lejos de lo otro. Déjame pensarlo" },
          ],
          outcome: "en_curso",
          confirmation: "El agente ha ofrecido el 5 %. Te avisará si Manolo contesta.",
        },
      },
      {
        id: "c",
        label: `Pasárselo a ${input.repName(c.repId)}`,
        consequence: "Lo visita el jueves en su ruta por Cangas. El agente deja de escribirle hasta entonces.",
        followUp: {
          messages: [{ from: "agente", text: "Manolo, el jueves pasa Xoán por Cangas y lo habláis en persona. Te parece bien sobre las 11?" }],
          outcome: "escalado",
          confirmation: "Caso asignado a Xoán Pereira para el jueves.",
        },
      },
    ];
    cases.push({
      id: "case-peirao",
      clientId: c.id,
      category: "permiso",
      atStake: c.risk?.monthlyAtStake ?? 0,
      atStakeLabel: "al mes",
      urgency: "alta",
      openedAt: `${today}T10:41:00`,
      trying: "Recuperar la cerveza de barril y el pedido semanal del Bar O Peirao.",
      blocked: "Para igualar la oferta de la competencia necesita un 8 % de descuento en barril y solo tiene permiso hasta el 5 %.",
      options,
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Cerveza de barril", value: lastBarril ? `Sin pedir desde el ${formatDate(lastBarril)}` : "Sin pedir", tone: "warning" },
        { label: "Facturas", value: "Al día" },
      ],
    });
  }

  // 2 y 3. Aceite de 5 L sin stock · falta de información (dos casos para la regla)
  const oilCase = (id: string, clientId: string, garrafas: number, time: string, urgency: StuckCase["urgency"], reply: string) => {
    const c = client(clientId);
    const aceite5 = product(featured.aceite5L);
    const aceite2 = product(featured.aceite2L);
    const suave = product(featured.aceiteSuave5L);
    const rest = usualLines(c.id, [aceite5.id, aceite2.id]);
    const perBottle = r2((aceite5.price / 5) * 2);
    const oA = order([...rest, line(aceite2.id, garrafas * 3, perBottle)]);
    const oB = order([...rest, line(suave.id, garrafas)]);
    const oC = order(rest);
    const conv: Conversation = {
      id: `conv-${id}`,
      clientId: c.id,
      channel: "whatsapp",
      purpose: "recordatorio",
      startedAt: `${today}T${time}:00`,
      outcome: "escalado",
      summary: "Pide aceite de 5 L, que está sin stock",
      caseId: `case-${id}`,
      messages: msgs(today, [
        ["agente", time, `Buenos días, ${c.contactName.split(" ")[0]}. ¿Te preparo el pedido de esta semana? Lo habitual sería:\n${orderList(rest, 5)}`],
        ["cliente", addTime(time, 22), reply],
        ["agente", addTime(time, 23), "Perfecto, lo miro y te confirmo en un momento."],
      ]),
    };
    conversations.push(conv);
    cases.push({
      id: `case-${id}`,
      clientId: c.id,
      category: "informacion",
      atStake: oA.total,
      atStakeLabel: "pedido de hoy",
      urgency,
      openedAt: `${today}T${addTime(time, 24)}:00`,
      trying: `Cerrar el pedido semanal de ${c.name} con ${garrafas} ${garrafas === 1 ? "garrafa" : "garrafas"} de aceite de oliva virgen extra de 5 L.`,
      blocked: "El aceite de 5 L está sin stock hasta el lunes y no sabe qué sustituto aceptaría.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Aceite virgen extra 5 L", value: "Sin stock · entra el lunes", tone: "warning" },
        { label: "Aceite virgen extra 2 L", value: `${aceite2.stock} unidades en almacén` },
      ],
      options: [
        {
          id: "a",
          label: `Sustituir cada garrafa por 3 botellas de 2 L`,
          consequence: `Mismo aceite y marca, al precio por litro de la garrafa. Margen del pedido ${pct(oA)}.`,
          resultingMargin: oA.margin / oA.total,
          recommended: true,
          ruleKey: "sustituir-aove-5l",
          followUp: {
            messages: [
              { from: "agente", text: `El aceite de 5 L no nos entra hasta el lunes. Te lo mando en botellas de 2 L de la misma marca, 3 por cada garrafa, al mismo precio por litro. ¿Te vale?` },
              { from: "cliente", text: "si perfecto, mientras sea el mismo" },
              { from: "agente", text: `Hecho. Pedido registrado por ${formatEuro(oA.total)}. Te llega mañana por la mañana.` },
            ],
            order: oA,
            outcome: "pedido_cerrado",
            confirmation: `Pedido de ${formatEuro(oA.total)} cerrado con el aceite en botellas de 2 L.`,
          },
        },
        {
          id: "b",
          label: "Ofrecer aceite de oliva suave de 5 L",
          consequence: `Más barato (${formatEuro(suave.price)}), pero no es virgen extra. Margen ${pct(oB)}.`,
          resultingMargin: oB.margin / oB.total,
          ruleKey: "sustituir-aove-suave",
          followUp: {
            messages: [
              { from: "agente", text: `El virgen extra de 5 L no nos entra hasta el lunes. Tengo aceite de oliva suave de 5 L a ${formatEuro(suave.price)}. ¿Te lo pongo en su lugar?` },
              { from: "cliente", text: "Para freír vale. Ponlo" },
            ],
            order: oB,
            outcome: "pedido_cerrado",
            confirmation: `Pedido de ${formatEuro(oB.total)} cerrado con aceite de oliva suave.`,
          },
        },
        {
          id: "c",
          label: "Enviar el resto y el aceite el lunes",
          consequence: "El pedido sale hoy sin aceite. Hay riesgo de que lo compre en el cash.",
          ruleKey: "esperar-aove",
          followUp: {
            messages: [
              { from: "agente", text: "El aceite de 5 L nos entra el lunes. Te mando hoy el resto del pedido y el aceite te llega el lunes a primera hora, ¿vale?" },
              { from: "cliente", text: "vale" },
            ],
            order: oC,
            outcome: "pedido_cerrado",
            confirmation: `Pedido de ${formatEuro(oC.total)} cerrado. El aceite sale el lunes.`,
          },
        },
      ],
    });
  };
  oilCase("lareira", "c-lareira", 3, "09:05", "alta", "Ponme lo de siempre y 3 garrafas de aceite del bueno, que se me está acabando");
  oilCase("alameda", "c-alameda", 1, "11:48", "media", "si y una garrafa de aceite de oliva");

  // 4. Taberna Os Arcos · poca confianza (nota de voz ambigua)
  {
    const c = client("c-osarcos");
    const ribeiro = product(featured.ribeiro);
    const albarino = product(featured.albarino);
    const godello = product("p-vinos-vina-mareira-3");
    const cafe = product(featured.cafeGrano);
    const base = [line(ribeiro.id, 2), line(cafe.id, 3)];
    const oA = order([line(ribeiro.id, 2), line(albarino.id, 1), line(cafe.id, 3)]);
    const oB = order([line(ribeiro.id, 2), line(godello.id, 1), line(cafe.id, 3)]);
    const conv: Conversation = {
      id: "conv-osarcos",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "recordatorio",
      startedAt: `${today}T08:32:00`,
      outcome: "escalado",
      summary: "Nota de voz con un vino que no queda claro",
      caseId: "case-osarcos",
      messages: msgs(today, [
        ["agente", "08:32", `Buenos días, Moncho. ¿Te preparo el pedido de esta semana? Lo habitual sería:\n${orderList(base)}`],
        ["cliente", "09:47", "Oye, ponme dos de las de siempre de blanco y una del otro, el que me trajiste la otra vez, el de la etiqueta azul, que les gustó mucho a los del jueves. Y lo del café igual.", 14],
        ["agente", "09:48", "Apuntado, Moncho. Te confirmo el pedido en un momento."],
      ]),
    };
    conversations.push(conv);
    cases.push({
      id: "case-osarcos",
      clientId: c.id,
      category: "confianza",
      atStake: oA.total,
      atStakeLabel: "pedido de hoy",
      urgency: "media",
      openedAt: `${today}T09:49:00`,
      trying: "Registrar el pedido de vino y café de Taberna Os Arcos.",
      blocked: "No está seguro de qué vino es «el de la etiqueta azul»: puede ser el albariño o el godello que probó en verano.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Albariño Pazo de Lusía", value: "Pedido 2 veces este verano" },
        { label: "Godello Viña Mareira", value: "Probado una vez, en junio" },
      ],
      options: [
        {
          id: "a",
          label: "Es el albariño Pazo de Lusía",
          consequence: `Lo ha pedido dos veces este verano. Pedido de ${formatEuro(oA.total)}, margen ${pct(oA)}.`,
          resultingMargin: oA.margin / oA.total,
          recommended: true,
          followUp: {
            messages: [
              { from: "agente", text: `Perfecto, Moncho. Te dejo 2 cajas de Ribeiro, 1 caja de Albariño Pazo de Lusía y el café de siempre. Total: ${formatEuro(oA.total)}. Si el de la etiqueta azul era otro, dímelo y lo cambio.` },
              { from: "cliente", text: "ese ese, gracias" },
            ],
            order: oA,
            outcome: "pedido_cerrado",
            confirmation: `Pedido de ${formatEuro(oA.total)} cerrado con el albariño.`,
          },
        },
        {
          id: "b",
          label: "Es el godello Viña Mareira",
          consequence: `Lo probó una vez en junio. Pedido de ${formatEuro(oB.total)}, margen ${pct(oB)}.`,
          resultingMargin: oB.margin / oB.total,
          followUp: {
            messages: [
              { from: "agente", text: `Perfecto, Moncho. Te dejo 2 cajas de Ribeiro, 1 caja de Godello Viña Mareira y el café de siempre. Total: ${formatEuro(oB.total)}.` },
              { from: "cliente", text: "no no, el otro, el albariño" },
              { from: "agente", text: "Corregido: 1 caja de Albariño Pazo de Lusía en lugar del godello. Gracias por avisar." },
            ],
            order: oA,
            outcome: "pedido_cerrado",
            confirmation: "Pedido cerrado. El cliente corrigió el vino: era el albariño.",
          },
        },
        {
          id: "c",
          label: "Que le pregunte al cliente con foto",
          consequence: "Le manda una foto de las dos etiquetas para que elija. El pedido sigue a tiempo si contesta antes de las 18:00.",
          followUp: {
            messages: [
              { from: "agente", text: "Moncho, para no equivocarme: ¿el de la etiqueta azul es el albariño Pazo de Lusía o el godello Viña Mareira? Te mando foto de los dos." },
            ],
            outcome: "en_curso",
            confirmation: "El agente ha preguntado al cliente. El pedido sigue a tiempo para mañana.",
          },
        },
      ],
    });
  }

  // 5. Supermercado Ríos · riesgo (facturas pendientes)
  {
    const c = client("c-rios");
    const big = r2(c.avgTicket * 1.9);
    const conv: Conversation = {
      id: "conv-rios",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "recordatorio",
      startedAt: `${today}T08:10:00`,
      outcome: "escalado",
      summary: "Pedido de campaña con facturas vencidas",
      caseId: "case-rios",
      messages: msgs(today, [
        ["agente", "08:10", "Buenos días, Roberto. ¿Te preparo el pedido de esta semana?"],
        ["cliente", "08:55", "Buenas. Esta semana ponme el doble de todo, que empezamos la campaña de octubre con las ofertas. Y añade 20 cajas más de agua."],
        ["agente", "08:56", `Perfecto. Te preparo la propuesta, serían unos ${formatEuro(big, 0)}. Te confirmo en un rato.`],
      ]),
    };
    conversations.push(conv);
    cases.push({
      id: "case-rios",
      clientId: c.id,
      category: "riesgo",
      atStake: big,
      atStakeLabel: "pedido de hoy",
      urgency: "alta",
      openedAt: `${today}T08:57:00`,
      trying: `Cerrar un pedido de ${formatEuro(big, 0)} del Supermercado Ríos para su campaña de octubre.`,
      blocked: "Tiene 3 facturas vencidas por 2.380 € y el pedido casi duplica lo habitual.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Facturas vencidas", value: "3 · 2.380 € (de julio y agosto)", tone: "risk" },
        { label: "Límite de crédito", value: "4.000 €" },
      ],
      options: [
        {
          id: "a",
          label: "Servir cuando pague las facturas vencidas",
          consequence: "Le envía el enlace de pago y el pedido sale en cuanto entre. Riesgo pendiente: 0 €.",
          recommended: true,
          ruleKey: "facturas-vencidas-pago-previo",
          followUp: {
            messages: [
              { from: "agente", text: "Roberto, antes de preparar el pedido de campaña tenemos pendientes tres facturas de julio y agosto por 2.380 €. Te dejo aquí el enlace para pagarlas y, en cuanto entre el pago, lo preparamos todo para que te llegue el viernes." },
              { from: "cliente", text: "Vale, se lo paso a Lidia que lleva eso. Hoy mismo queda pagado" },
            ],
            outcome: "en_curso",
            confirmation: "Le ha enviado el enlace de pago. El pedido saldrá cuando entre el pago.",
          },
        },
        {
          id: "b",
          label: "Servir la mitad ahora y el resto al pagar",
          consequence: `Pedido de ${formatEuro(big / 2, 0)} hoy. Riesgo total: ${formatEuro(2380 + big / 2, 0)}.`,
          followUp: {
            messages: [
              { from: "agente", text: `Roberto, te mando hoy la mitad del pedido (${formatEuro(big / 2, 0)}) y el resto en cuanto estén pagadas las tres facturas pendientes de julio y agosto. Te dejo el enlace de pago.` },
              { from: "cliente", text: "ok, mándame eso de momento" },
            ],
            outcome: "pedido_cerrado",
            order: { total: r2(big / 2), margin: r2((big / 2) * 0.21), lines: [] },
            confirmation: `Pedido de ${formatEuro(big / 2, 0)} cerrado. El resto, al pagar.`,
          },
        },
        {
          id: "c",
          label: "Servirlo todo y avisar a administración",
          consequence: `Riesgo total: ${formatEuro(2380 + big, 0)}. Supera su límite de crédito de 4.000 €.`,
          followUp: {
            messages: [{ from: "agente", text: `Hecho, Roberto. Pedido de campaña registrado por ${formatEuro(big)}. Te llega el viernes.` }],
            outcome: "pedido_cerrado",
            order: { total: big, margin: r2(big * 0.21), lines: [] },
            confirmation: "Pedido cerrado. Administración ha recibido el aviso del riesgo.",
          },
        },
      ],
    });
  }

  // 6. Pub Vértigo · riesgo (pedido anormal)
  {
    const c = client("c-vertigo");
    const amount = r2(c.avgTicket * 4.1);
    const conv: Conversation = {
      id: "conv-vertigo",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "seguimiento",
      startedAt: `${today}T03:12:00`,
      outcome: "escalado",
      summary: "Pedido cuatro veces mayor de lo habitual",
      caseId: "case-vertigo",
      messages: msgs(today, [
        ["cliente", "03:12", "ponme 24 de ginebra 24 de ron 12 whisky y 10 cajas de tonica para el sabado"],
        ["agente", "07:30", "Buenos días, Iago. Recibido. Es bastante más de lo habitual: ¿es para el pub o para algún evento? Lo pregunto para asegurarme de que no hay ningún error."],
      ]),
    };
    conversations.push(conv);
    cases.push({
      id: "case-vertigo",
      clientId: c.id,
      category: "riesgo",
      atStake: amount,
      atStakeLabel: "pedido",
      urgency: "media",
      openedAt: `${today}T11:30:00`,
      trying: "Confirmar un pedido de licores para el sábado.",
      blocked: "El pedido es 4 veces mayor de lo habitual, llega de madrugada y el cliente no ha contestado a la pregunta.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Este pedido", value: `${formatEuro(amount, 0)} · 4,1 veces lo habitual`, tone: "warning" },
        { label: "Facturas", value: "Al día" },
      ],
      options: [
        {
          id: "a",
          label: "Llamar para confirmar antes de servir",
          consequence: "Le llama hoy a las 17:00, cuando abre el local. El pedido sigue a tiempo para el sábado.",
          recommended: true,
          followUp: {
            messages: [{ from: "agente", text: "Iago, te llamo esta tarde sobre las 17:00 para confirmar el pedido del sábado y que no haya ningún error." }],
            outcome: "en_curso",
            confirmation: "El agente llamará a las 17:00 y te avisará si hay algo raro.",
          },
        },
        {
          id: "b",
          label: "Servirlo tal cual",
          consequence: `${formatEuro(amount, 0)} con margen del 25,4 %. Si es un error, la devolución cuesta unos 60 €.`,
          followUp: {
            messages: [{ from: "agente", text: `Hecho, Iago. Pedido registrado por ${formatEuro(amount)}. Te llega el viernes por la tarde para el sábado.` }],
            outcome: "pedido_cerrado",
            order: { total: amount, margin: r2(amount * 0.254), lines: [] },
            confirmation: `Pedido de ${formatEuro(amount, 0)} cerrado.`,
          },
        },
        {
          id: "c",
          label: "Servir lo habitual y preguntar por el resto",
          consequence: `Sale un pedido de ${formatEuro(c.avgTicket, 0)} y el agente pregunta por el resto.`,
          followUp: {
            messages: [{ from: "agente", text: "Iago, de momento te preparo lo habitual para el viernes. El resto lo dejo apartado: confírmame cuando puedas y lo añado." }],
            outcome: "pedido_cerrado",
            order: { total: c.avgTicket, margin: r2(c.avgTicket * 0.25), lines: [] },
            confirmation: "Pedido habitual cerrado. El resto queda apartado.",
          },
        },
      ],
    });
  }

  // 7. Cafetería Brais · riesgo (posible fuga a la competencia)
  {
    const c = client("c-brais");
    const lastCafe = input.lastFamilyOrder(c.id, "cafe");
    const conv: Conversation = {
      id: "conv-brais",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "recuperacion",
      startedAt: `${yesterday}T16:20:00`,
      outcome: "escalado",
      summary: "Le ofrecen una cafetera gratis si cambia de proveedor de café",
      caseId: "case-brais",
      messages: msgs(yesterday, [
        ["agente", "16:20", "Hola, Brais. He visto que hace unas semanas que no pides café. ¿Lo estás comprando en otro sitio o ha pasado algo? Si es por algo nuestro, me gustaría saberlo."],
        ["cliente", "18:02", "Hola. Nada vuestro, el café va bien. Es que me ofrecieron cambiarme la cafetera gratis si me paso a su café, y la mía ya va muy justa. Lo estoy probando este mes."],
        ["agente", "18:03", "Entiendo. Déjame ver qué opciones tenemos y te digo algo mañana."],
      ]),
    };
    conversations.push(conv);
    cases.push({
      id: "case-brais",
      clientId: c.id,
      category: "riesgo",
      atStake: 340,
      atStakeLabel: "al mes en café",
      urgency: "media",
      openedAt: `${yesterday}T18:04:00`,
      trying: "Que Cafetería Brais vuelva a comprarnos el café.",
      blocked: "Valora otra oferta con cafetera gratis y el agente no puede ofrecer maquinaria.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Café", value: lastCafe ? `Sin pedir desde el ${formatDate(lastCafe)}` : "Sin pedir", tone: "warning" },
        { label: "Cafetera en préstamo", value: "Quedan 3 en almacén" },
      ],
      options: [
        {
          id: "a",
          label: "Ofrecer cafetera en préstamo con 8 kg al mes",
          consequence: "La máquina se amortiza en 14 meses. Margen del café 31 %.",
          resultingMargin: 0.31,
          recommended: true,
          followUp: {
            messages: [
              { from: "agente", text: "Brais, te podemos dejar una cafetera nueva en préstamo, sin coste, con un consumo mínimo de 8 kg de café al mes, que es lo que gastas normalmente. Nuestro técnico te la instala esta semana. ¿Te interesa?" },
              { from: "cliente", text: "Ah pues sí, así me quedo con vosotros. ¿Puede venir el viernes?" },
              { from: "agente", text: "Apuntado para el viernes por la mañana. Te preparo también 8 kg de café para ese día." },
            ],
            outcome: "pedido_cerrado",
            order: { total: 141.6, margin: 43.9, lines: [] },
            confirmation: "Brais se queda. Cafetera y café para el viernes.",
          },
        },
        {
          id: "b",
          label: "Que le visite Marta Iglesias esta semana",
          consequence: "Marta tiene hueco el jueves por la tarde. El agente se lo propone al cliente.",
          followUp: {
            messages: [{ from: "agente", text: "Brais, Marta, tu comercial, puede pasar el jueves por la tarde para verlo contigo. ¿Te viene bien sobre las cinco?" }],
            outcome: "escalado",
            confirmation: "Visita propuesta a Marta Iglesias para el jueves.",
          },
        },
        {
          id: "c",
          label: "Ofrecer un 5 % en café, dentro de margen",
          consequence: "Margen del café 29,2 %. Probablemente no compense una cafetera gratis.",
          resultingMargin: 0.292,
          followUp: {
            messages: [
              { from: "agente", text: "Brais, te puedo hacer un 5 % en el café a partir de ahora. ¿Te preparo el pedido de esta semana?" },
              { from: "cliente", text: "Gracias, pero lo de la cafetera me soluciona más. Ya te digo" },
            ],
            outcome: "en_curso",
            confirmation: "Oferta enviada. Te avisará si responde.",
          },
        },
      ],
    });
  }

  // 8. Restaurante O Fogón · necesita una persona (queja)
  {
    const c = client("c-fogon");
    const conv: Conversation = {
      id: "conv-fogon",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "incidencia",
      startedAt: `${today}T09:12:00`,
      outcome: "escalado",
      summary: "Queja por una entrega tarde y dos botellas rotas",
      caseId: "case-fogon",
      messages: msgs(today, [
        ["cliente", "09:12", "Buenos días. Ayer el pedido llegó a la una y media cuando os he dicho mil veces que antes de las once. Y encima dos botellas de albariño rotas. Así no se puede trabajar. Quiero hablar con una persona, no con un sistema automático."],
        ["agente", "09:13", "Lo siento mucho, Rosa. Tienes razón en que así no puede ser. Ahora mismo se lo paso a una persona del equipo para que te llame hoy."],
        ["cliente", "09:15", "eso espero"],
      ]),
    };
    conversations.push(conv);
    const abono = r2(product(featured.albarino).price / 3);
    cases.push({
      id: "case-fogon",
      clientId: c.id,
      category: "persona",
      atStake: c.monthlyRevenue,
      atStakeLabel: "al mes",
      urgency: "alta",
      openedAt: `${today}T09:13:00`,
      trying: "Resolver la queja de O Fogón por la entrega de ayer.",
      blocked: "La clienta está molesta y pide hablar con una persona.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Entrega de ayer", value: "Llegó a las 13:34 · ventana 9:00–11:00", tone: "warning" },
        { label: "Incidencias este año", value: "2 (marzo y julio)" },
      ],
      options: [
        {
          id: "a",
          label: "La llamo yo ahora",
          consequence: "Te dejamos su teléfono y el resumen. El caso queda como atendido por ti.",
          recommended: true,
          followUp: {
            messages: [{ from: "equipo", text: `Rosa, soy ${brand.user.name}, directora comercial. Te llamo ahora mismo.` }],
            outcome: "escalado",
            confirmation: `Llama a Rosa al ${c.phone}.`,
          },
        },
        {
          id: "b",
          label: `Abonar las botellas (${formatEuro(abono * 2)}) y que se disculpe el agente`,
          consequence: "El agente envía el abono y una disculpa. Puede no ser suficiente: ha pedido hablar con alguien.",
          followUp: {
            messages: [
              { from: "agente", text: `Rosa, te abonamos las dos botellas (${formatEuro(abono * 2)}) en la próxima factura y he pedido a reparto que tu entrega sea la primera de la ruta. De nuevo, disculpa.` },
              { from: "cliente", text: "Bueno. Que no vuelva a pasar" },
            ],
            outcome: "sin_pedido",
            confirmation: "Abono enviado. Entrega de O Fogón marcada como prioritaria.",
          },
        },
        {
          id: "c",
          label: `Que la llame ${input.repName(c.repId)} hoy`,
          consequence: "Xoán está hoy en ruta por Pontevedra y puede pasar a las 17:00.",
          followUp: {
            messages: [{ from: "agente", text: "Rosa, Xoán Pereira, tu comercial, te llama en un rato y si te viene bien pasa por el restaurante a las 17:00." }],
            outcome: "escalado",
            confirmation: "Caso asignado a Xoán Pereira.",
          },
        },
      ],
    });
  }

  // 9. Hotel Bahía · falta de permiso (condiciones de pago)
  {
    const c = client("c-bahia");
    const amount = r2(c.avgTicket * 1.15);
    const conv: Conversation = {
      id: "conv-bahia",
      clientId: c.id,
      channel: "whatsapp",
      purpose: "recordatorio",
      startedAt: `${today}T10:02:00`,
      outcome: "escalado",
      summary: "Pide pagar a 60 días a final de temporada",
      caseId: "case-bahia",
      messages: msgs(today, [
        ["agente", "10:02", "Buenos días, Beatriz. ¿Te preparo el pedido de esta semana?"],
        ["cliente", "10:40", "Hola. Sí, lo de siempre. Una cosa: con el cierre de temporada vamos justos de caja. ¿Este pedido me lo podéis pasar a 60 días en vez de a 30?"],
        ["agente", "10:41", "Lo consulto y te digo enseguida."],
      ]),
    };
    conversations.push(conv);
    cases.push({
      id: "case-bahia",
      clientId: c.id,
      category: "permiso",
      atStake: amount,
      atStakeLabel: "pedido de hoy",
      urgency: "baja",
      openedAt: `${today}T10:41:00`,
      trying: `Cerrar el pedido semanal del Hotel Bahía (${formatEuro(amount, 0)}).`,
      blocked: "Pide pagar a 60 días en lugar de a 30 y el agente no puede cambiar las condiciones de pago.",
      conversationId: conv.id,
      context: [
        ...baseContext(c),
        { label: "Cliente desde", value: formatDate(c.since) },
        { label: "Impagos", value: "Ninguno" },
      ],
      options: [
        {
          id: "a",
          label: "Aceptar 60 días solo en este pedido",
          consequence: "Cliente de muchos años y sin impagos. Coste financiero estimado: 7 €.",
          recommended: true,
          ruleKey: "pago-60-fin-temporada",
          followUp: {
            messages: [
              { from: "agente", text: "Beatriz, sin problema: este pedido te lo pasamos a 60 días. Te llega mañana por la mañana." },
              { from: "cliente", text: "Mil gracias!" },
            ],
            outcome: "pedido_cerrado",
            order: { total: amount, margin: r2(amount * 0.255), lines: [] },
            confirmation: `Pedido de ${formatEuro(amount, 0)} cerrado a 60 días.`,
          },
        },
        {
          id: "b",
          label: "Proponer 45 días",
          consequence: "Punto intermedio. El agente lo propone y espera respuesta.",
          followUp: {
            messages: [{ from: "agente", text: "Beatriz, te lo podemos dejar a 45 días. ¿Te sirve así?" }],
            outcome: "en_curso",
            confirmation: "Propuesta de 45 días enviada.",
          },
        },
        {
          id: "c",
          label: "Mantener 30 días",
          consequence: "Puede que reduzca el pedido: el año pasado pidió un 20 % menos en octubre.",
          followUp: {
            messages: [
              { from: "agente", text: "Beatriz, de momento no podemos cambiar el plazo de este pedido. ¿Te lo preparo igualmente a 30 días?" },
              { from: "cliente", text: "Vale, pero entonces ponme solo la mitad" },
            ],
            outcome: "pedido_cerrado",
            order: { total: r2(amount / 2), margin: r2((amount / 2) * 0.255), lines: [] },
            confirmation: `Pedido de ${formatEuro(amount / 2, 0)} cerrado a 30 días.`,
          },
        },
      ],
    });
  }

  const ruleProposals: RuleProposal[] = [
    {
      ruleKey: "sustituir-aove-5l",
      actionId: "sustituir",
      text: "Has aprobado 2 veces sustituir el aceite de 5 L por el de 3 × 2 L cuando no hay stock. ¿Lo hago yo solo a partir de ahora?",
    },
    {
      ruleKey: "sustituir-aove-suave",
      actionId: "sustituir",
      text: "Has aprobado 2 veces ofrecer aceite de oliva suave cuando no hay virgen extra de 5 L. ¿Lo hago yo solo a partir de ahora?",
    },
    {
      ruleKey: "esperar-aove",
      actionId: "sustituir",
      text: "Has decidido 2 veces enviar el pedido sin aceite y mandarlo con la reposición. ¿Lo hago yo solo a partir de ahora?",
    },
  ];

  return { cases, conversations, ruleProposals };
}

function addTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
