import { calculateMinimumPrice, formatMoney } from "@/lib/pricing";
import { storeConfig } from "@/lib/store";

const modules = [
  ["produtos", "Produtos", "Cadastre modelos, cores, tamanhos, SKU, custos e preços."],
  ["estoque", "Estoque", "Controle entradas, saídas, ajustes, trocas, devoluções e estoque mínimo."],
  ["vendas", "Vendas", "Registre vendas, itens, canais, pagamentos, parcelas e cancelamentos."],
  ["despesas", "Despesas", "Crie lotes por compra, informe gastos, rateio por peça e markup."],
  ["relatorios", "Relatórios", "Consulte estoque e vendas por período e exporte CSV/PDF."],
  ["usuarios", "Usuários", "Gerencie administradores e vendedores da loja."],
  ["auditoria", "Auditoria", "Acompanhe o histórico de alterações e operações realizadas."],
  ["configuracoes", "Configurações", "Defina dados da loja, identidade visual, Telegram e preferências."],
] as const;

export default function Home() {
  const pricing = calculateMinimumPrice({
    costCents: 3500,
    expensesTotalCents: 48557,
    batchItemCount: 59,
    markup: 1.6,
  });

  return (
    <main className="dashboardPage" id="dashboard">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">Painel principal</span>
          <h1>Olá, {storeConfig.name}</h1>
          <p>Acompanhe estoque, vendas e indicadores da sua loja em um único lugar.</p>
        </div>
        <div className="headerActions">
          <a className="secondaryButton" href="#produtos">Novo produto</a>
          <a className="primaryButton" href="#vendas">Nova venda</a>
        </div>
      </header>

      <section className="periodBar" aria-label="Período do dashboard">
        <button className="periodButton active" type="button">Hoje</button>
        <button className="periodButton" type="button">7 dias</button>
        <button className="periodButton" type="button">Este mês</button>
      </section>

      <section className="kpiGrid" aria-label="Indicadores principais">
        <article className="kpiCard">
          <span>Vendas</span>
          <strong>0</strong>
          <small>no período selecionado</small>
        </article>
        <article className="kpiCard">
          <span>Faturamento bruto</span>
          <strong>R$ 0,00</strong>
          <small>total vendido</small>
        </article>
        <article className="kpiCard">
          <span>Valor líquido</span>
          <strong>R$ 0,00</strong>
          <small>após taxas registradas</small>
        </article>
        <article className="kpiCard">
          <span>Ticket médio</span>
          <strong>R$ 0,00</strong>
          <small>por venda</small>
        </article>
      </section>

      <section className="dashboardGrid">
        <article className="panelCard wideCard">
          <div className="panelHeader">
            <div>
              <span className="eyebrow">Resumo de vendas</span>
              <h2>Vendas recentes</h2>
            </div>
            <a href="#vendas">Ver vendas</a>
          </div>
          <div className="emptyState">
            <strong>Nenhuma venda registrada</strong>
            <p>As vendas da loja aparecerão aqui assim que a base de dados estiver conectada.</p>
          </div>
        </article>

        <article className="panelCard">
          <span className="eyebrow">Estoque</span>
          <h2>Atenção necessária</h2>
          <div className="stockSummary">
            <div><strong>0</strong><span>Estoque baixo</span></div>
            <div><strong>0</strong><span>Sem estoque</span></div>
          </div>
          <a className="textLink" href="#estoque">Abrir estoque</a>
        </article>
      </section>

      <section className="sectionBlock" id="despesas">
        <div className="sectionTitle">
          <div>
            <span className="eyebrow">Precificação</span>
            <h2>Lotes de despesas</h2>
          </div>
          <span className="formulaBadge">despesa/peça + (custo × markup)</span>
        </div>
        <div className="pricingCard">
          <div>
            <h3>Regra preservada da LLL Essence</h3>
            <p>
              Cada produto fica vinculado ao lote de despesas escolhido no cadastro. Compras futuras
              não alteram retroativamente a precificação dos produtos anteriores.
            </p>
          </div>
          <div className="priceExample">
            <span>Exemplo de preço mínimo</span>
            <strong>{formatMoney(pricing.minimumPriceCents, storeConfig.locale, storeConfig.currency)}</strong>
            <small>valor demonstrativo, sem dados reais</small>
          </div>
        </div>
      </section>

      <section className="sectionBlock" aria-label="Módulos do sistema">
        <div className="sectionTitle">
          <div>
            <span className="eyebrow">Sistema</span>
            <h2>Módulos da loja</h2>
          </div>
        </div>
        <div className="moduleGrid">
          {modules.map(([id, title, description], index) => (
            <article className="moduleCard" id={id} key={id}>
              <span className="moduleNumber">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="implementationNotice">
        <strong>Instalação independente</strong>
        <p>
          Este repositório representa uma única loja. Para usar o sistema em outra empresa, duplique
          o repositório, conecte uma nova base de dados e altere apenas os dados e a identidade da loja.
        </p>
      </section>
    </main>
  );
}
