"use client";

import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuroCompact, formatEuroShort, formatMonth } from "@/lib/format";

export interface MonthRow {
  month: string;
  sales: number;
  margin: number;
}

export function MonthlyResultsChart({ data, cost }: { data: MonthRow[]; cost: number }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }} barGap={4} barCategoryGap="28%">
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => formatMonth(m)}
            tick={{ fontSize: 12, fill: "var(--color-ink-subtle)" }}
            axisLine={{ stroke: "var(--color-line)" }}
            tickLine={false}
          />
          <YAxis tickFormatter={(v: number) => formatEuroCompact(v)} tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            cursor={{ fill: "var(--color-sunken)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as MonthRow;
              return (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-sm">
                  <div className="mb-1 text-ink-subtle capitalize">{formatMonth(p.month, true)}</div>
                  <div className="tabular text-ink">Ventas recuperadas: {formatEuroShort(p.sales)}</div>
                  <div className="tabular text-ink">Margen recuperado: {formatEuroShort(p.margin)}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="sales" fill="var(--color-accent-line)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="margin" fill="var(--color-accent)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <ReferenceLine
            y={cost}
            stroke="var(--color-ink-subtle)"
            strokeDasharray="4 4"
            label={{ value: "Coste del servicio", position: "insideTopRight", fill: "var(--color-ink-muted)", fontSize: 11 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
