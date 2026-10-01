import { CircleHelp, KeyRound, MessageCircleQuestion, TriangleAlert, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryLabel, urgencyLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type { CaseCategory, Urgency } from "@/types";

const icons = {
  permiso: KeyRound,
  informacion: CircleHelp,
  confianza: MessageCircleQuestion,
  riesgo: TriangleAlert,
  persona: UserRound,
} satisfies Record<CaseCategory, unknown>;

export function CategoryLabel({ category, className }: { category: CaseCategory; className?: string }) {
  const Icon = icons[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-muted", className)}>
      <Icon className={cn("size-3.5", category === "riesgo" ? "text-risk" : "text-ink-subtle")} strokeWidth={1.9} />
      {categoryLabel[category]}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <Badge tone={urgency === "alta" ? "amber" : urgency === "media" ? "neutral" : "outline"}>{urgencyLabel[urgency]}</Badge>;
}
