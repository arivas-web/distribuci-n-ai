"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { ChannelIcon, channelLabel as contactChannelLabel } from "@/components/conversations/channel";
import { Card, SectionTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientHistoryChart } from "@/components/charts/client-history";
import { ConversationSheet } from "@/components/conversations/conversation-sheet";
import { OutcomeBadge } from "@/components/conversations/outcome-badge";
import { useBaseData } from "@/components/providers/base-data";
import { useDemo } from "@/lib/store/demo";
import { cn } from "@/lib/cn";
import { businessTypeLabel } from "@/lib/labels";
import { formatAgo, formatDate, formatEuro, formatEuroShort, formatPercent, formatTime } from "@/lib/format";
import type { WeekPoint } from "@/lib/data/types";
import type { Client, Conversation, OrderChannel } from "@/types";
import { StatusBadge } from "./status-badge";

export interface FamilyRow {
  id: string;
  name: string;
  monthly: number;
  recentMonthly: number;
  share: number;
  last?: string;
  status: "habitual" | "baja" | "dejado" | "nueva";
}

const channelLabel: Record<OrderChannel, string> = { agente: "El agente", comercial: "Comercial", web: "Web", telefono: "Teléfono" };

export function ClientDetailView(props: {
  client: Client;
  zone: string;
  rep: string;
  weekly: WeekPoint[];
  baseline: number;
  families: FamilyRow[];
  conversations: Conversation[];
  caseId?: string;
  recentOrders: { id: string; date: string; total: number; channel: OrderChannel; recovered: boolean }[];
  yearRevenue: number;
}) {
  const { client, families } = props;
  const { now, cases, families: familyList } = useBaseData();
  const liveEvents = useDemo((s) => s.liveEvents);
  const liveConversations = useDemo((s) => s.liveConversations);
  const resolved = useDemo((s) => s.resolved);
  const openConversation = useDemo((s) => s.openConversation);
  const openCase = useDemo((s) => s.openCase);
  const outcomes = useDemo((s) => s.outcomes);

  const liveOrders = liveEvents.filter((e) => e.clientId === client.id && e.type === "pedido_cerrado");
  const recoveredToday = client.status === "en_riesgo" && liveOrders.length > 0;
  const stuck = props.caseId ? cases.find((c) => c.id === props.caseId) : undefined;
  const pendingCase = stuck && !resolved[stuck.id] ? stuck : undefined;
  const familyName = client.risk?.familyId ? familyList.find((f) => f.id === client.risk!.familyId)?.name : undefined;
  const allConversations = [...liveConversations.filter((c) => c.clientId === client.id), ...props.conversations];
  const convMap = Object.fromEntries(props.conversations.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-medium tracking-tight text-ink sm:text-2xl">{client.name}</h1>
            {recoveredToday ? <Badge tone="accent">Recuperado hoy</Badge> : <StatusBadge status={client.status} control={client.controlGroup} />}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {businessTypeLabel[client.type]} · {props.zone} · {client.contactName} · {client.phone} · prefiere {contactChannelLabel[client.contactPreference].toLowerCase()}
          </p>
          <p className="text-sm text-ink-subtle">
            Cliente desde {formatDate(client.since)} · Comercial: {props.rep}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6 sm:text-right">
          <div>
            <div className="tabular text-base font-medium text-ink">{client.cadenceDays === 7 ? "Semanal" : "Quincenal"}</div>
            <div className="text-xs text-ink-subtle">pide</div>
          </div>
          <div>
            <div className="tabular text-base font-medium text-ink">{formatEuroShort(client.avgTicket)}</div>
            <div className="text-xs text-ink-subtle">pedido medio</div>
          </div>
          <div>
            <div className="tabular text-base font-medium text-ink">{formatEuroShort(props.yearRevenue)}</div>
            <div className="text-xs text-ink-subtle">último año</div>
          </div>
        </div>
      </div>

      {client.risk && !recoveredToday && (
        <div
          className={cn(
            "flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center sm:justify-between",
            client.controlGroup ? "border-line bg-surface" : "border-amber-line bg-amber-soft",
          )}
        >
          <div className="text-sm">
            <div className={cn("font-medium", client.controlGroup ? "text-ink" : "text-amber")}>{client.risk.summary}</div>
            <div className="text-ink-muted">
              {client.controlGroup
                ? "Está en el grupo de control: el agente no le contacta para poder medir qué pasa sin intervenir."
                : `Unos ${formatEuroShort(client.risk.monthlyAtStake)} al mes en juego.`}
            </div>
          </div>
          {pendingCase && (
            <Button variant="primary" size="sm" onClick={() => openCase(pendingCase.id)}>
              El agente necesita tu ayuda
            </Button>
          )}
        </div>
      )}
      {recoveredToday && (
        <div className="rounded-card border border-accent-line bg-accent-soft/60 p-4 text-sm">
          <div className="font-medium text-accent-hover">Ha vuelto a pedir hoy: {formatEuro(liveOrders.at(-1)!.amount ?? 0)}</div>
          <div className="text-ink-muted">El agente cerró el pedido tras tu decisión y lo registró en el ERP.</div>
        </div>
      )}
      {client.status === "recuperado" && client.recoveredAt && (
        <div className="rounded-card border border-accent-line bg-accent-soft/60 p-4 text-sm">
          <span className="font-medium text-accent-hover">Recuperado por el agente el {formatDate(client.recoveredAt)}.</span>{" "}
          <span className="text-ink-muted">Desde entonces ha vuelto a su patrón habitual.</span>
        </div>
      )}

      <Card className="p-4 sm:p-5" data-tour="client-chart">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle>Pedidos por semana · últimos 18 meses</SectionTitle>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            {familyName && (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent" />
                {familyName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-accent-line" />
              {familyName ? "Resto" : "Pedidos"}
            </span>
          </div>
        </div>
        <ClientHistoryChart data={props.weekly} baseline={props.baseline} since={client.risk?.since} recoveredAt={client.recoveredAt} familyName={familyName} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="min-w-0 p-4 sm:p-5">
          <SectionTitle className="mb-3">Familias que compra</SectionTitle>
          <ul className="divide-y divide-line">
            {families.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm text-ink">{f.name}</span>
                    {f.status === "dejado" && <Badge tone="amber">Ha dejado de comprar</Badge>}
                    {f.status === "baja" && <Badge tone="neutral">Compra menos</Badge>}
                    {f.status === "nueva" && <Badge tone="accent">Nueva</Badge>}
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-sunken">
                    <div className={cn("h-1 rounded-full", f.status === "dejado" ? "bg-amber/50" : "bg-accent/70")} style={{ width: `${Math.max(3, f.share * 100)}%` }} />
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right">
                  <div className="tabular text-sm text-ink">{formatEuroShort(f.recentMonthly)}<span className="text-ink-subtle">/mes</span></div>
                  <div className="text-xs text-ink-subtle">
                    {f.status === "dejado" && f.last ? `último: ${formatDate(f.last)}` : `${formatPercent(f.share)} del total`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          <SectionTitle className="mb-3">Lo que ha hecho el agente</SectionTitle>
          {allConversations.length === 0 && props.recentOrders.length === 0 && <p className="text-sm text-ink-muted">Aún no hay actividad con este cliente.</p>}
          <ul className="space-y-1">
            {allConversations.map((c) => (
              <li key={c.id}>
                <button onClick={() => openConversation(c.id)} className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-sunken/60">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted">
                    <ChannelIcon channel={c.channel} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink">{c.summary}</div>
                    <div className="tabular text-xs text-ink-subtle">
                      {formatDate(c.startedAt)} · {formatTime(c.startedAt)}
                    </div>
                  </div>
                  <OutcomeBadge outcome={outcomes[c.id] ?? c.outcome} />
                </button>
              </li>
            ))}
          </ul>
          <h3 className="mt-5 mb-2 text-xs font-medium tracking-wide text-ink-subtle uppercase">Últimos pedidos</h3>
          <ul className="divide-y divide-line text-sm">
            {liveOrders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2">
                <ShoppingBag className="size-4 text-accent" />
                <span className="flex-1 text-ink">Hoy · {formatTime(o.time)}</span>
                <span className="text-xs text-accent">El agente</span>
                <span className="tabular w-24 text-right text-ink">{formatEuro(o.amount ?? 0)}</span>
              </li>
            ))}
            {props.recentOrders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2">
                <ShoppingBag className="size-4 text-ink-subtle" />
                <span className="flex-1 text-ink-muted">
                  {formatDate(o.date)} <span className="text-ink-subtle">· {formatAgo(o.date, now)}</span>
                </span>
                <span className={cn("text-xs", o.recovered ? "text-accent" : "text-ink-subtle")}>{o.recovered ? "Recuperado" : channelLabel[o.channel]}</span>
                <span className="tabular w-24 text-right text-ink">{formatEuro(o.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <ConversationSheet conversations={convMap} />
    </div>
  );
}
