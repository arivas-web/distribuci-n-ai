"use client";

import { useEffect, useState } from "react";
import { Check, PanelRightOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEuroShort } from "@/lib/format";
import { useDemo } from "@/lib/store/demo";
import { useBaseData } from "@/components/providers/base-data";
import { businessTypeLabel } from "@/lib/labels";
import type { StuckCase } from "@/types";
import { CaseOptions } from "./case-options";
import { CategoryLabel, UrgencyBadge } from "./meta";

export function CaseCard({ c, index = 0 }: { c: StuckCase; index?: number }) {
  const { caseClients } = useBaseData();
  const info = caseClients[c.clientId];
  const resolution = useDemo((s) => s.resolved[c.id]);
  const openCase = useDemo((s) => s.openCase);
  const [phase, setPhase] = useState<"open" | "done" | "collapsed">(resolution ? "collapsed" : "open");

  useEffect(() => {
    if (resolution && phase === "open") {
      setPhase("done");
      const t = setTimeout(() => setPhase("collapsed"), 1600);
      return () => clearTimeout(t);
    }
    if (!resolution && phase !== "open") setPhase("open");
  }, [resolution, phase]);

  return (
    <div className="collapse-out" data-collapsed={phase === "collapsed"} aria-hidden={phase === "collapsed"}>
      <div>
        <Card
          data-tour={c.id === "case-peirao" ? "peirao-card" : undefined}
          className="animate-enter p-4 sm:p-5"
          style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
        >
          {phase === "open" ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryLabel category={c.category} />
                    <UrgencyBadge urgency={c.urgency} />
                  </div>
                  <h3 className="mt-2 truncate text-base font-medium text-ink">{info.client.name}</h3>
                  <p className="text-[13px] text-ink-subtle">
                    {businessTypeLabel[info.client.type]} · {info.zoneName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="tabular text-base font-medium text-ink">{formatEuroShort(c.atStake)}</div>
                  <div className="text-xs text-ink-subtle">{c.atStakeLabel}</div>
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-[14px] leading-snug">
                <div className="grid gap-0.5 sm:grid-cols-[150px_1fr] sm:gap-3">
                  <dt className="text-ink-subtle">Intentaba</dt>
                  <dd className="text-ink">{c.trying}</dd>
                </div>
                <div className="grid gap-0.5 sm:grid-cols-[150px_1fr] sm:gap-3">
                  <dt className="text-ink-subtle">Se ha parado porque</dt>
                  <dd className="text-ink">{c.blocked}</dd>
                </div>
              </dl>

              <div className="mt-4">
                <CaseOptions c={c} />
              </div>

              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => openCase(c.id)} data-tour={c.id === "case-peirao" ? "peirao-detail" : undefined}>
                  <PanelRightOpen />
                  Ver detalle y conversación
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 py-1">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Check className="size-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">{info.client.name}</div>
                <div className="truncate text-[13px] text-ink-muted">{resolution?.confirmation}</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
