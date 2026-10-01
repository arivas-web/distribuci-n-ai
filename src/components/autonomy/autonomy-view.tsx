"use client";

import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/lib/store/demo";
import { autonomyLevels } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { AutonomyAction, AutonomyLevel, LearnedRule } from "@/types";

function LevelPicker({ value, onChange, label }: { value: AutonomyLevel; onChange: (l: AutonomyLevel) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 rounded-[10px] bg-sunken p-1 sm:grid-cols-4">
      {autonomyLevels.map((l) => (
        <button
          key={l.id}
          role="radio"
          aria-checked={value === l.id}
          title={l.label}
          onClick={() => onChange(l.id)}
          className={cn(
            "h-8 rounded-[7px] px-2 text-xs font-medium whitespace-nowrap text-ink-muted transition-colors hover:text-ink",
            value === l.id && (l.id === "observa" ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]" : "bg-accent text-white hover:text-white"),
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function AutonomyView({ actions, rules }: { actions: AutonomyAction[]; rules: LearnedRule[] }) {
  const overrides = useDemo((s) => s.autonomy);
  const setAutonomy = useDemo((s) => s.setAutonomy);
  const newRules = useDemo((s) => s.newRules);
  const ruleActive = useDemo((s) => s.ruleActive);
  const setRuleActive = useDemo((s) => s.setRuleActive);
  const toast = useDemo((s) => s.toast);
  const allRules = [...newRules, ...rules];
  const actionName = new Map(actions.map((a) => [a.id, a.name]));

  return (
    <>
      <PageHeader title="Autonomía" description="Decide hasta dónde llega el agente en cada tipo de acción. Puedes cambiarlo cuando quieras." />

      <Card>
        <div className="hidden grid-cols-[minmax(0,1fr)_380px_140px] gap-6 border-b border-line px-5 py-2.5 text-xs text-ink-subtle lg:grid">
          <span>Acción</span>
          <span>Qué puede hacer</span>
          <span className="text-right">Acierto · 30 días</span>
        </div>
        <ul className="divide-y divide-line">
          {actions.map((a) => {
            const level = overrides[a.id] ?? a.level;
            return (
              <li key={a.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_380px_140px] lg:items-center lg:gap-6">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">{a.name}</div>
                  <div className="text-[13px] text-ink-muted">{a.description}</div>
                </div>
                <LevelPicker
                  value={level}
                  label={a.name}
                  onChange={(l) => {
                    setAutonomy(a.id, l);
                    toast(`${a.name}: ${autonomyLevels.find((x) => x.id === l)!.label.toLowerCase()}.`);
                  }}
                />
                <div className="flex items-baseline gap-2 lg:block lg:text-right">
                  {a.accuracy > 0 ? (
                    <>
                      <div className={cn("tabular text-sm font-medium", a.accuracy >= 0.95 ? "text-accent" : "text-ink")}>{formatPercent(a.accuracy, 1)}</div>
                      <div className="tabular text-xs text-ink-subtle">{formatNumber(a.cases)} casos</div>
                    </>
                  ) : (
                    <div className="text-xs text-ink-subtle">Sin datos aún · {a.cases} casos observados</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="mt-3 grid gap-2 text-[13px] text-ink-muted sm:grid-cols-4">
        {autonomyLevels.map((l, i) => (
          <div key={l.id}>
            <span className="font-medium text-ink">{l.label}.</span>{" "}
            {
              [
                "Ve lo que pasa y te lo cuenta, pero no actúa.",
                "Prepara la acción y espera a que la apruebes.",
                "Lo hace y te deja un aviso en la actividad.",
                "Lo hace sin avisar; lo verás en la actividad.",
              ][i]
            }
          </div>
        ))}
      </div>

      <section className="mt-10">
        <SectionTitle>Reglas aprendidas</SectionTitle>
        <p className="mt-1 mb-3 text-[13px] text-ink-muted">Cuando el equipo decide varias veces lo mismo, el agente propone hacerlo solo. Puedes desactivarlas cuando quieras.</p>
        <Card>
          <ul className="divide-y divide-line">
            {allRules.map((r) => {
              const active = ruleActive[r.id] ?? r.active;
              const isNew = newRules.some((n) => n.id === r.id);
              return (
                <li key={r.id} className={cn("flex items-start gap-4 px-5 py-4", isNew && "animate-enter")}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("text-sm", active ? "text-ink" : "text-ink-subtle line-through decoration-line-strong")}>{r.text}</span>
                      {isNew && <Badge tone="accent">Nueva</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-ink-subtle">
                      {r.origin} · {formatDate(r.createdAt)} · {actionName.get(r.actionId)} · aplicada {r.applied} {r.applied === 1 ? "vez" : "veces"}
                    </div>
                  </div>
                  <Switch
                    checked={active}
                    onCheckedChange={(v) => {
                      setRuleActive(r.id, v);
                      toast(v ? "Regla activada." : "Regla desactivada. El agente volverá a preguntarte.");
                    }}
                    aria-label={active ? "Desactivar regla" : "Activar regla"}
                  />
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </>
  );
}
