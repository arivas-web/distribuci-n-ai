"use client";

import { Bar, ComposedChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDayMonth, formatEuroCompact, formatEuroShort, monthsShort } from "@/lib/format";
import type { WeekPoint } from "@/lib/data/types";

export function ClientHistoryChart({
  data,
  baseline,
  since,
  recoveredAt,
  familyName,
}: {
  data: WeekPoint[];
  baseline: number;
  since?: string;
  recoveredAt?: string;
  familyName?: string;
}) {
  const rows = data.map((d) => ({ ...d, rest: d.total - (d.family ?? 0) }));
  const weekOf = (date?: string) => (date ? rows.find((d) => d.week >= date)?.week ?? rows.at(-1)?.week : undefined);
  const sinceWeek = weekOf(since);
  const recWeek = weekOf(recoveredAt);
  // Una marca por mes, en la primera semana de cada mes.
  const ticks = rows.filter((d, i) => i === 0 || d.week.slice(5, 7) !== rows[i - 1].week.slice(5, 7)).map((d) => d.week);

  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barCategoryGap={1}>
          {sinceWeek && (
            <ReferenceArea
              x1={sinceWeek}
              x2={rows.at(-1)!.week}
              fill="var(--color-amber-soft)"
              fillOpacity={1}
              ifOverflow="extendDomain"
              label={{ value: "Se sale de su patrón", position: "insideTopRight", fill: "var(--color-amber)", fontSize: 12 }}
            />
          )}
          <XAxis
            dataKey="week"
            ticks={ticks}
            tickFormatter={(w: string) => `${monthsShort[Number(w.slice(5, 7)) - 1]}${w.slice(5, 7) === "01" ? ` ${w.slice(2, 4)}` : ""}`}
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
            axisLine={{ stroke: "var(--color-line)" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickFormatter={(v: number) => formatEuroCompact(v)}
            tick={{ fontSize: 11, fill: "var(--color-ink-subtle)" }}
            axisLine={false}
            tickLine={false}
            width={52}
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
          <Bar dataKey="rest" stackId="a" fill="var(--color-accent-line)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
          {baseline > 0 && (
            <ReferenceLine
              y={baseline}
              stroke="var(--color-ink-subtle)"
              strokeDasharray="4 4"
              label={{ value: "Su patrón", position: "insideTopLeft", fill: "var(--color-ink-muted)", fontSize: 11 }}
            />
          )}
          {recWeek && (
            <ReferenceLine
              x={recWeek}
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              label={{ value: "Recuperado", position: "top", fill: "var(--color-accent)", fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
