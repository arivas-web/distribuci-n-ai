"use client";

import { Check } from "lucide-react";
import { useDemo } from "@/lib/store/demo";

export function Toasts() {
  const toasts = useDemo((s) => s.toasts);
  const dismiss = useDemo((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:pl-60">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex max-w-md animate-enter items-center gap-2.5 rounded-[10px] border border-line bg-surface px-4 py-2.5 text-left text-sm text-ink shadow-[0_6px_24px_-12px_rgba(29,35,32,0.25)]"
        >
          {t.tone === "positive" && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Check className="size-3.5" strokeWidth={2.25} />
            </span>
          )}
          {t.text}
        </button>
      ))}
    </div>
  );
}
