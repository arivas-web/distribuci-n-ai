"use client";

import { useMemo } from "react";
import { useBaseData } from "@/components/providers/base-data";
import { useDemo } from "@/lib/store/demo";

/** Cifras de hoy: datos iniciales más lo que ha pasado durante la demo. */
export function useToday() {
  const { summary, cases } = useBaseData();
  const extra = useDemo((s) => s.extra);
  const resolved = useDemo((s) => s.resolved);
  return useMemo(() => {
    const caseClients = new Set(cases.map((c) => c.clientId));
    const pending = cases.filter((c) => !resolved[c.id]);
    return {
      attended: summary.attended + extra.attended.filter((id) => !caseClients.has(id)).length,
      ordersClosed: summary.ordersClosed + extra.orders,
      ordersAmount: summary.ordersAmount + extra.amount,
      recoveredThisMonth: summary.recoveredThisMonth + extra.recovered,
      recoveredExtra: extra.recovered,
      recoveredMarginExtra: extra.recoveredMargin,
      autonomousRate: summary.autonomousRate,
      pending,
      resolvedCount: cases.length - pending.length,
    };
  }, [summary, cases, extra, resolved]);
}
