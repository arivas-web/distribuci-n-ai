"use client";

import { useBaseData } from "@/components/providers/base-data";
import { useDemo } from "@/lib/store/demo";
import type { CaseOption, StuckCase } from "@/types";

export function useResolve() {
  const { ruleProposals, caseClients } = useBaseData();
  const resolveCase = useDemo((s) => s.resolveCase);
  return (c: StuckCase, option: CaseOption | { custom: string }) => {
    const recovering = caseClients[c.clientId]?.client.status === "en_riesgo";
    resolveCase(c, option, ruleProposals, recovering);
  };
}
