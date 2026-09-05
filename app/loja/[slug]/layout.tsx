import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store";

export default async function StoreLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  const style = {
    "--brand-primary": store.branding.primaryColor,
    "--brand-secondary": store.branding.secondaryColor,
  } as React.CSSProperties;

  return (
    <div style={style}>
      <header className="topbar">
        <div className="brand">{store.branding.name}</div>
        <div className="badge">Loja: {store.branding.slug}</div>
      </header>
      {children}
    </div>
  );
}
