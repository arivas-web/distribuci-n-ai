"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/20 data-[state=open]:animate-fade" />
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-canvas outline-none sm:max-w-[600px] sm:border-l sm:border-line",
            "data-[state=open]:animate-[sheet-in_280ms_cubic-bezier(0.2,0.7,0.2,1)]",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="truncate text-base font-medium text-ink">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">Detalle</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="-mr-2 rounded-lg p-2 text-ink-subtle hover:bg-sunken hover:text-ink" aria-label="Cerrar">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
