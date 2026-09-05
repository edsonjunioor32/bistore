import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bistore",
  description: "Gestão white label de estoque e vendas",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="brand">Bistore</div>
            <div className="badge">Plataforma white label</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
