"use client";

/**
 * Estado de la demo en memoria. Solo guarda los cambios respecto a los datos
 * iniciales (casos resueltos, ajustes, eventos simulados), así que "Reiniciar
 * demo" consiste en vaciarlo.
 */
import { create } from "zustand";
import { brand } from "@config/brand";
import type {
  ActivityEvent,
  AutonomyLevel,
  CaseOption,
  Conversation,
  LearnedRule,
  Message,
  RuleProposal,
  StuckCase,
} from "@/types";
import type { ClientLite } from "@/lib/data/types";
import { addMinutes, liveTick } from "@/lib/live";

export interface Resolution {
  optionId: string;
  label: string;
  confirmation: string;
  at: string;
  instruction?: string;
}

export interface Toast {
  id: number;
  text: string;
  tone?: "positive" | "neutral";
}

interface Extra {
  orders: number;
  amount: number;
  recovered: number;
  recoveredMargin: number;
  attended: string[];
}

interface DemoState {
  now: string;
  resolved: Record<string, Resolution>;
  ruleCounts: Record<string, number>;
  proposal: RuleProposal | null;
  handledProposals: string[];
  newRules: LearnedRule[];
  ruleActive: Record<string, boolean>;
  autonomy: Record<string, AutonomyLevel>;
  liveEvents: ActivityEvent[];
  liveConversations: Conversation[];
  appended: Record<string, Message[]>;
  outcomes: Record<string, Conversation["outcome"]>;
  extra: Extra;
  liveMode: boolean;
  liveCount: number;
  tourStep: number | null;
  toasts: Toast[];
  openCaseId: string | null;
  openConversationId: string | null;

  resolveCase: (c: StuckCase, option: CaseOption | { custom: string }, proposals: RuleProposal[], recovering: boolean) => void;
  acceptProposal: () => void;
  dismissProposal: () => void;
  setAutonomy: (actionId: string, level: AutonomyLevel) => void;
  setRuleActive: (ruleId: string, active: boolean) => void;
  tick: (clients: ClientLite[]) => void;
  setLiveMode: (on: boolean) => void;
  setTourStep: (step: number | null) => void;
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
  openCase: (id: string | null) => void;
  openConversation: (id: string | null) => void;
  reset: () => void;
}

const initial = () => ({
  now: brand.demoNow,
  resolved: {},
  ruleCounts: {},
  proposal: null,
  handledProposals: [],
  newRules: [],
  ruleActive: {},
  autonomy: {},
  liveEvents: [],
  liveConversations: [],
  appended: {},
  outcomes: {},
  extra: { orders: 0, amount: 0, recovered: 0, recoveredMargin: 0, attended: [] },
  liveMode: false,
  liveCount: 0,
  tourStep: null,
  toasts: [],
  openCaseId: null,
  openConversationId: null,
});

let timers: ReturnType<typeof setTimeout>[] = [];
let toastId = 1;
const later = (fn: () => void, ms: number) => {
  timers.push(setTimeout(fn, ms));
};

