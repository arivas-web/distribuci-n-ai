"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBaseData } from "@/components/providers/base-data";
import { useResolve } from "@/components/cases/use-resolve";
import { useDemo } from "@/lib/store/demo";
import { formatEuro } from "@/lib/format";

interface Step {
  path: string;
  target: string;
  title: string;
  body: (ctx: { amount?: number }) => string;
}

const CASE_ID = "case-peirao";

const steps: Step[] = [
  {
    path: "/",
    target: "peirao-card",
    title: "Un cliente se sale de su patrón",
    body: () =>
      "El Bar O Peirao pedía cada semana. Lleva 15 días sin pedir y hace 3 semanas que dejó la cerveza de barril. El agente ya ha hablado con él y necesita tu permiso para un descuento.",
  },
  {
    path: "/clientes/c-peirao",
    target: "client-chart",
    title: "El gráfico lo deja claro",
    body: () =>
      "En verde oscuro, la cerveza de barril. A primeros de septiembre desaparece y después deja de pedir. La zona ámbar marca cuándo se salió de su patrón.",
  },
  {
    path: "/conversaciones?c=conv-peirao",
    target: "conversation",
    title: "Lo que ha hablado el agente",
    body: () =>
      "Manolo le cuenta en una nota de voz que otra distribuidora le deja el barril a 96 € y le cambia el grifo. El agente solo puede bajar un 5 %. Aprueba el 8 % y mira qué pasa.",
  },
  {
    path: "/conversaciones?c=conv-peirao",
    target: "conversation",
    title: "Pedido cerrado",
    body: ({ amount }) =>
      `Manolo acepta. El agente cierra el pedido${amount ? ` de ${formatEuro(amount)}` : ""} y lo registra en el ERP. Nadie ha tenido que coger el teléfono.`,
  },
  {
    path: "/resultados",
    target: "results-hero",
    title: "Y se nota en Resultados",
    body: () =>
      "Ese pedido ya cuenta como venta recuperada este mes. Aquí se compara el margen recuperado con lo que cuesta el servicio, descontando lo que habría vuelto sin el agente.",
  },
];

function TourInner() {
  const step = useDemo((s) => s.tourStep);
  const setStep = useDemo((s) => s.setTourStep);
  const resolution = useDemo((s) => s.resolved[CASE_ID]);
  const orderEvent = useDemo((s) => s.liveEvents.find((e) => e.id === `res-order-${CASE_ID}`));
  const openCase = useDemo((s) => s.openCase);
  const openConversation = useDemo((s) => s.openConversation);
  const { cases } = useBaseData();
  const resolve = useResolve();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const current = step !== null ? steps[step] : undefined;

  // Navegar a la pantalla del paso.
  useEffect(() => {
    if (!current) return;
    const here = pathname + (search ? `?${search}` : "");
    if (here !== current.path) {
      openCase(null);
      openConversation(null);
      router.push(current.path);
    }
  }, [current, pathname, search, router, openCase, openConversation]);

  // Resaltar el elemento del paso cuando aparezca.
  useEffect(() => {
    if (!current) return;
    let el: Element | null = null;
    let tries = 0;
    const id = setInterval(() => {
      el = document.querySelector(`[data-tour="${current.target}"]`);
      if (el || ++tries > 40) {
        clearInterval(id);
        if (el) {
          el.setAttribute("data-tour-active", "true");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }, 100);
    return () => {
      clearInterval(id);
      document.querySelectorAll("[data-tour-active]").forEach((n) => n.removeAttribute("data-tour-active"));
    };
  }, [current, pathname]);

  // Cuando el pedido se cierra, pasar solo al siguiente paso.
  useEffect(() => {
    if (step === 2 && orderEvent) {
      const t = setTimeout(() => setStep(3), 600);
      return () => clearTimeout(t);
    }
  }, [step, orderEvent, setStep]);

  if (!current || step === null) return null;
  const c = cases.find((k) => k.id === CASE_ID)!;
  const recommended = c.options.find((o) => o.recommended)!;
  const waiting = step === 2 && resolution && !orderEvent;

  return (
    <div className="fixed inset-x-3 bottom-20 z-[58] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]">
      <div className="animate-enter rounded-card border border-line-strong bg-surface p-4 shadow-[0_16px_48px_-20px_rgba(29,35,32,0.35)]" key={step}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-accent">
            Historia guiada · {step + 1} de {steps.length}
          </span>
          <button onClick={() => setStep(null)} className="-mr-1 rounded-md p-1 text-ink-subtle hover:bg-sunken hover:text-ink" aria-label="Salir de la historia">
            <X className="size-4" />
          </button>
        </div>
        <h3 className="mt-1.5 text-[15px] font-medium text-ink">{current.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{current.body({ amount: orderEvent?.amount })}</p>
        <div className="mt-2 flex gap-1">
          {steps.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-sunken"}`} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Anterior
          </Button>
          {step === 2 && !resolution ? (
            <Button variant="primary" size="sm" onClick={() => resolve(c, recommended)}>
              Aprobar el 8 %
            </Button>
          ) : step === steps.length - 1 ? (
            <Button variant="primary" size="sm" onClick={() => setStep(null)}>
              Terminar
            </Button>
          ) : (
            <Button variant="primary" size="sm" disabled={!!waiting} onClick={() => setStep(step + 1)}>
              {waiting ? "El agente está escribiendo…" : "Siguiente"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Tour() {
  return (
    <Suspense>
      <TourInner />
    </Suspense>
  );
}
