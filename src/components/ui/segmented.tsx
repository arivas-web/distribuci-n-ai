"use client";

import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; count?: number }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("inline-flex flex-wrap gap-1 rounded-[10px] bg-sunken p-1", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[7px] font-medium whitespace-nowrap text-ink-muted transition-colors hover:text-ink",
            size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
            value === o.value && "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]",
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular text-ink-subtle">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
