import type { Store } from "@/lib/types";

const demoStores: Store[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    active: true,
    branding: {
      name: "Bistore Demo",
      slug: "demo",
      primaryColor: "#111827",
      secondaryColor: "#F3F4F6",
      currency: "BRL",
      locale: "pt-BR",
      timezone: "America/Fortaleza",
    },
  },
];

/**
 * Adaptador temporário até a conexão do PostgreSQL/Supabase.
 * A interface já trabalha por tenant; trocar esta implementação por consulta ao banco
 * não exige alterar as páginas consumidoras.
 */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  return demoStores.find((store) => store.active && store.branding.slug === slug) ?? null;
}

export async function getDefaultStore(): Promise<Store> {
  const slug = process.env.DEFAULT_STORE_SLUG ?? "demo";
  const store = await getStoreBySlug(slug);

  if (!store) {
    throw new Error(`Default store '${slug}' was not found`);
  }

  return store;
}
