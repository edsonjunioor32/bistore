import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "Bi Store | Controle de Estoque e Vendas",
  description: "Sistema de estoque, vendas, despesas e relatórios da Bi Store.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