export const useDemo = create<DemoState>()((set, get) => ({
  ...initial(),

  resolveCase(c, option, proposals, recovering) {
    const state = get();
    if (state.resolved[c.id]) return;
    const now = addMinutes(state.now, 1);
    const custom = "custom" in option;
    const label = custom ? "Instrucción al agente" : option.label;
    const confirmation = custom ? "Instrucción enviada. El agente sigue con el caso." : option.followUp?.confirmation ?? "Hecho.";

    const resolvedEvent: ActivityEvent = {
      id: `res-${c.id}`,
      time: now,
      type: "resuelto_equipo",
      clientId: c.clientId,
      text: custom ? `Has dado una instrucción al agente: «${option.custom}»` : `Has decidido: ${option.label.charAt(0).toLowerCase()}${option.label.slice(1)}`,
      conversationId: c.conversationId,
      caseId: c.id,
    };

    const teamMsg: Message[] = custom ? [{ from: "equipo", text: `Instrucción al agente: ${option.custom}`, time: now }] : [];
    set((s) => ({
      now,
      resolved: { ...s.resolved, [c.id]: { optionId: custom ? "custom" : option.id, label, confirmation, at: now, instruction: custom ? option.custom : undefined } },
      liveEvents: [...s.liveEvents, resolvedEvent],
      appended: teamMsg.length ? { ...s.appended, [c.conversationId]: [...(s.appended[c.conversationId] ?? []), ...teamMsg] } : s.appended,
      extra: { ...s.extra, attended: s.extra.attended.includes(c.clientId) ? s.extra.attended : [...s.extra.attended, c.clientId] },
    }));
    get().toast(confirmation, "positive");

    // Propuesta de regla cuando se decide dos veces lo mismo.
    if (!custom && option.ruleKey) {
      const count = (get().ruleCounts[option.ruleKey] ?? 0) + 1;
      set((s) => ({ ruleCounts: { ...s.ruleCounts, [option.ruleKey!]: count } }));
      const proposal = proposals.find((p) => p.ruleKey === option.ruleKey);
      if (count >= 2 && proposal && !get().handledProposals.includes(proposal.ruleKey)) {
        later(() => set({ proposal }), 900);
      }
    }

    // Lo que hace el agente después de la decisión.
    const follow = custom
      ? {
          messages: [{ from: "agente" as const, text: "Entendido. Lo hago así y te aviso si hay cualquier cosa." }],
          outcome: "en_curso" as const,
          order: undefined,
        }
      : option.followUp;
    if (!follow) return;
    follow.messages.forEach((m, i) => {
      later(() => {
        const t = addMinutes(get().now, 1);
        set((s) => ({
          now: t,
          appended: { ...s.appended, [c.conversationId]: [...(s.appended[c.conversationId] ?? []), { ...m, time: t }] },
        }));
      }, 700 + i * 900);
    });
    later(() => {
      const t = get().now;
      set((s) => ({ outcomes: { ...s.outcomes, [c.conversationId]: follow.outcome } }));
      const order = follow.order;
      if (order && follow.outcome === "pedido_cerrado") {
        const ev: ActivityEvent = {
          id: `res-order-${c.id}`,
          time: t,
          type: "pedido_cerrado",
          clientId: c.clientId,
          text: recovering ? "Cliente recuperado · pedido cerrado y registrado en el ERP" : "Pedido cerrado y registrado en el ERP",
          amount: order.total,
          conversationId: c.conversationId,
        };
        set((s) => ({
          liveEvents: [...s.liveEvents, ev],
          extra: {
            ...s.extra,
            orders: s.extra.orders + 1,
            amount: s.extra.amount + order.total,
            recovered: s.extra.recovered + (recovering ? order.total : 0),
            recoveredMargin: s.extra.recoveredMargin + (recovering ? order.margin : 0),
          },
        }));
      }
    }, 700 + follow.messages.length * 900);
  },

  acceptProposal() {
    const p = get().proposal;
    if (!p) return;
    const rule: LearnedRule = {
      id: `rule-${p.ruleKey}`,
      text: p.text.replace(/^Has aprobado 2 veces /, "").replace(/\. ¿Lo hago yo solo a partir de ahora\?$/, "").replace(/^./, (ch) => ch.toUpperCase()) + ".",
      origin: `${brand.user.name} lo aprobó 2 veces`,
      createdAt: get().now.slice(0, 10),
      applied: 0,
      active: true,
      actionId: p.actionId,
    };
    set((s) => ({ proposal: null, handledProposals: [...s.handledProposals, p.ruleKey], newRules: [...s.newRules, rule] }));
    get().toast("Regla guardada. A partir de ahora lo hará solo y te avisará.", "positive");
  },

  dismissProposal() {
    const p = get().proposal;
    if (!p) return;
    set((s) => ({ proposal: null, handledProposals: [...s.handledProposals, p.ruleKey] }));
    get().toast("De acuerdo. Te seguirá preguntando en estos casos.");
  },

  setAutonomy(actionId, level) {
    set((s) => ({ autonomy: { ...s.autonomy, [actionId]: level } }));
  },

  setRuleActive(ruleId, active) {
    set((s) => ({ ruleActive: { ...s.ruleActive, [ruleId]: active } }));
  },

  tick(clients) {
    const s = get();
    const n = s.liveCount + 1;
    const now = addMinutes(s.now, 1 + (n % 3));
    const { event, conversation, orderAmount } = liveTick(n, now, clients);
    set((st) => ({
      now,
      liveCount: n,
      liveEvents: [...st.liveEvents, event],
      liveConversations: [conversation, ...st.liveConversations],
      extra: {
        ...st.extra,
        orders: st.extra.orders + (orderAmount ? 1 : 0),
        amount: st.extra.amount + (orderAmount ?? 0),
        attended: st.extra.attended.includes(event.clientId) ? st.extra.attended : [...st.extra.attended, event.clientId],
      },
    }));
  },

  setLiveMode(on) {
    set({ liveMode: on });
  },

  setTourStep(step) {
    set({ tourStep: step });
  },

  toast(text, tone = "neutral") {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
    later(() => get().dismissToast(id), 3800);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  openCase(id) {
    set({ openCaseId: id });
  },

  openConversation(id) {
    set({ openConversationId: id });
  },

  reset() {
    timers.forEach(clearTimeout);
    timers = [];
    set(initial());
  },
}));
