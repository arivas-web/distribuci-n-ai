import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { brand } from "@config/brand";
import { AppShell } from "@/components/layout/app-shell";
import { BaseDataProvider } from "@/components/providers/base-data";
import { getBaseData } from "@/lib/data/base";

export const metadata: Metadata = {
  title: { default: brand.productName, template: `%s · ${brand.productName}` },
  description: `${brand.productName} gestiona la relación comercial de ${brand.company.name} con sus clientes.`,
};

export const viewport: Viewport = {
  themeColor: "#f8f6f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const base = getBaseData();
  return (
    <html lang="es">
      <body>
        <BaseDataProvider value={base}>
          <AppShell>{children}</AppShell>
        </BaseDataProvider>
      </body>
    </html>
  );
}
