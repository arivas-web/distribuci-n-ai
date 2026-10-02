"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ChannelIcon, channelLabel } from "./channel";
import { PageHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Button } from "@/components/ui/button";
import { useBaseData } from "@/components/providers/base-data";
import { useDemo } from "@/lib/store/demo";
import { cn } from "@/lib/cn";
import { formatDayMonth, formatDuration, formatEuro, formatTime } from "@/lib/format";
import type { Conversation, ConversationOutcome } from "@/types";
import { ConversationView } from "./conversation-view";
import { OutcomeBadge } from "./outcome-badge";

type ChannelFilter = "todas" | "whatsapp" | "llamada" | "email";
type OutcomeFilter = "todos" | ConversationOutcome;

export function ConversationsView({ conversations }: { conversations: Conversation[] }) {
  const { clients, today, cases } = useBaseData();
  const live = useDemo((s) => s.liveConversations);
  const outcomes = useDemo((s) => s.outcomes);
  const resolved = useDemo((s) => s.resolved);
  const openCase = useDemo((s) => s.openCase);
  const params = useSearchParams();
  const router = useRouter();
  const selectedId = params.get("c");
  const [channel, setChannel] = useState<ChannelFilter>("todas");
  const [outcome, setOutcome] = useState<OutcomeFilter>("todos");
  const clientById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const detailRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => [...live, ...conversations].map((c) => ({ ...c, outcome: outcomes[c.id] ?? c.outcome })), [live, conversations, outcomes]);
  const shown = all.filter((c) => (channel === "todas" || c.channel === channel) && (outcome === "todos" || c.outcome === outcome));
  const selected = all.find((c) => c.id === selectedId) ?? (selectedId ? undefined : undefined);
  const select = (id: string | null) => router.replace(id ? `/conversaciones?c=${id}` : "/conversaciones", { scroll: false });

  useEffect(() => {
    if (selected) detailRef.current?.scrollTo({ top: 0 });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando el agente escribe durante la demo, bajamos hasta el último mensaje.
  const appendedCount = useDemo((s) => (selectedId ? s.appended[selectedId]?.length ?? 0 : 0));
  useEffect(() => {
    if (!appendedCount) return;
    const el = detailRef.current;
    if (el && el.scrollHeight > el.clientHeight) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else document.querySelector("[data-conv-end]")?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [appendedCount]);

  const count = (o: OutcomeFilter) => all.filter((c) => (channel === "todas" || c.channel === channel) && (o === "todos" || c.outcome === o)).length;
  const client = selected ? clientById.get(selected.clientId) : undefined;
  const pendingCase = selected?.caseId && !resolved[selected.caseId] ? cases.find((k) => k.id === selected.caseId) : undefined;

  return (
    <>
      <div className={cn(selected && "hidden lg:block")}>
        <PageHeader title="Conversaciones" description="Lo que el agente ha hablado con tus clientes esta semana, por WhatsApp, teléfono y correo." />
        <div className="mb-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <Segmented
            value={channel}
            onChange={setChannel}
            options={[
              { value: "todas", label: "Todas" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "llamada", label: "Llamadas" },
              { value: "email", label: "Correo" },
            ]}
          />
          <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            <Segmented
              size="sm"
              value={outcome}
              onChange={setOutcome}
              className="flex-nowrap"
              options={[
                { value: "todos", label: "Todos", count: count("todos") },
                { value: "pedido_cerrado", label: "Pedido cerrado", count: count("pedido_cerrado") },
                { value: "sin_respuesta", label: "Sin respuesta", count: count("sin_respuesta") },
                { value: "escalado", label: "Pasada a una persona", count: count("escalado") },
                { value: "en_curso", label: "En curso", count: count("en_curso") },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-260px)] lg:min-h-[520px] lg:grid-cols-[360px_1fr]">
        <ul className={cn("overflow-y-auto rounded-card border border-line bg-surface", selected && "hidden lg:block")}>
          {shown.map((c) => {
            const cl = clientById.get(c.clientId);
            const day = c.startedAt.slice(0, 10);
            return (
              <li key={c.id} className="border-b border-line last:border-0">
                <button
                  onClick={() => select(c.id)}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-sunken/50", c.id === selectedId && "bg-accent-soft/50 hover:bg-accent-soft/60")}
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted">
                    <ChannelIcon channel={c.channel} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{cl?.name}</span>
                      <span className="tabular shrink-0 text-xs text-ink-subtle">{day === today ? formatTime(c.startedAt) : formatDayMonth(day)}</span>
                    </div>
                    <div className="truncate text-[13px] text-ink-muted">{c.summary}</div>
                    <div className="mt-1.5">
                      <OutcomeBadge outcome={c.outcome} />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
          {!shown.length && <li className="px-4 py-10 text-center text-sm text-ink-muted">No hay conversaciones con este filtro.</li>}
        </ul>

        <div ref={detailRef} className={cn("overflow-y-auto rounded-card border border-line bg-surface", !selected && "hidden lg:block")} data-tour="conversation">
          {selected && client ? (
            <div>
              <div className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-5">
                <button onClick={() => select(null)} className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted lg:hidden">
                  <ArrowLeft className="size-4" /> Conversaciones
                </button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/clientes/${client.id}`} className="inline-flex items-center gap-1 text-base font-medium text-ink hover:underline">
                      {client.name} <ArrowUpRight className="size-3.5 text-ink-subtle" />
                    </Link>
                    <div className="text-[13px] text-ink-muted">
                      {client.contactName} · {channelLabel[selected.channel]}
                      {selected.durationSec ? ` · ${formatDuration(selected.durationSec)}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected.orderTotal && selected.outcome === "pedido_cerrado" && <span className="tabular text-sm text-ink">{formatEuro(selected.orderTotal)}</span>}
                    <OutcomeBadge outcome={selected.outcome} />
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-4 pb-40 sm:p-5 sm:pb-40">
                {pendingCase && (
                  <div className="flex flex-col gap-3 rounded-[10px] border border-amber-line bg-amber-soft p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-amber">{pendingCase.blocked}</span>
                    <Button size="sm" variant="primary" onClick={() => openCase(pendingCase.id)}>
                      Decidir
                    </Button>
                  </div>
                )}
                <ConversationView conversation={conversations.find((c) => c.id === selected.id) ?? selected} clientName={client.contactName} compact={selected.channel === "llamada"} />
                <div data-conv-end />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-10 text-center text-sm text-ink-muted">Elige una conversación para leerla.</div>
          )}
        </div>
      </div>
    </>
  );
}
