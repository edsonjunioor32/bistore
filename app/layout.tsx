import type { Metadata } from "next";
import "./globals.css";
import { storeConfig } from "@/lib/store";

export const metadata: Metadata = {
  title: `${storeConfig.name} | Controle de Estoque e Vendas`,
  description: "Controle de estoque, vendas, despesas e relatórios para uma única loja.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const style = {
    "--brand-primary": storeConfig.primaryColor,
    "--brand-secondary": storeConfig.secondaryColor,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR">
      <body style={style}>
        <div className="appShell">
          <aside className="sidebar">
            <div className="storeBrand">
              <span className="storeMark">{storeConfig.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{storeConfig.name}</strong>
                <small>Estoque e Vendas</small>
              </div>
            </div>

            <nav className="navMenu" aria-label="Menu principal">
              <a className="navItem active" href="#dashboard">Dashboard</a>
              <a className="navItem" href="#produtos">Produtos</a>
              <a className="navItem" href="#estoque">Estoque</a>
              <a className="navItem" href="#vendas">Vendas</a>
              <a className="navItem" href="#despesas">Despesas</a>
              <a className="navItem" href="#relatorios">Relatórios</a>
              <a className="navItem" href="#usuarios">Usuários</a>
              <a className="navItem" href="#auditoria">Auditoria</a>
              <a className="navItem" href="#configuracoes">Configurações</a>
            </nav>

            <div className="sidebarFooter">
              <span>Bistore</span>
              <small>Template de loja única</small>
            </div>
          </aside>
          <div className="contentArea">{children}</div>
        </div>
      </body>
    </html>
  );
}
