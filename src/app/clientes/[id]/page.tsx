import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientDetailView, type FamilyRow } from "@/components/clients/client-detail";
import { getCasesData, getClient, getClients, getConversations, getMeta, getOrdersForClient, weeklySeries } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getClients().map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/clientes/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: getClient(id)?.name ?? "Cliente" };
}

const DAY = 86400000;
const dayDiff = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);

export default async function Page({ params }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const client = getClient(id);
  if (!client) notFound();
  const meta = getMeta();
  const orders = getOrdersForClient(id);
  const weekly = weeklySeries(id, client.risk?.familyId);

  // Patrón habitual: media semanal en los 6 meses antes de salirse de él.
  const refEnd = client.risk?.since ?? meta.today;
  const refOrders = orders.filter((o) => dayDiff(o.date, refEnd) > 0 && dayDiff(o.date, refEnd) <= 182);
  const baseline = Math.round(refOrders.reduce((s, o) => s + o.total, 0) / 26);

  const families: FamilyRow[] = meta.families
    .map((f) => {
      const inRange = (from: number, to: number) =>
        orders.filter((o) => {
          const d = dayDiff(o.date, meta.today);
          return d >= from && d < to;
        });
      const sum = (list: typeof orders) => list.reduce((s, o) => s + (o.byFamily[f.id] ?? 0), 0);
      const recent = sum(inRange(0, 28));
      const before = sum(inRange(28, 119));
      const half = sum(inRange(0, 182));
      const last = [...orders].reverse().find((o) => (o.byFamily[f.id] ?? 0) > 0)?.date;
      const recentWeekly = recent / 4;
      const beforeWeekly = before / 13;
      let status: FamilyRow["status"] = "habitual";
      if (beforeWeekly > 0 && recent === 0 && last && dayDiff(last, meta.today) > Math.max(20, client.cadenceDays * 2)) status = "dejado";
      else if (beforeWeekly > 0 && recentWeekly < beforeWeekly * 0.6) status = "baja";
      else if (beforeWeekly === 0 && recent > 0) status = "nueva";
      return { id: f.id, name: f.name, monthly: Math.round(beforeWeekly * 4.33), recentMonthly: Math.round(recentWeekly * 4.33), share: half, last, status };
    })
    .filter((f) => f.share > 0 || f.monthly > 0);
  const totalShare = families.reduce((s, f) => s + f.share, 0) || 1;
  families.forEach((f) => (f.share = f.share / totalShare));
  families.sort((a, b) => b.share - a.share);

  const conversations = getConversations().filter((c) => c.clientId === id);
  const stuck = getCasesData().cases.find((c) => c.clientId === id);
  const recentOrders = orders.slice(-8).reverse().map(({ id, date, total, channel, recoveredAmount }) => ({ id, date, total, channel, recovered: !!recoveredAmount }));
  const lifetime = orders.filter((o) => dayDiff(o.date, meta.today) < 365).reduce((s, o) => s + o.total, 0);

  return (
    <ClientDetailView
      client={client}
      zone={meta.zones.find((z) => z.id === client.zoneId)!.name}
      rep={meta.reps.find((r) => r.id === client.repId)!.name}
      weekly={weekly}
      baseline={baseline}
      families={families}
      conversations={conversations}
      caseId={stuck?.id}
      recentOrders={recentOrders}
      yearRevenue={Math.round(lifetime)}
    />
  );
}
