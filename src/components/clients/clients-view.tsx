"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { businessTypeLabel } from "@/lib/labels";
import { formatAgo, formatEuroShort } from "@/lib/format";
import { useBaseData } from "@/components/providers/base-data";
import type { BusinessType, ClientStatus } from "@/types";
import { StatusBadge } from "./status-badge";

export interface ClientRow {
  id: string;
  name: string;
  type: BusinessType;
  zone: string;
  rep: string;
  contact: string;
  lastOrder?: string;
  monthlyRevenue: number;
  status: ClientStatus;
  controlGroup: boolean;
  note?: string;
}

type Filter = "todos" | ClientStatus;

export function ClientsView({ rows }: { rows: ClientRow[] }) {
  const { now } = useBaseData();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const count = (s: Filter) => (s === "todos" ? rows.length : rows.filter((r) => r.status === s).length);
  const shown = useMemo(() => {
    const term = q
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const rank: Record<ClientStatus, number> = { en_riesgo: 0, recuperado: 1, estable: 2, perdido: 3 };
    return rows
      .filter((r) => filter === "todos" || r.status === filter)
      .filter((r) => !term || norm(`${r.name} ${r.zone} ${r.contact} ${r.rep} ${businessTypeLabel[r.type]}`).includes(term))
      .sort((a, b) => rank[a.status] - rank[b.status] || b.monthlyRevenue - a.monthlyRevenue);
  }, [rows, q, filter]);

  return (
    <>
      <PageHeader title="Clientes" description={`${rows.length} clientes. El agente vigila el patrón de compra de cada uno.`} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, zona o contacto" className="pl-9" />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Segmented
            value={filter}
            onChange={setFilter}
            className="flex-nowrap"
            options={[
              { value: "todos", label: "Todos", count: count("todos") },
              { value: "en_riesgo", label: "En riesgo", count: count("en_riesgo") },
              { value: "recuperado", label: "Recuperados", count: count("recuperado") },
              { value: "estable", label: "Estables", count: count("estable") },
              { value: "perdido", label: "Perdidos", count: count("perdido") },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_110px_110px_150px] gap-4 border-b border-line px-4 py-2.5 text-xs text-ink-subtle md:grid">
          <span>Cliente</span>
          <span>Zona</span>
          <span>Comercial</span>
          <span>Último pedido</span>
          <span className="text-right">Al mes</span>
          <span>Estado</span>
        </div>
        <ul>
          {shown.slice(0, 120).map((r) => (
            <li key={r.id} className="border-b border-line last:border-0">
              <Link
                href={`/clientes/${r.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-sunken/50 md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_110px_110px_150px]"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink">{r.name}</div>
                  <div className="truncate text-[13px] text-ink-subtle">
                    {businessTypeLabel[r.type]}
                    <span className="md:hidden"> · {r.zone}</span>
                    {r.note && <span className="text-amber"> · {r.note}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:hidden">
                  <StatusBadge status={r.status} />
                  <ChevronRight className="size-4 text-ink-subtle" />
                </div>
                <span className="hidden truncate text-sm text-ink-muted md:block">{r.zone}</span>
                <span className="hidden truncate text-sm text-ink-muted md:block">{r.rep}</span>
                <span className="tabular hidden text-sm text-ink-muted md:block">{r.lastOrder ? formatAgo(r.lastOrder, now) : "—"}</span>
                <span className="tabular hidden text-right text-sm text-ink md:block">{formatEuroShort(r.monthlyRevenue)}</span>
                <span className="hidden md:block">
                  <StatusBadge status={r.status} control={r.controlGroup} />
                </span>
              </Link>
            </li>
          ))}
          {!shown.length && <li className="px-4 py-10 text-center text-sm text-ink-muted">No hay clientes que coincidan con la búsqueda.</li>}
        </ul>
        {shown.length > 120 && (
          <div className="border-t border-line px-4 py-3 text-center text-[13px] text-ink-subtle">
            Mostrando 120 de {shown.length}. Usa el buscador para encontrar el resto.
          </div>
        )}
      </div>
    </>
  );
}
