"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/lib/store/demo";

export function RuleProposalCard() {
  const proposal = useDemo((s) => s.proposal);
  const accept = useDemo((s) => s.acceptProposal);
  const dismiss = useDemo((s) => s.dismissProposal);
  if (!proposal) return null;
  return (
    <div className="fixed inset-x-3 bottom-20 z-[55] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]">
      <div
        role="dialog"
        aria-label="Propuesta de regla"
        className="animate-enter rounded-card border border-accent-line bg-surface p-4 shadow-[0_12px_40px_-16px_rgba(15,92,87,0.35)]"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Sparkles className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-accent">Propuesta del agente</div>
            <p className="mt-1 text-sm leading-snug text-ink">{proposal.text}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="primary" size="sm" onClick={accept}>
                Sí, hazlo solo
              </Button>
              <Button variant="secondary" size="sm" onClick={dismiss}>
                No, pregúntame
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
