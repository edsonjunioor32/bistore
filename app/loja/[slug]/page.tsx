import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export default async function StoreHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) notFound();

  const modules = [
    ["Produtos", "Cadastro por modelo, cor, tamanho, SKU, custo e valor de venda."],
    ["Estoque", "Entradas, saídas, ajustes, reservas, trocas, devoluções e estoque mínimo."],
    ["Vendas", "Pedidos, pagamentos, parcelas, canais, histórico e totalizadores."],
    ["Despesas", "Lotes independentes por compra, rateio por peça e markup."],
    ["Relatórios", "Estoque, vendas, produtos, pagamentos e exportações."],
    ["Usuários", "Administrador, vendedor, permissões e trilha de auditoria."],
  ];

  return (
    <main className="main dashboard">
      <section className="dashboardHero">
        <div>
          <span className="eyebrow">Ambiente de demonstração</span>
          <h1>Painel da {store.branding.name}</h1>
          <p>
            Estrutura white label pronta para receber os dados da loja. Cada tenant mantém
            produtos, estoque, vendas, despesas, usuários e integrações isolados.
          </p>
        </div>
        <button className="primaryButton" type="button">Nova venda</button>
      </section>

      <section className="kpiGrid" aria-label="Indicadores de demonstração">
        <article className="kpiCard">
          <span>Vendas hoje</span>
          <strong>R$ 0,00</strong>
          <small>Base ainda sem dados reais</small>
        </article>
        <article className="kpiCard">
          <span>Peças em estoque</span>
          <strong>0</strong>
          <small>Cadastre ou migre produtos</small>
        </article>
        <article className="kpiCard">
          <span>Estoque baixo</span>
          <strong>0</strong>
          <small>Nenhum alerta no momento</small>
        </article>
        <article className="kpiCard">
          <span>Faturamento do mês</span>
          <strong>R$ 0,00</strong>
          <small>Somatório das vendas confirmadas</small>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">Operação</span>
            <h2>Módulos da loja</h2>
          </div>
          <span className="tenantTag">Tenant: {store.branding.slug}</span>
        </div>

        <div className="moduleGrid">
          {modules.map(([title, description]) => (
            <article className="moduleCard" key={title}>
              <div className="moduleIcon" aria-hidden="true">{title.slice(0, 1)}</div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock noticeCard">
        <div>
          <span className="eyebrow">Precificação</span>
          <h2>Regra preservada do projeto original</h2>
          <p>
            O preço mínimo utiliza <strong>despesa por peça + (custo × markup)</strong>, com o
            produto vinculado ao lote de despesas escolhido no cadastro.
          </p>
        </div>
      </section>
    </main>
  );
}
