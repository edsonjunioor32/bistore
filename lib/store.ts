import type { StoreConfig } from "@/lib/types";

/**
 * Configuração da única loja desta instalação.
 * Ao duplicar o repositório para outra empresa, basta alterar as variáveis
 * de ambiente ou, futuramente, preencher os mesmos dados pelo menu Configurações.
 */
export const storeConfig: StoreConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Sua Loja",
  legalName: process.env.NEXT_PUBLIC_STORE_LEGAL_NAME || undefined,
  logoUrl: process.env.NEXT_PUBLIC_STORE_LOGO_URL || undefined,
  faviconUrl: process.env.NEXT_PUBLIC_STORE_FAVICON_URL || undefined,
  primaryColor: process.env.NEXT_PUBLIC_STORE_PRIMARY_COLOR ?? "#111827",
  secondaryColor: process.env.NEXT_PUBLIC_STORE_SECONDARY_COLOR ?? "#F3F4F6",
  currency: "BRL",
  locale: "pt-BR",
  timezone: process.env.NEXT_PUBLIC_STORE_TIMEZONE ?? "America/Fortaleza",
  email: process.env.NEXT_PUBLIC_STORE_EMAIL || undefined,
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || undefined,
  whatsapp: process.env.NEXT_PUBLIC_STORE_WHATSAPP || undefined,
  instagram: process.env.NEXT_PUBLIC_STORE_INSTAGRAM || undefined,
};
