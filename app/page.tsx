import { calculateMinimumPrice, formatMoney } from "@/lib/pricing";
import { getDefaultStore } from "@/lib/store";

export default async function Home() {
  const store = await getDefaultStore();
  const pricing = calculateMinimumPrice({
    costCents: 3500,
    expensesTotalCents: 48557,
    batchItemCount: 59,
    markup: 1.6,
  });

  return (
    <main className="main">
      <section className="hero">
        <h1>Gestão de estoque e vendas, pronta para várias lojas.</h1>
        <p>
          Esta é a fundação white label do Bistore. A interface, regras e dados são resolvidos
          por loja, permitindo que cada operação tenha sua própria marca, usuários, produtos,
          estoque, vendas, despesas e integrações.
        </p>
      </section>

      <section className="grid" aria-label="Resumo da plataforma">
        <article className="card">
          <h2>Loja ativa</h2>
          <p>Tenant carregado pelo contexto da aplicação.</p>
          <div className="metric">{store.branding.name}</div>
        </article>

        <article className="card">
          <h2>Isolamento de dados</h2>
          <p>Produtos, vendas, usuários e relatórios pertencem sempre a um store_id.</p>
          <div className="metric status">Ativo</div>
        </article>

        <article className="card">
          <h2>Precificação</h2>
          <p>Despesa por peça + (custo × markup), preservando a regra consolidada.</p>
          <div className="metric">
            {formatMoney(pricing.minimumPriceCents, store.branding.locale, store.branding.currency)}
          </div>
        </article>
      </section>

      <p className="footer">
        Fundação inicial do Bistore. Próximos módulos: autenticação, produtos, estoque,
        vendas, despesas, relatórios, Telegram e painel de super administrador.
      </p>
    </main>
  );
}
