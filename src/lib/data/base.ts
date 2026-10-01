import type { BaseData } from "@/components/providers/base-data";
import { getCasesData, getClient, getClientsLite, getConversations, getMeta, getSummary, weeklySeries } from "./index";

/** Datos que necesitan todas las pantallas (bandeja de casos, contadores). */
export function getBaseData(): BaseData {
  const meta = getMeta();
  const { cases, ruleProposals } = getCasesData();
  const conversations = getConversations();
  const caseConversations = Object.fromEntries(
    cases.map((c) => [c.conversationId, conversations.find((cv) => cv.id === c.conversationId)!]),
  );
  const from = new Date(meta.today + "T12:00:00Z");
  from.setUTCDate(from.getUTCDate() - 26 * 7);
  const caseClients = Object.fromEntries(
    cases.map((c) => {
      const client = getClient(c.clientId)!;
      return [
        client.id,
        {
          client,
          weekly: weeklySeries(client.id, client.risk?.familyId, from.toISOString().slice(0, 10)),
          repName: meta.reps.find((r) => r.id === client.repId)!.name,
          zoneName: meta.zones.find((z) => z.id === client.zoneId)!.name,
        },
      ];
    }),
  );
  return {
    now: meta.now,
    today: meta.today,
    cases,
    ruleProposals,
    caseConversations,
    caseClients,
    summary: getSummary().today,
    clients: getClientsLite(),
    reps: meta.reps,
    zones: meta.zones,
    families: meta.families,
  };
}
