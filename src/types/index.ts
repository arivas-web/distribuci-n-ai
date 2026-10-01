/**
 * Modelo de datos compartido entre el script de semilla y la aplicación.
 * Cuando se conecte una fuente real (ERP, CRM, canal de WhatsApp), basta con
 * producir objetos con esta misma forma desde `src/lib/data`.
 */

export type ISODate = string; // "2026-09-30"
export type ISODateTime = string; // "2026-09-30T12:40:00"

export type BusinessType =
  | "bar"
  | "cafeteria"
  | "restaurante"
  | "hotel"
  | "pub"
  | "tienda"
  | "supermercado"
  | "panaderia"
  | "ferreteria";

export type ClientStatus = "estable" | "en_riesgo" | "recuperado" | "perdido";

export type RiskType =
  | "retraso"
  | "caida_volumen"
  | "familia_abandonada"
  | "nuevo_sin_repetir";

export interface SalesRep {
  id: string;
  name: string;
  zones: string[];
}

export interface Zone {
  id: string;
  name: string;
  coastal: boolean;
}

export interface Family {
  id: string;
  name: string;
  /** Margen bruto medio de la familia (0–1). */
  margin: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  familyId: string;
  format: string;
  price: number;
  cost: number;
  stock: number;
}

export interface RiskInfo {
  type: RiskType;
  since: ISODate;
  /** Frase corta que explica la desviación. */
  summary: string;
  /** Familia afectada, cuando aplica. */
  familyId?: string;
  /** Euros al mes que se dejan de facturar si no se recupera. */
  monthlyAtStake: number;
}

export interface Client {
  id: string;
  name: string;
  type: BusinessType;
  zoneId: string;
  repId: string;
  contactName: string;
  phone: string;
  address: string;
  since: ISODate;
  /** Días entre pedidos en su patrón habitual. */
  cadenceDays: number;
  /** Ticket medio de su patrón habitual. */
  avgTicket: number;
  /** Familias que compra de forma habitual. */
  families: string[];
  status: ClientStatus;
  /** Si el cliente pertenece al grupo de control (no se contacta). */
  controlGroup: boolean;
  /** Canal preferido para hablar con el agente. */
  contactPreference: Channel;
  /** El agente gestiona sus pedidos habituales. */
  agentManaged: boolean;
  risk?: RiskInfo;
  /** Fecha en la que el agente lo recuperó, si aplica. */
  recoveredAt?: ISODate;
  lastOrder?: ISODate;
  /** Facturación media mensual de los últimos 3 meses. */
  monthlyRevenue: number;
}

export type OrderChannel = "agente" | "comercial" | "web" | "telefono";

export interface OrderLine {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

/** Pedido compacto: el detalle por línea solo se guarda en pedidos del agente. */
export interface Order {
  id: string;
  clientId: string;
  date: ISODate;
  total: number;
  margin: number;
  channel: OrderChannel;
  /** Importe por familia. */
  byFamily: Record<string, number>;
  /** Hora en la que el agente cerró el pedido (pedidos recientes). */
  time?: ISODateTime;
  /** Parte del pedido atribuible a una recuperación del agente. */
  recoveredAmount?: number;
  lines?: OrderLine[];
}

export type Channel = "whatsapp" | "llamada";

export type ConversationOutcome =
  | "pedido_cerrado"
  | "sin_respuesta"
  | "escalado"
  | "sin_pedido"
  | "en_curso";

export type ConversationPurpose =
  | "recordatorio"
  | "recuperacion"
  | "incidencia"
  | "seguimiento";

export interface Message {
  from: "agente" | "cliente" | "equipo";
  text: string;
  time: ISODateTime;
  /** Nota de voz transcrita: duración en segundos. */
  voiceSeconds?: number;
}

export interface Conversation {
  id: string;
  clientId: string;
  channel: Channel;
  purpose: ConversationPurpose;
  startedAt: ISODateTime;
  /** Duración en segundos (llamadas). */
  durationSec?: number;
  outcome: ConversationOutcome;
  /** Resumen de una línea. */
  summary: string;
  orderId?: string;
  orderTotal?: number;
  messages: Message[];
  caseId?: string;
}

export type ActivityType =
  | "recordatorio"
  | "pedido_cerrado"
  | "llamada"
  | "contacto_riesgo"
  | "sin_respuesta"
  | "escalado"
  | "resuelto_equipo"
  | "aviso_entrega"
  | "erp";

export interface ActivityEvent {
  id: string;
  time: ISODateTime;
  type: ActivityType;
  clientId: string;
  text: string;
  amount?: number;
  conversationId?: string;
  caseId?: string;
  /** Eventos agrupados (por ejemplo, avisos de entrega). */
  clientIds?: string[];
}

export type CaseCategory = "permiso" | "informacion" | "confianza" | "riesgo" | "persona";
export type Urgency = "alta" | "media" | "baja";

export interface CaseOption {
  id: string;
  label: string;
  consequence: string;
  /** Margen resultante en %, cuando aplica. */
  resultingMargin?: number;
  recommended?: boolean;
  /** Decisiones con la misma clave pueden convertirse en una regla. */
  ruleKey?: string;
  /** Lo que ocurre tras elegir la opción (se simula en la demo). */
  followUp?: {
    messages: Omit<Message, "time">[];
    order?: { total: number; margin: number; lines: OrderLine[] };
    outcome: ConversationOutcome;
    confirmation: string;
  };
}

export interface StuckCase {
  id: string;
  clientId: string;
  category: CaseCategory;
  atStake: number;
  atStakeLabel: string;
  urgency: Urgency;
  openedAt: ISODateTime;
  trying: string;
  blocked: string;
  options: CaseOption[];
  conversationId: string;
  /** Datos de contexto adicionales para decidir. */
  context: { label: string; value: string; tone?: "neutral" | "warning" | "risk" }[];
}

export interface RuleProposal {
  ruleKey: string;
  text: string;
  actionId: string;
}

export type AutonomyLevel = "observa" | "propone" | "actua_avisa" | "autonomo";

export interface AutonomyAction {
  id: string;
  name: string;
  description: string;
  level: AutonomyLevel;
  accuracy: number;
  cases: number;
}

export interface LearnedRule {
  id: string;
  text: string;
  origin: string;
  createdAt: ISODate;
  applied: number;
  active: boolean;
  actionId: string;
}

export interface MonthlyResult {
  month: string; // "2026-04"
  recoveredSales: number;
  recoveredMargin: number;
  contactedAtRisk: number;
  contactedRecovered: number;
  controlAtRisk: number;
  controlRecovered: number;
}

export interface TodaySummary {
  attended: number;
  ordersClosed: number;
  ordersAmount: number;
  autonomousRate: number;
  recoveredThisMonth: number;
}
