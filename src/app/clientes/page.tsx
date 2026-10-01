import type { Metadata } from "next";
import { ClientsView, type ClientRow } from "@/components/clients/clients-view";
import { getClients, getMeta } from "@/lib/data";
import { riskLabel } from "@/lib/labels";

export const metadata: Metadata = { title: "Clientes" };

export default function Page() {
  const meta = getMeta();
  const zones = new Map(meta.zones.map((z) => [z.id, z.name]));
  const reps = new Map(meta.reps.map((r) => [r.id, r.name]));
  const rows: ClientRow[] = getClients().map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    zone: zones.get(c.zoneId)!,
    rep: reps.get(c.repId)!,
    contact: c.contactName,
    lastOrder: c.lastOrder,
    monthlyRevenue: c.monthlyRevenue,
    status: c.status,
    controlGroup: c.controlGroup,
    note: c.risk ? riskLabel[c.risk.type] : undefined,
  }));
  return <ClientsView rows={rows} />;
}
