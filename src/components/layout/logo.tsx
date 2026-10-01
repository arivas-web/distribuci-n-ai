import { brand } from "@config/brand";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
        <rect width="24" height="24" rx="7" className="fill-accent" />
        <path d="M6 14.5c2.2-3.4 4.4-3.4 6 0s3.8 3.4 6 0" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="8.2" r="1.6" fill="white" />
      </svg>
      <div className="min-w-0 leading-tight">
        <div className="text-[15px] font-medium tracking-tight text-ink">{brand.productName}</div>
        {!compact && <div className="truncate text-xs text-ink-subtle">{brand.company.name}</div>}
      </div>
    </div>
  );
}
