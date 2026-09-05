import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store";

export default async function StoreHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  return (
    <main className="main">
      <section className="hero">
        <h1>{store.branding.name}</h1>
        <p>
          Ambiente isolado da loja. Os próximos módulos deste tenant serão produtos, estoque,
          vendas, pagamentos, lotes de despesas, relatórios, usuários e Telegram.
        </p>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Produtos</h2>
          <p>Cadastro por modelo, cor, tamanho e SKU.</p>
        </article>
        <article className="card">
          <h2>Vendas</h2>
          <p>Pedidos, pagamentos, parcelas, canais e histórico.</p>
        </article>
        <article className="card">
          <h2>Despesas</h2>
          <p>Lotes independentes por compra, rateio e markup.</p>
        </article>
      </section>
    </main>
  );
}
