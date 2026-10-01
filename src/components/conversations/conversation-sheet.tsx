"use client";

import Link from "next/link";
import { ArrowUpRight, Phone } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useBaseData } from "@/components/providers/base-data";
import { useDemo } from "@/lib/store/demo";
import { formatDate, formatDuration, formatEuro, formatTime } from "@/lib/format";
import type { Conversation } from "@/types";
import { ConversationView, useLiveConversation } from "./conversation-view";
import { OutcomeBadge } from "./outcome-badge";

/** Busca una conversación entre las de la página, las de los casos y las simuladas. */
export function useConversationLookup(conversations: Record<string, Conversation>) {
  const { caseConversations } = useBaseData();
  const live = useDemo((s) => s.liveConversations);
  return (id: string | null | undefined) =>
    id ? conversations[id] ?? caseConversations[id] ?? live.find((c) => c.id === id) : undefined;
}

export function ConversationSheet({ conversations }: { conversations: Record<string, Conversation> }) {
  const { clients, cases } = useBaseData();
  const id = useDemo((s) => s.openConversationId);
  const open = useDemo((s) => s.openConversation);
  const openCase = useDemo((s) => s.openCase);
  const resolved = useDemo((s) => s.resolved);
  const lookup = useConversationLookup(conversations);
  const conv = useLiveConversation(lookup(id));
  const client = conv ? clients.find((c) => c.id === conv.clientId) : undefined;
  const pendingCase = conv?.caseId && !resolved[conv.caseId] ? cases.find((c) => c.id === conv.caseId) : undefined;

  return (
    <Sheet
      open={!!conv}
      onOpenChange={(o) => !o && open(null)}
      title={client?.name ?? ""}
      description={conv ? `${conv.channel === "llamada" ? "Llamada" : "WhatsApp"} · ${formatDate(conv.startedAt)} ${formatTime(conv.startedAt)}` : undefined}
    >
      {conv && client && (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <OutcomeBadge outcome={conv.outcome} />
            <span className="text-ink-muted">{conv.summary}</span>
            {conv.orderTotal && conv.outcome === "pedido_cerrado" && <span className="tabular text-ink">· {formatEuro(conv.orderTotal)}</span>}
            {conv.durationSec && (
              <span className="inline-flex items-center gap-1 text-ink-muted">
                · <Phone className="size-3.5" /> {formatDuration(conv.durationSec)}
              </span>
            )}
          </div>
          {pendingCase && (
            <div className="flex flex-col gap-3 rounded-[10px] border border-amber-line bg-amber-soft p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-amber">El agente está esperando tu decisión en este caso.</span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  open(null);
                  openCase(pendingCase.id);
                }}
              >
                Decidir
              </Button>
            </div>
          )}
          <ConversationView conversation={conv} clientName={client.contactName} compact={conv.channel === "llamada"} />
          <Link
            href={`/clientes/${client.id}`}
            onClick={() => open(null)}
            className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
          >
            Ver ficha de {client.name} <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      )}
    </Sheet>
  );
}
