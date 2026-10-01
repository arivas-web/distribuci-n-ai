import type { Client, Family, MonthlyResult, SalesRep, Zone } from "@/types";

export interface Meta {
  now: string;
  today: string;
  historyStart: string;
  agentStart: string;
  zones: Zone[];
  reps: SalesRep[];
  families: Family[];
}

export interface GroupSummary {
  total: number;
  recovered: number;
  lost: number;
  open: number;
}

export interface Results {
  monthly: MonthlyResult[];
  contacted: GroupSummary;
  control: GroupSummary;
  monthlyServiceCost: number;
}

export interface WeekPoint {
  week: string;
  total: number;
  /** Importe de la familia destacada (si la hay). */
  family?: number;
}

export interface ClientLite {
  id: string;
  name: string;
  zone: string;
  type: Client["type"];
  status: Client["status"];
  avgTicket: number;
  contactName: string;
}
