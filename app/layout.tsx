import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";

export const metadata: Metadata = {
  title: "Bistore | Controle de Estoque e Vendas",
  description: "Sistema de estoque, vendas, despesas, relatórios e operação de uma única loja.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
