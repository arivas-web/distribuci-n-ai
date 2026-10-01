import type { Metadata } from "next";
import { ActivityView } from "@/components/activity/activity-view";
import { getActivity, getConversations } from "@/lib/data";

export const metadata: Metadata = { title: "Actividad" };

export default function Page() {
  const events = getActivity();
  const ids = new Set(events.map((e) => e.conversationId).filter(Boolean));
  const conversations = Object.fromEntries(getConversations().filter((c) => ids.has(c.id)).map((c) => [c.id, c]));
  return <ActivityView events={events} conversations={conversations} />;
}
