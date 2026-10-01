"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CaseOption, StuckCase } from "@/types";
import { useResolve } from "./use-resolve";

export function CaseOptions({ c, size = "md" }: { c: StuckCase; size?: "md" | "lg" }) {
  const resolve = useResolve();
  return (
    <div className="space-y-2">
      {c.options.map((o: CaseOption) => (
        <button
          key={o.id}
          data-tour={c.id === "case-peirao" && o.recommended ? "peirao-option" : undefined}
          onClick={(e) => {
            e.stopPropagation();
            resolve(c, o);
          }}
          className={cn(
            "group flex w-full items-start gap-3 rounded-[10px] border px-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            size === "lg" ? "py-3.5" : "py-3",
            o.recommended
              ? "border-accent-line bg-accent-soft/50 hover:border-accent hover:bg-accent-soft"
              : "border-line bg-surface hover:border-line-strong hover:bg-sunken/60",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium text-ink">{o.label}</span>
              {o.recommended && <span className="text-xs font-medium text-accent">Recomendada</span>}
            </div>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{o.consequence}</p>
          </div>
          <ArrowRight
            className={cn(
              "mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
              o.recommended ? "text-accent" : "text-ink-subtle",
            )}
          />
        </button>
      ))}
    </div>
  );
}
