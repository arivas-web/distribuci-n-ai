"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Send } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ConversationView } from "@/components/conversations/conversation-view";
import { MiniWeekly } from "@/components/charts/mini-weekly";
import { useBaseData } from "@/components/providers/base-data";
import { useDemo } from "@/lib/store/demo";
import { formatEuroShort, formatTime } from "@/lib/format";
import { businessTypeLabel, categoryLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { CaseOptions } from "./case-options";
import { UrgencyBadge } from "./meta";
import { useResolve } from "./use-resolve";

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("px-5 py-5 sm:px-6", className)}>
      <h3 className="mb-3 text-xs font-medium tracking-wide text-ink-subtle uppercase">{title}</h3>
      {children}
    </section>
  );
}

export function CaseSheet() {
  const { cases, caseClients, caseConversations, families } = useBaseData();
  const openCaseId = useDemo((s) => s.openCaseId);
  const openCase = useDemo((s) => s.openCase);
  const resolution = useDemo((s) => (openCaseId ? s.resolved[openCaseId] : undefined));
  const resolve = useResolve();
  const [text, setText] = useState("");
  const c = cases.find((k) => k.id === openCaseId);
  const info = c ? caseClients[c.clientId] : undefined;
  const conv = c ? caseConversations[c.conversationId] : undefined;
  const familyName = info?.client.risk?.familyId ? families.find((f) => f.id === info.client.risk!.familyId)?.name : undefined;

  return (
    <Sheet
      open={!!c}
      onOpenChange={(o) => !o && openCase(null)}
      title={info?.client.name ?? ""}
      description={c && info ? `${categoryLabel[c.category]} · ${formatEuroShort(c.atStake)} ${c.atStakeLabel}` : undefined}
    >
      {c && info && conv && (
        <div className="divide-y divide-line">
          <div className="space-y-3 bg-surface px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <UrgencyBadge urgency={c.urgency} />
              <span className="text-xs text-ink-subtle">Abierto a las {formatTime(c.openedAt)}</span>
            </div>
            <div>
              <div className="text-xs text-ink-subtle">Intentaba</div>
              <p className="mt-0.5 text-[15px] text-ink">{c.trying}</p>
            </div>
            <div>
              <div className="text-xs text-ink-subtle">Se ha parado porque</div>
              <p className="mt-0.5 text-[15px] text-ink">{c.blocked}</p>
            </div>
          </div>

          <Section title="Qué hago">
            {resolution ? (
              <div className="flex items-start gap-3 rounded-[10px] border border-accent-line bg-accent-soft/50 p-3.5">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
                  <Check className="size-3.5" strokeWidth={2.25} />
                </span>
                <div className="text-sm">
                  <div className="font-medium text-ink">{resolution.label}</div>
                  <div className="text-ink-muted">{resolution.confirmation}</div>
                </div>
              </div>
            ) : (
              <>
                <CaseOptions c={c} size="lg" />
                <form
                  className="mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!text.trim()) return;
                    resolve(c, { custom: text.trim() });
                    setText("");
                  }}
                >
                  <label htmlFor="instruction" className="text-xs text-ink-subtle">
                    O dile al agente qué hacer
                  </label>
                  <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Textarea
                      id="instruction"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Por ejemplo: ofrécele un 6 % y, si no acepta, que le llame Xoán el jueves."
                      className="min-h-16 flex-1"
                    />
                    <Button type="submit" variant="secondary" disabled={!text.trim()}>
                      <Send />
                      Enviar
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Section>

          <Section title="El cliente">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div className="text-sm text-ink-muted">
                {businessTypeLabel[info.client.type]} · {info.zoneName} · {info.client.contactName}
              </div>
              <Link
                href={`/clientes/${info.client.id}`}
                onClick={() => openCase(null)}
                className="inline-flex shrink-0 items-center gap-1 text-sm text-accent hover:underline"
              >
                Ficha <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            {info.client.risk && (
              <p className="mb-3 rounded-[10px] bg-amber-soft px-3 py-2 text-[13px] text-amber">{info.client.risk.summary}</p>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
              {c.context.map((x) => (
                <div key={x.label} className="flex justify-between gap-3 border-b border-line pb-2 sm:block sm:border-0 sm:pb-0">
                  <dt className="text-ink-subtle">{x.label}</dt>
                  <dd
                    className={cn(
                      "tabular text-right sm:text-left",
                      x.tone === "warning" ? "text-amber" : x.tone === "risk" ? "text-risk" : "text-ink",
                    )}
                  >
                    {x.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-ink-subtle">
                <span>Pedidos por semana · últimos 6 meses</span>
                {familyName && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-accent" /> {familyName}
                  </span>
                )}
              </div>
              <MiniWeekly data={info.weekly} since={info.client.risk?.since} familyName={familyName} />
            </div>
          </Section>

          <Section title="Conversación">
            <ConversationView conversation={conv} clientName={info.client.contactName} />
          </Section>
        </div>
      )}
    </Sheet>
  );
}
