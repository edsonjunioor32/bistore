import type { Metadata } from "next";
import "./globals.css";
import { getDefaultStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Bistore",
  description: "Gestão white label de estoque e vendas",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await getDefaultStore();

  const cssVars = {
    "--brand-primary": store.branding.primaryColor,
    "--brand-secondary": store.branding.secondaryColor,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR">
      <body style={cssVars}>
        <div className="shell">
          <header className="topbar">
            <div className="brand">{store.branding.name}</div>
            <div className="badge">Bistore · white label</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
