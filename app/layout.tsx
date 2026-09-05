import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import "./auth.css";
import "./brand.css";
import "./brand-fix.css";

export const metadata: Metadata = {
  title: "Bi Store | Controle de Estoque e Vendas",
  description: "Sistema de estoque, vendas, despesas e relatórios da Bi Store.",
};

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath = isGitHubPages && repositoryName ? `/${repositoryName}` : "";

const brandStyle = {
  "--brand-logo-url": `url("${basePath}/brand/bi-store-logo.svg")`,
} as CSSProperties;

const migrateBiStoreIdentity = `
(() => {
  try {
    const key = "bistore.single-store.v2";
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || !data.settings) return;

    const oldDefaultNames = ["Minha Loja", "Sua Loja", "Bistore", "Bistore Demo"];
    if (oldDefaultNames.includes(data.settings.name)) data.settings.name = "Bi Store";

    const instagram = String(data.settings.instagram || "").trim().toLowerCase();
    const oldInstagramValues = ["", "@bistore_use", "bistore_use", "@bi_store_use", "bi_store_use"];
    if (oldInstagramValues.includes(instagram)) data.settings.instagram = "@bi_storeuse";

    if (!data.settings.primaryColor || data.settings.primaryColor.toLowerCase() === "#111827") {
      data.settings.primaryColor = "#e76c5f";
    }
    if (!data.settings.secondaryColor || data.settings.secondaryColor.toLowerCase() === "#f3f4f6") {
      data.settings.secondaryColor = "#efc9ba";
    }

    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {
    // A identidade visual não deve impedir a aplicação de carregar.
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body style={brandStyle}>
        <script dangerouslySetInnerHTML={{ __html: migrateBiStoreIdentity }} />
        {children}
      </body>
    </html>
  );
}
