import Link from "next/link";
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
    <main className="main landing">
      <section className="landingHero">
        <div className="heroCopy">
          <span className="eyebrow">Bistore · gestão white label</span>
          <h1>Estoque, vendas e precificação em um único sistema.</h1>
          <p>
            Uma base multi-loja criada para pequenos varejistas controlarem produtos,
            variações, estoque, vendas, despesas, usuários, relatórios e integrações sem
            misturar os dados de cada operação.
          </p>
          <div className="heroActions">
            <Link className="primaryButton linkButton" href="/loja/demo/">
              Acessar demonstração
            </Link>
            <a className="secondaryButton" href="https://github.com/edsonjunioor32/bistore">
              Ver projeto no GitHub
            </a>
          </div>
        </div>
        <div className="heroPanel" aria-label="Resumo da plataforma">
          <span className="panelLabel">Loja de demonstração</span>
          <strong>{store.branding.name}</strong>
          <div className="panelRow">
            <span>Arquitetura</span>
            <b>Multi-tenant</b>
          </div>
          <div className="panelRow">
            <span>Dados por loja</span>
            <b>Isolados</b>
          </div>
          <div className="panelRow">
            <span>Moeda</span>
            <b>{store.branding.currency}</b>
          </div>
        </div>
      </section>

      <section className="featureGrid" aria-label="Recursos principais">
        <article className="featureCard">
          <span className="featureNumber">01</span>
          <h2>Estoque por variação</h2>
          <p>Produtos organizados por modelo, cor, tamanho e SKU, com histórico de movimentações.</p>
        </article>
        <article className="featureCard">
          <span className="featureNumber">02</span>
          <h2>Vendas e pagamentos</h2>
          <p>Registro de vendas, parcelas, canais, formas de pagamento, cancelamentos e devoluções.</p>
        </article>
        <article className="featureCard">
          <span className="featureNumber">03</span>
          <h2>Lotes de despesas</h2>
          <p>Cada compra pode usar seu próprio lote de custos, quantidade para rateio e markup.</p>
        </article>
      </section>

      <section className="pricingShowcase">
        <div>
          <span className="eyebrow">Exemplo de precificação</span>
          <h2>Regra simples, histórica e rastreável.</h2>
          <p>
            O Bistore preserva a fórmula consolidada do projeto: despesa por peça +
            (custo × markup). O lote escolhido fica vinculado ao produto.
          </p>
        </div>
        <div className="priceBox">
          <span>Preço mínimo calculado</span>
          <strong>
            {formatMoney(pricing.minimumPriceCents, store.branding.locale, store.branding.currency)}
          </strong>
          <small>Exemplo demonstrativo, sem dados reais de loja.</small>
        </div>
      </section>

      <footer className="siteFooter">
        <strong>Bistore</strong>
        <span>Base white label para gestão de estoque e vendas.</span>
      </footer>
    </main>
  );
}
