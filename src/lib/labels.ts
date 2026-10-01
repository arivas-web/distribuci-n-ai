import type {
  ActivityType,
  AutonomyLevel,
  BusinessType,
  CaseCategory,
  ClientStatus,
  ConversationOutcome,
  RiskType,
  Urgency,
} from "@/types";

export const businessTypeLabel: Record<BusinessType, string> = {
  bar: "Bar",
  cafeteria: "Cafetería",
  restaurante: "Restaurante",
  hotel: "Hotel",
  pub: "Pub",
  tienda: "Tienda de alimentación",
  supermercado: "Supermercado",
  panaderia: "Panadería",
  ferreteria: "Ferretería y droguería",
};

export const statusLabel: Record<ClientStatus, string> = {
  estable: "Estable",
  en_riesgo: "En riesgo",
  recuperado: "Recuperado",
  perdido: "Perdido",
};

export const riskLabel: Record<RiskType, string> = {
  retraso: "Se retrasa",
  caida_volumen: "Baja el volumen",
  familia_abandonada: "Deja una familia",
  nuevo_sin_repetir: "Nuevo sin repetir",
};

export const categoryLabel: Record<CaseCategory, string> = {
  permiso: "Necesita permiso",
  informacion: "Le falta información",
  confianza: "No está seguro",
  riesgo: "Hay un riesgo",
  persona: "Pide una persona",
};

export const urgencyLabel: Record<Urgency, string> = {
  alta: "Urgente",
  media: "Hoy",
  baja: "Sin prisa",
};

export const outcomeLabel: Record<ConversationOutcome, string> = {
  pedido_cerrado: "Pedido cerrado",
  sin_respuesta: "Sin respuesta",
  escalado: "Pasada a una persona",
  sin_pedido: "Sin pedido esta vez",
  en_curso: "En curso",
};

export const activityLabel: Record<ActivityType, string> = {
  recordatorio: "Recordatorio",
  pedido_cerrado: "Pedido cerrado",
  llamada: "Llamada",
  contacto_riesgo: "Cliente en riesgo",
  sin_respuesta: "Sin respuesta",
  escalado: "Necesita tu ayuda",
  resuelto_equipo: "Resuelto por el equipo",
  aviso_entrega: "Avisos de entrega",
  erp: "Registrado en el ERP",
};

export const autonomyLevels: { id: AutonomyLevel; label: string; short: string }[] = [
  { id: "observa", label: "Solo observa", short: "Observa" },
  { id: "propone", label: "Propone y espera aprobación", short: "Propone" },
  { id: "actua_avisa", label: "Actúa y avisa", short: "Actúa y avisa" },
  { id: "autonomo", label: "Actúa solo", short: "Actúa solo" },
];
