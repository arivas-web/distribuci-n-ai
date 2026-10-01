"use client";

import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { MonthlyResultsChart } from "@/components/charts/monthly-results";
import { useToday } from "@/lib/hooks/use-today";
import { useBaseData } from "@/components/providers/base-data";
import { formatDate, formatEuroShort, formatMonth, formatNumber, formatPercent } from "@/lib/format";
import type { Results } from "@/lib/data/types";

function RateBar({ label, sub, rate, tone }: { label: string; sub: string; rate: number; tone: "accent" | "muted" }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink">{label}</span>
        <span className="tabular text-lg font-medium text-ink">{formatPercent(rate)}</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-sunken">
        <div className={tone === "accent" ? "h-2.5 rounded-full bg-accent" : "h-2.5 rounded-full bg-ink-subtle/60"} style={{ width: `${rate * 100}%` }} />
      </div>
      <div className="mt-1.5 text-[13px] text-ink-subtle">{sub}</div>
    </div>
  );
}

export function ResultsView({ results, agentStart }: { results: Results; agentStart: string }) {
  const { today: todayDate } = useBaseData();
  const today = useToday();
  const month = todayDate.slice(0, 7);
  const rows = results.monthly.map((m) => ({
    month: m.month,
    sales: Math.round(m.recoveredSales + (m.month === month ? today.recoveredExtra : 0)),
    margin: Math.round(m.recoveredMargin + (m.month === month ? today.recoveredMarginExtra : 0)),
  }));
  const current = rows.find((r) => r.month === month)!;
  const { contacted, control, monthlyServiceCost: cost } = results;
  const contactedRate = contacted.recovered / (contacted.recovered + contacted.lost);
  const controlRate = control.recovered / (control.recovered + control.lost);
  // Parte del margen que no se habría recuperado sin el agente.
  const incrementalShare = 1 - controlRate / contactedRate;
  const incremental = current.margin * incrementalShare;
  const ratio = incremental / cost;
  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalMargin = rows.reduce((s, r) => s + r.margin, 0);
  const months = rows.length;

  return (
    <>
      <PageHeader title="Resultados" description={`Lo que ha recuperado el agente desde que empezó a trabajar, el ${formatDate(agentStart)}.`} />

      <Card className="p-5 sm:p-7" data-tour="results-hero">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <div className="text-sm text-ink-muted capitalize">{formatMonth(month, true)}</div>
            <p className="mt-2 text-[22px] leading-snug font-medium tracking-tight text-balance text-ink sm:text-[26px]">
              Por cada euro que cuesta el servicio, el agente recupera{" "}
              <span className="tabular text-accent">{formatNumber(ratio, 1)} €</span> de margen que, sin él, se habría perdido.
            </p>
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">Margen recuperado este mes</dt>
              <dd className="tabular font-medium text-ink">{formatEuroShort(current.margin)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">
                Descontando lo que habría vuelto solo
                <span className="block text-xs text-ink-subtle">según el grupo de control</span>
              </dt>
              <dd className="tabular font-medium text-ink">{formatEuroShort(incremental)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <dt className="text-ink-muted">Coste del servicio</dt>
              <dd className="tabular font-medium text-ink">{formatEuroShort(cost)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-medium text-ink">Beneficio neto del mes</dt>
              <dd className="tabular text-base font-medium text-accent">{formatEuroShort(incremental - cost)}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <SectionTitle>¿Recupera más clientes que si no hiciera nada?</SectionTitle>
          <p className="mt-1 text-[13px] text-ink-muted">
            El 15 % de los clientes en riesgo no se contacta. Así se puede comparar con lo que pasa sin el agente.
          </p>
          <div className="mt-5 space-y-6">
            <RateBar
              label="Contactados por el agente"
              rate={contactedRate}
              tone="accent"
              sub={`${contacted.recovered} de ${contacted.recovered + contacted.lost} clientes han vuelto a su patrón`}
            />
            <RateBar
              label="Grupo de control, sin contactar"
              rate={controlRate}
              tone="muted"
              sub={`${control.recovered} de ${control.recovered + control.lost} han vuelto por su cuenta`}
            />
          </div>
          <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink-muted">
            Ahora mismo hay {contacted.open + control.open} clientes en riesgo con el caso abierto ({contacted.open} contactados y {control.open} en el grupo de control). Se cuentan cuando se resuelven.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <SectionTitle>Ventas y margen recuperados por mes</SectionTitle>
            <div className="flex gap-4 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent-line" /> Ventas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-accent" /> Margen
              </span>
            </div>
          </div>
          <div className="mt-3">
            <MonthlyResultsChart data={rows} cost={cost} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
            <div>
              <div className="tabular text-base font-medium text-ink">{formatEuroShort(totalSales)}</div>
              <div className="text-xs text-ink-subtle">ventas recuperadas</div>
            </div>
            <div>
              <div className="tabular text-base font-medium text-ink">{formatEuroShort(totalMargin)}</div>
              <div className="text-xs text-ink-subtle">margen recuperado</div>
            </div>
            <div>
              <div className="tabular text-base font-medium text-ink">{formatEuroShort(cost * months)}</div>
              <div className="text-xs text-ink-subtle">coste en {months} meses</div>
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-subtle">
        Se cuentan como recuperadas las ventas de los 60 días siguientes a que un cliente en riesgo vuelva a su patrón tras el contacto del agente. Si solo había
        dejado una familia, se cuenta esa familia; si había bajado el volumen, solo la diferencia.
      </p>
    </>
  );
}
