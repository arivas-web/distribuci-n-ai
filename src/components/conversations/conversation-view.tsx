"use client";

import { Mail, Mic, Phone } from "lucide-react";
import { brand } from "@config/brand";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, formatDuration, formatTime } from "@/lib/format";
import { useDemo } from "@/lib/store/demo";
import type { Conversation, Message } from "@/types";
import { OutcomeBadge } from "./outcome-badge";

/** Conversación con los mensajes añadidos durante la demo. */
export function useLiveConversation(conv: Conversation | undefined) {
  const appended = useDemo((s) => (conv ? s.appended[conv.id] : undefined));
  const outcome = useDemo((s) => (conv ? s.outcomes[conv.id] : undefined));
  if (!conv) return undefined;
  return {
    ...conv,
    outcome: outcome ?? conv.outcome,
    messages: appended ? [...conv.messages, ...appended] : conv.messages,
  };
}

function Bubble({ m, clientName, showDay }: { m: Message; clientName: string; showDay: boolean }) {
  const ours = m.from !== "cliente";
  return (
    <>
      {showDay && (
        <div className="my-2 text-center text-xs text-ink-subtle">{formatDate(m.time)}</div>
      )}
      <div className={cn("flex animate-enter flex-col", ours ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed whitespace-pre-line",
            m.from === "cliente" && "rounded-bl-md border border-line bg-surface text-ink",
            m.from === "agente" && "rounded-br-md bg-accent-soft text-ink",
            m.from === "equipo" && "rounded-br-md border border-accent-line bg-surface text-ink",
          )}
        >
          {m.voiceSeconds && (
            <div className="mb-1 flex items-center gap-1.5 text-xs text-ink-muted">
              <Mic className="size-3.5" />
              Nota de voz · {formatClock(m.voiceSeconds)} · transcrita
            </div>
          )}
          <span className={cn(m.voiceSeconds && "italic text-ink-muted")}>{m.voiceSeconds ? `«${m.text}»` : m.text}</span>
        </div>
        <div className="mt-1 px-1 text-[11px] text-ink-subtle">
          {m.from === "agente" ? "El agente" : m.from === "equipo" ? brand.user.name : clientName} · {formatTime(m.time)}
        </div>
      </div>
    </>
  );
}

export function ConversationView({ conversation, clientName, compact = false }: { conversation: Conversation; clientName: string; compact?: boolean }) {
  const conv = useLiveConversation(conversation)!;
  const contact = clientName;

  if (conv.channel === "llamada") {
    return (
      <div className="space-y-4">
        {!compact && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-4" /> Llamada · {formatDate(conv.startedAt)} {formatTime(conv.startedAt)}
            </span>
            {conv.durationSec && <span className="tabular">Duración: {formatDuration(conv.durationSec)}</span>}
            <OutcomeBadge outcome={conv.outcome} />
          </div>
        )}
        <div className="rounded-card border border-line bg-surface">
          <div className="border-b border-line px-4 py-2.5 text-xs text-ink-subtle">Transcripción</div>
          <dl className="divide-y divide-line">
            {conv.messages.map((m, i) => (
              <div key={i} className="grid animate-enter grid-cols-[84px_1fr] gap-3 px-4 py-3 text-[14px] leading-relaxed sm:grid-cols-[110px_1fr]">
                <dt className={cn("text-xs font-medium pt-0.5", m.from === "cliente" ? "text-ink-muted" : "text-accent-hover")}>
                  {m.from === "agente" ? "El agente" : m.from === "equipo" ? brand.user.name.split(" ")[0] : contact.split(" ")[0]}
                </dt>
                <dd className="text-ink">{m.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    );
  }

  if (conv.channel === "email") {
    return (
      <div className="space-y-3">
        {conv.subject && (
          <div className="flex items-center gap-2 text-sm text-ink">
            <Mail className="size-4 text-ink-subtle" />
            <span className="font-medium">{conv.subject}</span>
          </div>
        )}
        {conv.messages.map((m, i) => {
          const ours = m.from !== "cliente";
          return (
            <article key={i} className={cn("animate-enter rounded-card border bg-surface", ours ? "border-accent-line" : "border-line")}>
              <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-line px-4 py-2.5 text-[13px]">
                <span className="text-ink">
                  <span className="font-medium">
                    {m.from === "agente" ? `${brand.company.name} · Pedidos` : m.from === "equipo" ? brand.user.name : contact}
                  </span>
                  <span className="text-ink-subtle"> para {ours ? contact : `${brand.company.name}`}</span>
                </span>
                <span className="tabular text-xs text-ink-subtle">
                  {formatDate(m.time)} · {formatTime(m.time)}
                </span>
              </header>
              <div className="px-4 py-3 text-[14px] leading-relaxed whitespace-pre-line text-ink">{m.text}</div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conv.messages.map((m, i) => (
        <Bubble key={i} m={m} clientName={contact} showDay={!compact && (i === 0 || m.time.slice(0, 10) !== conv.messages[i - 1].time.slice(0, 10))} />
      ))}
    </div>
  );
}
