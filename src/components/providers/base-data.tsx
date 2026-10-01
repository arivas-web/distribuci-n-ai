"use client";

import { createContext, useContext } from "react";
import type { Client, Conversation, Family, RuleProposal, SalesRep, StuckCase, TodaySummary, Zone } from "@/types";
import type { ClientLite, WeekPoint } from "@/lib/data/types";

export interface CaseClient {
  client: Client;
  weekly: WeekPoint[];
  repName: string;
  zoneName: string;
}

export interface BaseData {
  now: string;
  today: string;
  cases: StuckCase[];
  ruleProposals: RuleProposal[];
  caseConversations: Record<string, Conversation>;
  caseClients: Record<string, CaseClient>;
  summary: TodaySummary;
  clients: ClientLite[];
  reps: SalesRep[];
  zones: Zone[];
  families: Family[];
}

const Ctx = createContext<BaseData | null>(null);

export function BaseDataProvider({ value, children }: { value: BaseData; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBaseData(): BaseData {
  const v = useContext(Ctx);
  if (!v) throw new Error("BaseDataProvider no encontrado");
  return v;
}
