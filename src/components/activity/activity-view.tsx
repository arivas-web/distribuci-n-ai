"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CheckCheck,
  CircleCheck,
  HandHelping,
  MessageCircleOff,
  Phone,
  Send,
  Truck,
  UserRoundSearch,
} from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { useBaseData } from "@/components/providers/base-data";
import { ConversationSheet } from "@/components/conversations/conversation-sheet";
import { useDemo } from "@/lib/store/demo";
import { cn } from "@/lib/cn";
import { formatDayMonth, formatEuro, formatEuroShort, formatNumber, formatTime, weekdayName } from "@/lib/format";
import type { ActivityEvent, ActivityType, Conversation } from "@/types";

const icon: Record<ActivityType, typeof Send> = {
  recordatorio: Send,
  pedido_cerrado: CircleCheck,
  llamada: Phone,
  contacto_riesgo: UserRoundSearch,
  sin_respuesta: MessageCircleOff,
  escalado: HandHelping,
  resuelto_equipo: CheckCheck,
  aviso_entrega: Truck,
  erp: BellRing,
};

type Filter = "todo" | "pedidos" | "contactos" | "ayuda";
const filterTypes: Record<Filter, ActivityType[] | null> = {
  todo: null,
  pedidos: ["pedido_cerrado"],
  contactos: ["recordatorio", "llamada", "contacto_riesgo", "sin_respuesta", "aviso_entrega"],
  ayuda: ["escalado", "resuelto_equipo"],
};

export function ActivityView({ events, conversations }: { events: ActivityEvent[]; conversations: Record<string, Conversation> }) {
  const { clients, today } = useBaseData();
  const live = useDemo((s) => s.liveEvents);
  const resolved = useDemo((s) => s.resolved);
  const openConversation = useDemo((s) => s.openConversation);
  const openCase = useDemo((s) => s.openCase);
  const [day, setDay] = useState(today);
  const [filter, setFilter] = useState<Filter>("todo");
  const names = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);

  const days = useMemo(() => [...new Set(events.map((e) => e.time.slice(0, 10)))].sort().reverse(), [events]);
  const liveIds = useMemo(() => new Set(live.map((e) => e.id)), [live]);
  const all = useMemo(() => [...events, ...live].filter((e) => e.time.startsWith(day)).sort((a, b) => b.time.localeCompare(a.time)), [events, live, day]);
  const shown = all.filter((e) => !filterTypes[filter] || filterTypes[filter]!.includes(e.type));

  const contacts = all.filter((e) => ["recordatorio", "llamada", "contacto_riesgo"].includes(e.type)).length;
  const orders = all.filter((e) => e.type === "pedido_cerrado");
  const amount = orders.reduce((s, e) => s + (e.amount ?? 0), 0);
  const helps = all.filter((e) => e.type === "escalado").length;

  const dayLabel = (d: string) => (d === today ? "Hoy" : d === days[1] ? "Ayer" : `${weekdayName(d).slice(0, 3)} ${formatDayMonth(d)}`);

  return (
    <>
      <PageHeader title="Actividad del agente" description="Todo lo que ha hecho el agente, minuto a minuto. Toca una entrada para ver la conversación." />

      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Segmented value={day} onChange={setDay} options={days.map((d) => ({ value: d, label: dayLabel(d) }))} className="flex-nowrap" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "contactos", value: formatNumber(contacts) },
          { label: "pedidos cerrados", value: formatNumber(orders.length) },
          { label: "en pedidos", value: formatEuroShort(amount) },
          { label: "casos para el equipo", value: formatNumber(helps) },
        ].map((f) => (
          <div key={f.label} className="rounded-card border border-line bg-surface px-4 py-3">
            <div className="tabular text-lg font-medium text-ink">{f.value}</div>
            <div className="text-[13px] text-ink-muted">{f.label}</div>
          </div>
        ))}
      </div>

      <Segmented
        size="sm"
        value={filter}
        onChange={setFilter}
        className="mb-4"
        options={[
          { value: "todo", label: "Todo" },
          { value: "pedidos", label: "Pedidos" },
          { value: "contactos", label: "Contactos" },
          { value: "ayuda", label: "Con el equipo" },
        ]}
      />

      <ol className="relative rounded-card border border-line bg-surface">
        {shown.map((e) => {
          const Icon = icon[e.type];
          const clickable = !!e.conversationId || !!e.caseId;
          const pendingCase = e.type === "escalado" && e.caseId && !resolved[e.caseId];
          return (
            <li key={e.id} className={cn("border-b border-line last:border-0", liveIds.has(e.id) && "animate-enter")}>
              <button
                disabled={!clickable}
                onClick={() => {
                  if (e.type === "escalado" && e.caseId) openCase(e.caseId);
                  else if (e.conversationId) openConversation(e.conversationId);
                }}
                className="flex w-full items-start gap-3 px-4 py-3 text-left enabled:hover:bg-sunken/50 sm:gap-4"
              >
                <span className="tabular w-11 shrink-0 pt-0.5 text-[13px] text-ink-subtle">{formatTime(e.time)}</span>
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    e.type === "pedido_cerrado" ? "bg-accent-soft text-accent" : e.type === "escalado" ? "bg-amber-soft text-amber" : "bg-sunken text-ink-muted",
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink">
                    {e.clientId ? <span className="font-medium">{names.get(e.clientId)}</span> : <span className="font-medium">Avisos de entrega</span>}
                  </div>
                  <div className={cn("text-[13px] leading-snug", pendingCase ? "text-amber" : "text-ink-muted")}>
                    {e.type === "escalado" ? (pendingCase ? `Necesita tu ayuda: ${e.text}` : `Resuelto · ${e.text}`) : e.text}
                  </div>
                </div>
                {e.amount !== undefined && <span className="tabular shrink-0 pt-0.5 text-sm text-ink">{formatEuro(e.amount)}</span>}
              </button>
            </li>
          );
        })}
        {!shown.length && <li className="px-4 py-10 text-center text-sm text-ink-muted">No hay actividad de este tipo en este día.</li>}
      </ol>

      <ConversationSheet conversations={conversations} />
    </>
  );
}
