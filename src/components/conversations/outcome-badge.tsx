import { Badge } from "@/components/ui/badge";
import { outcomeLabel } from "@/lib/labels";
import type { ConversationOutcome } from "@/types";

const tone: Record<ConversationOutcome, "accent" | "neutral" | "amber" | "outline"> = {
  pedido_cerrado: "accent",
  sin_respuesta: "neutral",
  escalado: "amber",
  sin_pedido: "outline",
  en_curso: "outline",
};

export function OutcomeBadge({ outcome }: { outcome: ConversationOutcome }) {
  return <Badge tone={tone[outcome]}>{outcomeLabel[outcome]}</Badge>;
}
