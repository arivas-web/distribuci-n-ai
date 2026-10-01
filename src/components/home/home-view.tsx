"use client";

import Link from "next/link";
import { ArrowRight, Check, Leaf } from "lucide-react";
import { brand } from "@config/brand";
import { useBaseData } from "@/components/providers/base-data";
import { CaseCard } from "@/components/cases/case-card";
import { useToday } from "@/lib/hooks/use-today";
import { useDemo } from "@/lib/store/demo";
import { formatEuroShort, formatLongDate, formatNumber, formatPercent, formatTime, plural } from "@/lib/format";

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="tabular text-lg font-medium text-ink sm:text-xl">{value}</div>
      <div className="mt-0.5 text-[13px] leading-snug text-ink-muted">{label}</div>
      {hint && <div className="text-xs text-ink-subtle">{hint}</div>}
    </div>
  );
}

export function HomeView() {
  const { cases, caseClients } = useBaseData();
  const today = useToday();
  const now = useDemo((s) => s.now);
  const liveMode = useDemo((s) => s.liveMode);
  const resolved = useDemo((s) => s.resolved);
  const openCase = useDemo((s) => s.openCase);
  const pendingCount = today.pending.length;
  const resolvedCases = cases.filter((c) => resolved[c.id]).sort((a, b) => resolved[b.id].at.localeCompare(resolved[a.id].at));

  // Primero lo urgente, luego lo que más dinero tiene en juego.
  const order = { alta: 0, media: 1, baja: 2 };
  const sorted = [...cases].sort((a, b) => order[a.urgency] - order[b.urgency] || b.atStake - a.atStake);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-2 text-[13px] text-ink-subtle">
        <span className="truncate">{formatLongDate(now).replace(/^./, (ch) => ch.toUpperCase())}</span>
        <span>·</span>
        <span className="tabular">{formatTime(now)}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-accent sm:ml-1">
          <span className={`size-1.5 rounded-full bg-accent ${liveMode ? "animate-pulse" : ""}`} />
          <span className="hidden sm:inline">El agente está trabajando</span>
          <span className="sm:hidden">Trabajando</span>
        </span>
      </div>

      <h1 className="mt-3 text-[22px] leading-snug font-medium tracking-tight text-balance text-ink sm:text-[28px] sm:leading-[1.3]" data-tour="status">
        Hoy el agente ha atendido a <span className="tabular">{formatNumber(today.attended)}</span> clientes y ha cerrado{" "}
        <span className="tabular">{plural(today.ordersClosed, "pedido", "pedidos")}</span> por{" "}
        <span className="tabular">{formatEuroShort(today.ordersAmount)}</span>.{" "}
        {pendingCount > 0 ? (
          <span className="text-ink-muted">
            Necesita tu ayuda en <span className="tabular text-amber">{plural(pendingCount, "caso", "casos")}</span>.
          </span>
        ) : (
          <span className="text-ink-muted">No necesita nada más de ti.</span>
        )}
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-4 sm:gap-8">
        <Figure label="pedidos cerrados hoy" value={formatNumber(today.ordersClosed)} />
        <Figure label="recuperados este mes" value={formatEuroShort(today.recoveredThisMonth)} />
        <Figure label="resuelto sin ayuda" value={formatPercent(today.autonomousRate)} hint="últimos 30 días" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium text-ink">Necesita tu ayuda</h2>
          {pendingCount > 0 && <span className="hidden text-[13px] text-ink-subtle sm:inline">Elige una opción y el agente sigue solo</span>}
        </div>

        <div className="space-y-3">
          {sorted.map((c, i) => (
            <CaseCard key={c.id} c={c} index={i} />
          ))}
        </div>

        {pendingCount === 0 && (
          <div className="animate-enter rounded-card border border-line bg-surface px-6 py-12 text-center" style={{ animationDelay: "1500ms" }}>
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Leaf className="size-5" strokeWidth={1.75} />
            </span>
            <h3 className="mt-4 text-base font-medium text-ink">Todo en orden</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
              El agente sigue atendiendo a tus clientes. Si necesita algo, te lo dejará aquí.
            </p>
            <Link href="/actividad" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:underline">
              Ver lo que ha hecho hoy <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </section>

      {resolvedCases.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-medium text-ink">Resueltos por ti hoy</h2>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {resolvedCases.map((c) => (
              <li key={c.id}>
                <button onClick={() => openCase(c.id)} className="flex w-full animate-enter items-center gap-3 px-4 py-3 text-left hover:bg-sunken/50">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-ink">
                      <span className="font-medium">{caseClients[c.clientId].client.name}</span>
                      <span className="text-ink-muted"> · {resolved[c.id].label}</span>
                    </div>
                    <div className="truncate text-[13px] text-ink-subtle">{resolved[c.id].confirmation}</div>
                  </div>
                  <span className="tabular shrink-0 text-xs text-ink-subtle">{formatTime(resolved[c.id].at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-ink-subtle">
        {brand.productName} · {brand.company.name}
      </p>
    </div>
  );
}
