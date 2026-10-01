"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  House,
  MessagesSquare,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Route,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import { brand } from "@config/brand";
import { cn } from "@/lib/cn";
import { useDemo } from "@/lib/store/demo";
import { useToday } from "@/lib/hooks/use-today";
import { useBaseData } from "@/components/providers/base-data";
import { Logo } from "./logo";
import { Sheet } from "@/components/ui/sheet";
import { Toasts } from "./toasts";
import { RuleProposalCard } from "@/components/cases/rule-proposal";
import { CaseSheet } from "@/components/cases/case-sheet";
import { Tour } from "@/components/tour/tour";

const nav = [
  { href: "/", label: "Inicio", mobile: "Inicio", icon: House },
  { href: "/actividad", label: "Actividad", mobile: "Actividad", icon: Activity },
  { href: "/clientes", label: "Clientes", mobile: "Clientes", icon: Users },
  { href: "/conversaciones", label: "Conversaciones", mobile: "Mensajes", icon: MessagesSquare },
  { href: "/resultados", label: "Resultados", mobile: "Resultados", icon: TrendingUp },
  { href: "/autonomia", label: "Autonomía", mobile: "Autonomía", icon: SlidersHorizontal },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function LiveTicker() {
  const liveMode = useDemo((s) => s.liveMode);
  const tick = useDemo((s) => s.tick);
  const { clients } = useBaseData();
  useEffect(() => {
    if (!liveMode) return;
    tick(clients);
    const id = setInterval(() => tick(clients), 4200);
    return () => clearInterval(id);
  }, [liveMode, tick, clients]);
  return null;
}

function DemoControls({ onAction }: { onAction?: () => void }) {
  const liveMode = useDemo((s) => s.liveMode);
  const setLiveMode = useDemo((s) => s.setLiveMode);
  const setTourStep = useDemo((s) => s.setTourStep);
  const reset = useDemo((s) => s.reset);
  const router = useRouter();
  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-muted transition-colors hover:bg-sunken hover:text-ink";
  return (
    <div className="space-y-0.5">
      <button
        className={cn(item, liveMode && "text-accent-hover")}
        onClick={() => {
          setLiveMode(!liveMode);
          onAction?.();
        }}
      >
        {liveMode ? <Pause className="size-4" /> : <Play className="size-4" />}
        <span className="flex-1 text-left">{liveMode ? "Parar modo demo" : "Modo demo"}</span>
        {liveMode && <span className="size-1.5 animate-pulse rounded-full bg-accent" />}
      </button>
      <button
        className={item}
        onClick={() => {
          reset();
          setTourStep(0);
          router.push("/");
          onAction?.();
        }}
      >
        <Route className="size-4" />
        <span>Historia guiada</span>
      </button>
      <button
        className={item}
        onClick={() => {
          reset();
          router.push("/");
          useDemo.getState().toast("Demo reiniciada. Todo vuelve al estado inicial.");
          onAction?.();
        }}
      >
        <RotateCcw className="size-4" />
        <span>Reiniciar demo</span>
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { pending } = useToday();
  const [moreOpen, setMoreOpen] = useState(false);
  const count = pending.length;

  return (
    <div className="min-h-dvh">
      <LiveTicker />

      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-canvas px-3 py-5 lg:flex">
        <Link href="/" className="px-2.5">
          <Logo />
        </Link>
        <nav className="mt-8 space-y-0.5">
          {nav.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  active ? "bg-surface font-medium text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-ink-muted hover:bg-sunken hover:text-ink",
                )}
              >
                <n.icon className={cn("size-4", active ? "text-accent" : "text-ink-subtle")} strokeWidth={1.75} />
                <span className="flex-1">{n.label}</span>
                {n.href === "/" && count > 0 && (
                  <span className="tabular rounded-full bg-amber-soft px-1.5 text-xs font-medium text-amber">{count}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="border-t border-line pt-3">
            <DemoControls />
          </div>
          <div className="flex items-center gap-2.5 px-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-sunken text-xs font-medium text-ink-muted">
              {brand.user.name.split(" ").map((p) => p[0]).join("")}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium text-ink">{brand.user.name}</div>
              <div className="truncate text-xs text-ink-subtle">{brand.user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <Link href="/">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-1">
          {count > 0 && pathname !== "/" && (
            <Link href="/" className="tabular rounded-full bg-amber-soft px-2.5 py-1 text-xs font-medium text-amber">
              {count} {count === 1 ? "caso" : "casos"}
            </Link>
          )}
          <button className="rounded-lg p-2 text-ink-muted hover:bg-sunken" aria-label="Más opciones" onClick={() => setMoreOpen(true)}>
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      <main className="pb-24 lg:pb-0 lg:pl-60">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>

      {/* Navegación inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {nav.slice(0, 5).map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link key={n.href} href={n.href} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "text-accent" : "text-ink-subtle")}>
              <n.icon className="size-5" strokeWidth={1.75} />
              <span className={cn(active && "font-medium")}>{n.mobile}</span>
              {n.href === "/" && count > 0 && (
                <span className="tabular absolute top-1.5 left-1/2 ml-2 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] leading-4 font-medium text-white">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="Más opciones">
        <div className="space-y-6 p-5">
          <nav className="space-y-0.5">
            {nav.slice(4).map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setMoreOpen(false)} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-ink hover:bg-sunken">
                <n.icon className="size-4 text-ink-subtle" strokeWidth={1.75} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line pt-4">
            <div className="mb-2 px-2.5 text-xs text-ink-subtle">Presentación</div>
            <DemoControls onAction={() => setMoreOpen(false)} />
          </div>
        </div>
      </Sheet>

      <CaseSheet />
      <RuleProposalCard />
      <Tour />
      <Toasts />
    </div>
  );
}
