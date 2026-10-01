import type { Metadata } from "next";
import { Suspense } from "react";
import { ConversationsView } from "@/components/conversations/conversations-view";
import { getConversations, getMeta } from "@/lib/data";

export const metadata: Metadata = { title: "Conversaciones" };

export default function Page() {
  const meta = getMeta();
  // Última semana con detalle completo; las de los casos siempre.
  const from = new Date(meta.today + "T12:00:00Z");
  from.setUTCDate(from.getUTCDate() - 6);
  const conversations = getConversations().filter((c) => c.caseId || c.startedAt.slice(0, 10) >= from.toISOString().slice(0, 10));
  return (
    <Suspense>
      <ConversationsView conversations={conversations} />
    </Suspense>
  );
}
