import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/labels";
import type { ClientStatus } from "@/types";

export function StatusBadge({ status, control }: { status: ClientStatus; control?: boolean }) {
  const tone = status === "en_riesgo" ? "amber" : status === "recuperado" ? "accent" : status === "perdido" ? "risk" : "neutral";
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone={tone}>{statusLabel[status]}</Badge>
      {control && status === "en_riesgo" && <Badge tone="outline">Grupo de control</Badge>}
    </span>
  );
}
