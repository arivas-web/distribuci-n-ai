"use client";

import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatDayMonth, formatEuroShort } from "@/lib/format";
import type { WeekPoint } from "@/lib/data/types";

/** Pedidos por semana de los últimos meses, con la semana en que se sale del patrón. */
export function MiniWeekly({ data, since, familyName }: { data: WeekPoint[]; since?: string; familyName?: string }) {
  const sinceWeek = since ? data.find((d) => d.week >= since)?.week ?? data.at(-1)?.week : undefined;
  const rows = data.map((d) => ({ ...d, rest: d.total - (d.family ?? 0) }));
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap={2}>
          <XAxis
            dataKey="week"
            tickFormatter={(w: string) => formatDayMonth(w)}
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={40}
          />
          <Tooltip
            cursor={{ fill: "var(--color-sunken)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as WeekPoint;
              return (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-sm">
                  <div className="text-ink-subtle">Semana del {formatDayMonth(p.week)}</div>
                  <div className="tabular mt-0.5 font-medium text-ink">{formatEuroShort(p.total)}</div>
                  {familyName && p.family !== undefined && (
                    <div className="tabular text-ink-muted">
                      {familyName}: {formatEuroShort(p.family)}
                    </div>
                  )}
                </div>
              );
            }}
          />
          {familyName && <Bar dataKey="family" stackId="a" fill="var(--color-accent)" isAnimationActive={false} />}
          <Bar dataKey="rest" stackId="a" fill="var(--color-accent-line)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          {sinceWeek && <ReferenceLine x={sinceWeek} stroke="var(--color-amber)" strokeDasharray="3 3" />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
