"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { calculateMinimumPrice, formatMoney } from "@/lib/pricing";
import {
  AppData,
  AppUser,
  AuditEntry,
  Channel,
  Expense,
  ExpenseBatch,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  SalePayment,
  StockMovement,
  centsToInput,
  emptyAppData,
  formatDateTime,
  makeId,
  moneyToCents,
  nowIso,
  storageKey,
} from "@/lib/app-data";

type Tab = "dashboard" | "products" | "stock" | "sales" | "expenses" | "reports" | "users" | "audit" | "settings";
type Period = "today" | "7days" | "month";

const channels: Channel[] = ["Loja física", "Instagram", "WhatsApp", "Telegram", "Site", "Marketplace", "Outro"];
const paymentMethods: PaymentMethod[] = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Transferência", "Boleto", "Link de pagamento", "Outro"];

function cloneEmptyData(): AppData {
  return JSON.parse(JSON.stringify(emptyAppData)) as AppData;
}

function inPeriod(iso: string, period: Period) {
  const date = new Date(iso);
  const now = new Date();
  if (period === "today") return date.toDateString() === now.toDateString();
  if (period === "7days") return date.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function BistoreApp() {
  const [data, setData] = useState<AppData>(cloneEmptyData);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [period, setPeriod] = useState<Period>("today");
  const [message, setMessage] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setData(JSON.parse(stored) as AppData);
    } catch {
      setMessage("Não foi possível carregar os dados salvos neste navegador.");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, hydrated]);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  }

  function audit(action: string, entity: string, details: string, actor = "Administrador") {
    const entry: AuditEntry = { id: makeId("aud"), action, entity, details, actor, createdAt: nowIso() };
    setData((current) => ({ ...current, audit: [entry, ...current.audit].slice(0, 500) }));
  }

  const activeSales = useMemo(() => data.sales.filter((sale) => sale.status === "Confirmada" && inPeriod(sale.createdAt, period)), [data.sales, period]);
  const revenue = activeSales.reduce((sum, sale) => sum + sale.totalCents, 0);
  const netRevenue = activeSales.reduce((sum, sale) => sum + sale.netCents, 0);
  const piecesSold = activeSales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const inventoryCost = data.products.reduce((sum, product) => sum + product.stock * product.costCents, 0);
  const inventoryPotential = data.products.reduce((sum, product) => sum + product.stock * product.salePriceCents, 0);
  const lowStock = data.products.filter((product) => product.active && product.stock > 0 && product.stock <= product.minimumStock);
  const outOfStock = data.products.filter((product) => product.active && product.stock <= 0);

  const style = {
    "--brand-primary": data.settings.primaryColor,
    "--brand-secondary": data.settings.secondaryColor,
  } as React.CSSProperties;

  const tabs: Array<[Tab, string]> = [
    ["dashboard", "Painel"], ["products", "Produtos"], ["stock", "Estoque"], ["sales", "Vendas"], ["expenses", "Despesas"],
    ["reports", "Relatórios"], ["users", "Usuários"], ["audit", "Auditoria"], ["settings", "Configurações"],
  ];

  if (!hydrated) return <main className="appLoading">Carregando Bistore…</main>;

  return (
    <div className={dark ? "appRoot dark" : "appRoot"} style={style}>
      <aside className="sidebar">
        <div className="storeMark"><span className="logoDot">B</span><div><strong>{data.settings.name}</strong><small>Bistore</small></div></div>
        <nav className="navList" aria-label="Navegação principal">
          {tabs.map(([id, label]) => <button key={id} className={tab === id ? "navButton active" : "navButton"} onClick={() => setTab(id)}>{label}</button>)}
        </nav>
        <div className="sidebarBottom"><button className="ghostButton" onClick={() => setDark((value) => !value)}>{dark ? "Modo claro" : "Modo escuro"}</button></div>
      </aside>

      <div className="workspace">
        <header className="appHeader">
          <div><strong>{tabs.find(([id]) => id === tab)?.[1]}</strong><span> {data.settings.name}</span></div>
          <div className="headerActions"><span className="statusPill">Dados locais</span><button className="primaryButton" onClick={() => setTab("sales")}>Nova venda</button></div>
        </header>
        {message && <div className="toast" role="status">{message}</div>}

        <main className="contentArea">
          {tab === "dashboard" && <Dashboard period={period} setPeriod={setPeriod} sales={activeSales} revenue={revenue} netRevenue={netRevenue} piecesSold={piecesSold} lowStock={lowStock} outOfStock={outOfStock} inventoryCost={inventoryCost} inventoryPotential={inventoryPotential} />}
          {tab === "products" && <Products data={data} setData={setData} flash={flash} audit={audit} />}
          {tab === "stock" && <Stock data={data} setData={setData} flash={flash} audit={audit} />}
          {tab === "sales" && <Sales data={data} setData={setData} flash={flash} audit={audit} />}
          {tab === "expenses" && <Expenses data={data} setData={setData} flash={flash} audit={audit} />}
          {tab === "reports" && <Reports data={data} />}
          {tab === "users" && <Users data={data} setData={setData} flash={flash} audit={audit} />}
          {tab === "audit" && <Audit data={data} />}
          {tab === "settings" && <Settings data={data} setData={setData} flash={flash} audit={audit} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ period, setPeriod, sales, revenue, netRevenue, piecesSold, lowStock, outOfStock, inventoryCost, inventoryPotential }: {
  period: Period; setPeriod: (value: Period) => void; sales: Sale[]; revenue: number; netRevenue: number; piecesSold: number; lowStock: Product[]; outOfStock: Product[]; inventoryCost: number; inventoryPotential: number;
}) {
  const ticket = sales.length ? Math.round(revenue / sales.length) : 0;
  return <>
    <section className="pageTitle"><div><span className="eyebrow">Visão geral</span><h1>Painel da loja</h1><p>Acompanhe vendas, faturamento e estoque no período selecionado.</p></div><div className="segmented">{(["today", "7days", "month"] as Period[]).map((item) => <button key={item} className={period === item ? "selected" : ""} onClick={() => setPeriod(item)}>{item === "today" ? "Hoje" : item === "7days" ? "7 dias" : "Este mês"}</button>)}</div></section>
    <section className="kpiGrid">
      <Kpi label="Vendas" value={String(sales.length)} note={`${piecesSold} peça(s) vendida(s)`} />
      <Kpi label="Faturamento bruto" value={formatMoney(revenue)} note={`Líquido ${formatMoney(netRevenue)}`} />
      <Kpi label="Ticket médio" value={formatMoney(ticket)} note="Vendas confirmadas" />
      <Kpi label="Estoque crítico" value={String(lowStock.length + outOfStock.length)} note={`${outOfStock.length} produto(s) sem estoque`} />
    </section>
    <section className="twoColumns">
      <div className="panel"><div className="panelHeader"><h2>Vendas recentes</h2></div>{sales.length === 0 ? <Empty text="Nenhuma venda neste período." /> : <div className="tableWrap"><table><thead><tr><th>Venda</th><th>Data</th><th>Canal</th><th>Total</th></tr></thead><tbody>{sales.slice(0, 8).map((sale) => <tr key={sale.id}><td>{sale.number}</td><td>{formatDateTime(sale.createdAt)}</td><td>{sale.channel}</td><td>{formatMoney(sale.totalCents)}</td></tr>)}</tbody></table></div>}</div>
      <div className="panel"><div className="panelHeader"><h2>Resumo do estoque</h2></div><div className="summaryList"><div><span>Custo total</span><strong>{formatMoney(inventoryCost)}</strong></div><div><span>Venda potencial</span><strong>{formatMoney(inventoryPotential)}</strong></div><div><span>Estoque baixo</span><strong>{lowStock.length}</strong></div><div><span>Sem estoque</span><strong>{outOfStock.length}</strong></div></div></div>
    </section>
  </>;
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) { return <article className="kpiCard"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }
function Empty({ text }: { text: string }) { return <div className="emptyState">{text}</div>; }

function Products({ data, setData, flash, audit }: CommonProps) {
  const [form, setForm] = useState({ internalCode: "", name: "", model: "", category: "", brand: "", sku: "", color: "", size: "", cost: "", salePrice: "", minStock: "1", batchId: "" });
  const selectedBatch = data.expenseBatches.find((batch) => batch.id === form.batchId);
  const costCents = moneyToCents(form.cost);
  const minimum = selectedBatch ? calculateMinimumPrice({ costCents, expensesTotalCents: selectedBatch.expenses.reduce((sum, expense) => sum + expense.valueCents, 0), batchItemCount: selectedBatch.itemCount, markup: selectedBatch.markup }).minimumPriceCents : 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name || !form.sku) return flash("Informe o nome e o SKU do produto.");
    if (data.products.some((product) => product.sku.toLowerCase() === form.sku.toLowerCase())) return flash("Este SKU já está cadastrado.");
    const product: Product = { id: makeId("prd"), internalCode: form.internalCode, name: form.name, model: form.model, category: form.category, brand: form.brand, description: "", sku: form.sku, color: form.color, size: form.size, costCents, salePriceCents: moneyToCents(form.salePrice), promotionalPriceCents: null, minimumPriceCents: minimum, stock: 0, reserved: 0, minimumStock: Number(form.minStock || 0), barcode: "", expenseBatchId: form.batchId || null, active: true, createdAt: nowIso() };
    setData((current) => ({ ...current, products: [product, ...current.products] }));
    audit("Criou produto", "Produto", `${product.name} · ${product.sku}`);
    setForm({ internalCode: "", name: "", model: "", category: "", brand: "", sku: "", color: "", size: "", cost: "", salePrice: "", minStock: "1", batchId: "" });
    flash("Produto cadastrado. Faça uma entrada para adicionar estoque.");
  }

  function toggle(product: Product) {
    setData((current) => ({ ...current, products: current.products.map((item) => item.id === product.id ? { ...item, active: !item.active } : item) }));
    audit(product.active ? "Inativou produto" : "Ativou produto", "Produto", product.sku);
  }

  return <>
    <section className="pageTitle"><div><span className="eyebrow">Catálogo</span><h1>Produtos e variações</h1><p>Cada combinação de modelo, cor e tamanho possui SKU próprio.</p></div></section>
    <section className="panel"><div className="panelHeader"><h2>Novo produto</h2></div><form className="formGrid" onSubmit={submit}>
      <Field label="Código interno"><input value={form.internalCode} onChange={(e) => setForm({ ...form, internalCode: e.target.value })} /></Field>
      <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Field label="Modelo"><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
      <Field label="Categoria"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
      <Field label="Marca"><input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field>
      <Field label="SKU"><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} /></Field>
      <Field label="Cor"><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
      <Field label="Tamanho"><input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value.toUpperCase() })} /></Field>
      <Field label="Custo"><input inputMode="decimal" placeholder="0,00" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></Field>
      <Field label="Preço de venda"><input inputMode="decimal" placeholder="0,00" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} /></Field>
      <Field label="Estoque mínimo"><input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} /></Field>
      <Field label="Lote de despesas"><select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}><option value="">Sem lote</option>{data.expenseBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></Field>
      {selectedBatch && <div className="formulaBox">Preço mínimo: <strong>{formatMoney(minimum)}</strong><small>Despesa por peça + (custo × markup)</small></div>}
      <div className="formActions"><button className="primaryButton" type="submit">Cadastrar produto</button></div>
    </form></section>
    <section className="panel"><div className="panelHeader"><h2>Produtos cadastrados</h2><span>{data.products.length}</span></div>{data.products.length === 0 ? <Empty text="Nenhum produto cadastrado." /> : <div className="tableWrap"><table><thead><tr><th>Produto</th><th>Variação</th><th>SKU</th><th>Estoque</th><th>Custo</th><th>Venda</th><th>Mínimo</th><th></th></tr></thead><tbody>{data.products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.model}</small></td><td>{[product.color, product.size].filter(Boolean).join(" · ") || "—"}</td><td>{product.sku}</td><td>{product.stock}</td><td>{formatMoney(product.costCents)}</td><td>{formatMoney(product.salePriceCents)}</td><td>{product.minimumPriceCents ? formatMoney(product.minimumPriceCents) : "—"}</td><td><button className="textButton" onClick={() => toggle(product)}>{product.active ? "Inativar" : "Ativar"}</button></td></tr>)}</tbody></table></div>}</section>
  </>;
}

function Stock({ data, setData, flash, audit }: CommonProps) {
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<StockMovement["type"]>("Entrada");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault(); const product = data.products.find((item) => item.id === productId); if (!product) return flash("Selecione um produto.");
    const qty = Math.abs(Number(quantity || 0)); if (!qty) return flash("Informe uma quantidade válida.");
    const negative = ["Perda/Avaria"].includes(type); const delta = negative ? -qty : type === "Ajuste" ? Number(quantity) : qty; const next = product.stock + delta;
    if (next < 0) return flash("O estoque não pode ficar negativo.");
    const movement: StockMovement = { id: makeId("mov"), productId: product.id, sku: product.sku, type, quantity: delta, previousStock: product.stock, newStock: next, reason, saleId: null, createdAt: nowIso() };
    setData((current) => ({ ...current, products: current.products.map((item) => item.id === product.id ? { ...item, stock: next } : item), movements: [movement, ...current.movements] }));
    audit("Movimentou estoque", "Estoque", `${product.sku}: ${product.stock} → ${next} (${type})`); flash("Movimentação registrada."); setReason("");
  }
  return <><section className="pageTitle"><div><span className="eyebrow">Movimentações</span><h1>Controle de estoque</h1><p>Entradas, ajustes, perdas, trocas e devoluções ficam registradas no histórico.</p></div></section>
    <section className="panel"><form className="formGrid compact" onSubmit={submit}><Field label="Produto"><select required value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Selecione</option>{data.products.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.color} {p.size} · {p.sku}</option>)}</select></Field><Field label="Movimentação"><select value={type} onChange={(e) => setType(e.target.value as StockMovement["type"])}><option>Entrada</option><option>Ajuste</option><option>Troca</option><option>Devolução</option><option>Perda/Avaria</option></select></Field><Field label="Quantidade"><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field><Field label="Motivo"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field><div className="formActions"><button className="primaryButton">Registrar</button></div></form></section>
    <section className="panel"><div className="panelHeader"><h2>Histórico</h2></div>{data.movements.length === 0 ? <Empty text="Nenhuma movimentação registrada." /> : <div className="tableWrap"><table><thead><tr><th>Data</th><th>SKU</th><th>Tipo</th><th>Qtd.</th><th>Anterior</th><th>Atual</th><th>Motivo</th></tr></thead><tbody>{data.movements.map((m) => <tr key={m.id}><td>{formatDateTime(m.createdAt)}</td><td>{m.sku}</td><td>{m.type}</td><td>{m.quantity}</td><td>{m.previousStock}</td><td>{m.newStock}</td><td>{m.reason || "—"}</td></tr>)}</tbody></table></div>}</section></>;
}

function Sales({ data, setData, flash, audit }: CommonProps) {
  const [productId, setProductId] = useState(""); const [qty, setQty] = useState("1"); const [unitPrice, setUnitPrice] = useState(""); const [itemDiscount, setItemDiscount] = useState("0");
  const [cart, setCart] = useState<SaleItem[]>([]); const [channel, setChannel] = useState<Channel>("Loja física"); const [customer, setCustomer] = useState(""); const [generalDiscount, setGeneralDiscount] = useState("0"); const [freight, setFreight] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Pix"); const [paymentValue, setPaymentValue] = useState(""); const [installments, setInstallments] = useState("1"); const [payments, setPayments] = useState<SalePayment[]>([]);
  const selected = data.products.find((p) => p.id === productId);
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPriceCents - item.discountCents, 0); const total = Math.max(0, subtotal - moneyToCents(generalDiscount) + moneyToCents(freight)); const paymentsTotal = payments.reduce((sum, p) => sum + p.valueCents, 0);
  useEffect(() => { if (selected) setUnitPrice(centsToInput(selected.promotionalPriceCents ?? selected.salePriceCents)); }, [productId]);
  useEffect(() => { setPaymentValue(centsToInput(Math.max(0, total - paymentsTotal))); }, [total, paymentsTotal]);

  function addItem() { if (!selected) return flash("Selecione um produto."); const quantity = Number(qty || 0); if (quantity <= 0 || quantity > selected.stock) return flash("Quantidade maior que o estoque disponível."); const existingInCart = cart.filter((i) => i.productId === selected.id).reduce((s, i) => s + i.quantity, 0); if (existingInCart + quantity > selected.stock) return flash("A quantidade total no carrinho supera o estoque."); setCart((current) => [...current, { productId: selected.id, sku: selected.sku, name: selected.name, color: selected.color, size: selected.size, quantity, unitPriceCents: moneyToCents(unitPrice), discountCents: moneyToCents(itemDiscount) }]); setQty("1"); setItemDiscount("0"); }
  function addPayment() { const value = moneyToCents(paymentValue); if (value <= 0) return flash("Informe o valor do pagamento."); setPayments((current) => [...current, { method: paymentMethod, valueCents: value, installments: Number(installments || 1), operatorFeeCents: 0 }]); }
  function confirmSale() {
    if (!cart.length) return flash("Adicione pelo menos um item."); if (paymentsTotal < total) return flash("Os pagamentos ainda não cobrem o total da venda.");
    for (const item of cart) { const product = data.products.find((p) => p.id === item.productId); if (!product || product.stock < item.quantity) return flash(`Estoque insuficiente para ${item.sku}.`); }
    const number = `V${String(data.sales.length + 1).padStart(6, "0")}`; const createdAt = nowIso(); const net = Math.max(0, total - payments.reduce((s, p) => s + p.operatorFeeCents, 0));
    const sale: Sale = { id: makeId("sale"), number, createdAt, channel, customer, items: cart, generalDiscountCents: moneyToCents(generalDiscount), freightCents: moneyToCents(freight), subtotalCents: subtotal, totalCents: total, netCents: net, payments, status: "Confirmada", seller: "Administrador" };
    const newMovements: StockMovement[] = cart.map((item) => { const product = data.products.find((p) => p.id === item.productId)!; return { id: makeId("mov"), productId: product.id, sku: product.sku, type: "Saída por venda", quantity: -item.quantity, previousStock: product.stock, newStock: product.stock - item.quantity, reason: `Venda ${number}`, saleId: sale.id, createdAt }; });
    setData((current) => ({ ...current, sales: [sale, ...current.sales], products: current.products.map((product) => { const sold = cart.filter((item) => item.productId === product.id).reduce((s, item) => s + item.quantity, 0); return sold ? { ...product, stock: product.stock - sold } : product; }), movements: [...newMovements, ...current.movements] }));
    audit("Registrou venda", "Venda", `${number} · ${formatMoney(total)}`); setCart([]); setPayments([]); setCustomer(""); setGeneralDiscount("0"); setFreight("0"); flash(`Venda ${number} registrada.`);
  }
  function cancelSale(sale: Sale) { if (sale.status !== "Confirmada") return; if (!window.confirm(`Cancelar ${sale.number} e devolver os itens ao estoque?`)) return; const returned = sale.items;
    setData((current) => ({ ...current, sales: current.sales.map((s) => s.id === sale.id ? { ...s, status: "Cancelada" } : s), products: current.products.map((product) => { const qtyBack = returned.filter((i) => i.productId === product.id).reduce((sum, item) => sum + item.quantity, 0); return qtyBack ? { ...product, stock: product.stock + qtyBack } : product; }), movements: [...returned.map((item) => { const product = current.products.find((p) => p.id === item.productId)!; return { id: makeId("mov"), productId: product.id, sku: product.sku, type: "Cancelamento de venda" as const, quantity: item.quantity, previousStock: product.stock, newStock: product.stock + item.quantity, reason: `Cancelamento ${sale.number}`, saleId: sale.id, createdAt: nowIso() }; }), ...current.movements] })); audit("Cancelou venda", "Venda", sale.number); flash("Venda cancelada e estoque devolvido."); }
  return <><section className="pageTitle"><div><span className="eyebrow">Pedidos</span><h1>Registrar venda</h1><p>Monte o carrinho, informe os pagamentos e confirme a baixa do estoque.</p></div></section>
    <section className="panel"><div className="panelHeader"><h2>Itens</h2></div><div className="formGrid compact"><Field label="Produto"><select value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">Selecione</option>{data.products.filter((p) => p.active && p.stock > 0).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.color} {p.size} · estoque {p.stock}</option>)}</select></Field><Field label="Qtd."><input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></Field><Field label="Preço unitário"><input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></Field><Field label="Desconto item"><input value={itemDiscount} onChange={(e) => setItemDiscount(e.target.value)} /></Field><div className="formActions"><button type="button" className="secondaryButton" onClick={addItem}>Adicionar item</button></div></div>
      {cart.length > 0 && <div className="cartList">{cart.map((item, index) => <div key={`${item.productId}-${index}`}><span>{item.quantity}× {item.name} · {item.color} {item.size}</span><strong>{formatMoney(item.quantity * item.unitPriceCents - item.discountCents)}</strong><button className="textButton" onClick={() => setCart((current) => current.filter((_, i) => i !== index))}>Remover</button></div>)}</div>}
    </section>
    <section className="panel"><div className="formGrid"><Field label="Canal"><select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>{channels.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Cliente (opcional)"><input value={customer} onChange={(e) => setCustomer(e.target.value)} /></Field><Field label="Desconto geral"><input value={generalDiscount} onChange={(e) => setGeneralDiscount(e.target.value)} /></Field><Field label="Frete"><input value={freight} onChange={(e) => setFreight(e.target.value)} /></Field></div>
      <div className="saleTotals"><span>Subtotal <b>{formatMoney(subtotal)}</b></span><strong>Total {formatMoney(total)}</strong></div>
      <div className="panelHeader sub"><h2>Pagamentos</h2><span>{formatMoney(paymentsTotal)} / {formatMoney(total)}</span></div><div className="formGrid compact"><Field label="Forma"><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Valor"><input value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)} /></Field><Field label="Parcelas"><input type="number" min="1" value={installments} onChange={(e) => setInstallments(e.target.value)} /></Field><div className="formActions"><button type="button" className="secondaryButton" onClick={addPayment}>Adicionar pagamento</button></div></div>
      {payments.map((payment, index) => <div className="paymentLine" key={index}><span>{payment.method} {payment.installments > 1 ? `· ${payment.installments}x` : ""}</span><strong>{formatMoney(payment.valueCents)}</strong><button className="textButton" onClick={() => setPayments((current) => current.filter((_, i) => i !== index))}>Remover</button></div>)}
      <div className="formActions end"><button className="primaryButton" type="button" onClick={confirmSale}>Confirmar venda</button></div>
    </section>
    <section className="panel"><div className="panelHeader"><h2>Histórico de vendas</h2></div>{data.sales.length === 0 ? <Empty text="Nenhuma venda registrada." /> : <div className="tableWrap"><table><thead><tr><th>Venda</th><th>Data</th><th>Canal</th><th>Pagamento</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>{data.sales.map((sale) => <tr key={sale.id}><td>{sale.number}</td><td>{formatDateTime(sale.createdAt)}</td><td>{sale.channel}</td><td>{sale.payments.map((p) => p.method).join(" + ")}</td><td>{formatMoney(sale.totalCents)}</td><td>{sale.status}</td><td>{sale.status === "Confirmada" && <button className="textButton danger" onClick={() => cancelSale(sale)}>Cancelar</button>}</td></tr>)}</tbody></table></div>}</section></>;
}

function Expenses({ data, setData, flash, audit }: CommonProps) {
  const [batch, setBatch] = useState({ name: "", date: new Date().toISOString().slice(0, 10), count: "1", markup: "1,6" }); const [selectedBatchId, setSelectedBatchId] = useState(""); const [expense, setExpense] = useState({ description: "", category: "", date: new Date().toISOString().slice(0, 10), value: "" });
  function createBatch(event: FormEvent) { event.preventDefault(); if (!batch.name) return flash("Informe o nome do lote."); const newBatch: ExpenseBatch = { id: makeId("batch"), name: batch.name, purchaseDate: batch.date, itemCount: Math.max(1, Number(batch.count)), markup: Number(batch.markup.replace(",", ".")) || 1, expenses: [], createdAt: nowIso() }; setData((c) => ({ ...c, expenseBatches: [newBatch, ...c.expenseBatches] })); setSelectedBatchId(newBatch.id); audit("Criou lote", "Despesas", newBatch.name); flash("Lote criado."); setBatch({ name: "", date: new Date().toISOString().slice(0, 10), count: "1", markup: "1,6" }); }
  function addExpense(event: FormEvent) { event.preventDefault(); if (!selectedBatchId) return flash("Selecione um lote."); if (!expense.description || moneyToCents(expense.value) <= 0) return flash("Informe descrição e valor."); const item: Expense = { id: makeId("exp"), description: expense.description, category: expense.category, date: expense.date, valueCents: moneyToCents(expense.value) }; setData((c) => ({ ...c, expenseBatches: c.expenseBatches.map((b) => b.id === selectedBatchId ? { ...b, expenses: [...b.expenses, item] } : b) })); audit("Adicionou despesa", "Despesas", `${item.description} · ${formatMoney(item.valueCents)}`); setExpense({ description: "", category: "", date: new Date().toISOString().slice(0, 10), value: "" }); flash("Despesa adicionada ao lote."); }
  return <><section className="pageTitle"><div><span className="eyebrow">Precificação</span><h1>Lotes de despesas</h1><p>Cada compra possui gastos, quantidade para rateio e markup próprios.</p></div></section>
    <section className="twoColumns"><div className="panel"><div className="panelHeader"><h2>Novo lote</h2></div><form className="formStack" onSubmit={createBatch}><Field label="Nome do lote"><input required value={batch.name} onChange={(e) => setBatch({ ...batch, name: e.target.value })} /></Field><Field label="Data da compra"><input type="date" value={batch.date} onChange={(e) => setBatch({ ...batch, date: e.target.value })} /></Field><Field label="Quantidade de peças para rateio"><input type="number" min="1" value={batch.count} onChange={(e) => setBatch({ ...batch, count: e.target.value })} /></Field><Field label="Markup"><input value={batch.markup} onChange={(e) => setBatch({ ...batch, markup: e.target.value })} /></Field><button className="primaryButton">Criar lote</button></form></div>
      <div className="panel"><div className="panelHeader"><h2>Adicionar despesa</h2></div><form className="formStack" onSubmit={addExpense}><Field label="Lote"><select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}><option value="">Selecione</option>{data.expenseBatches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field><Field label="Descrição"><input value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} /></Field><Field label="Categoria"><input value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })} /></Field><Field label="Data"><input type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} /></Field><Field label="Valor"><input value={expense.value} onChange={(e) => setExpense({ ...expense, value: e.target.value })} /></Field><button className="primaryButton">Adicionar despesa</button></form></div></section>
    <section className="batchGrid">{data.expenseBatches.length === 0 ? <div className="panel"><Empty text="Nenhum lote de despesas cadastrado." /></div> : data.expenseBatches.map((b) => { const total = b.expenses.reduce((s, e) => s + e.valueCents, 0); const per = Math.ceil(total / b.itemCount); return <article className="panel batchCard" key={b.id}><div className="panelHeader"><h2>{b.name}</h2><span>{new Date(`${b.purchaseDate}T12:00:00`).toLocaleDateString("pt-BR")}</span></div><div className="summaryList"><div><span>Total de despesas</span><strong>{formatMoney(total)}</strong></div><div><span>Peças no rateio</span><strong>{b.itemCount}</strong></div><div><span>Despesa por peça</span><strong>{formatMoney(per)}</strong></div><div><span>Markup</span><strong>{b.markup}×</strong></div></div>{b.expenses.length > 0 && <ul className="expenseList">{b.expenses.map((e) => <li key={e.id}><span>{e.description}<small>{e.category || "Sem categoria"}</small></span><strong>{formatMoney(e.valueCents)}</strong></li>)}</ul>}</article>; })}</section></>;
}

function Reports({ data }: { data: AppData }) {
  const confirmed = data.sales.filter((s) => s.status === "Confirmada"); const total = confirmed.reduce((s, sale) => s + sale.totalCents, 0);
  function exportSales() { const header = ["Venda", "Data", "Canal", "Cliente", "Status", "Total", "Líquido"]; const rows = data.sales.map((s) => [s.number, formatDateTime(s.createdAt), s.channel, s.customer, s.status, (s.totalCents / 100).toFixed(2), (s.netCents / 100).toFixed(2)]); rows.push(["TOTAL GERAL", "", "", "", "", (total / 100).toFixed(2), (confirmed.reduce((sum, s) => sum + s.netCents, 0) / 100).toFixed(2)]); downloadFile("relatorio-vendas.csv", [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n")); }
  function exportStock() { const header = ["Produto", "SKU", "Cor", "Tamanho", "Estoque", "Custo", "Venda", "Preço mínimo"]; const rows = data.products.map((p) => [p.name, p.sku, p.color, p.size, p.stock, (p.costCents / 100).toFixed(2), (p.salePriceCents / 100).toFixed(2), (p.minimumPriceCents / 100).toFixed(2)]); downloadFile("relatorio-estoque.csv", [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n")); }
  return <><section className="pageTitle"><div><span className="eyebrow">Análises</span><h1>Relatórios</h1><p>Exporte vendas e estoque em CSV ou use a impressão do navegador para salvar em PDF.</p></div><div className="headerActions"><button className="secondaryButton" onClick={exportStock}>CSV estoque</button><button className="secondaryButton" onClick={exportSales}>CSV vendas</button><button className="primaryButton" onClick={() => window.print()}>Imprimir / PDF</button></div></section>
    <section className="kpiGrid"><Kpi label="Total vendido" value={formatMoney(total)} note={`${confirmed.length} venda(s) confirmada(s)`} /><Kpi label="Peças em estoque" value={String(data.products.reduce((s, p) => s + p.stock, 0))} note={`${data.products.length} variação(ões)`} /><Kpi label="Valor estoque (custo)" value={formatMoney(data.products.reduce((s, p) => s + p.stock * p.costCents, 0))} note="Saldo atual" /><Kpi label="Potencial de venda" value={formatMoney(data.products.reduce((s, p) => s + p.stock * p.salePriceCents, 0))} note="Preço normal" /></section>
    <section className="panel reportPrint"><div className="panelHeader"><h2>Vendas</h2></div>{data.sales.length === 0 ? <Empty text="Nenhuma venda para exibir." /> : <div className="tableWrap"><table><thead><tr><th>Venda</th><th>Data</th><th>Itens</th><th>Canal</th><th>Status</th><th>Total</th></tr></thead><tbody>{data.sales.map((s) => <tr key={s.id}><td>{s.number}</td><td>{formatDateTime(s.createdAt)}</td><td>{s.items.reduce((sum, i) => sum + i.quantity, 0)}</td><td>{s.channel}</td><td>{s.status}</td><td>{formatMoney(s.totalCents)}</td></tr>)}</tbody><tfoot><tr><td colSpan={5}><strong>TOTAL GERAL</strong></td><td><strong>{formatMoney(total)}</strong></td></tr></tfoot></table></div>}</section></>;
}

function Users({ data, setData, flash, audit }: CommonProps) {
  const [form, setForm] = useState({ name: "", email: "", role: "seller" as AppUser["role"] });
  function submit(event: FormEvent) { event.preventDefault(); if (!form.name || !form.email) return flash("Informe nome e e-mail."); if (data.users.some((u) => u.email.toLowerCase() === form.email.toLowerCase())) return flash("Este e-mail já está cadastrado."); const user: AppUser = { id: makeId("usr"), name: form.name, email: form.email, role: form.role, active: true, createdAt: nowIso() }; setData((c) => ({ ...c, users: [user, ...c.users] })); audit("Criou usuário", "Usuário", `${user.name} · ${user.role}`); setForm({ name: "", email: "", role: "seller" }); flash("Usuário cadastrado."); }
  return <><section className="pageTitle"><div><span className="eyebrow">Acesso</span><h1>Usuários e permissões</h1><p>Administrador possui acesso completo; vendedor opera produtos, estoque e vendas sem alterar custos.</p></div></section><section className="panel"><form className="formGrid compact" onSubmit={submit}><Field label="Nome"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Perfil"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppUser["role"] })}><option value="admin">Administrador</option><option value="seller">Vendedor</option></select></Field><div className="formActions"><button className="primaryButton">Cadastrar usuário</button></div></form></section><section className="panel"><div className="panelHeader"><h2>Usuários</h2></div>{data.users.length === 0 ? <Empty text="Nenhum usuário adicional cadastrado." /> : <div className="tableWrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th></tr></thead><tbody>{data.users.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role === "admin" ? "Administrador" : "Vendedor"}</td><td>{u.active ? "Ativo" : "Inativo"}</td></tr>)}</tbody></table></div>}</section></>;
}

function Audit({ data }: { data: AppData }) { return <><section className="pageTitle"><div><span className="eyebrow">Histórico</span><h1>Auditoria</h1><p>Registro das principais operações executadas no sistema.</p></div></section><section className="panel">{data.audit.length === 0 ? <Empty text="Nenhuma ação registrada." /> : <div className="tableWrap"><table><thead><tr><th>Data</th><th>Ação</th><th>Entidade</th><th>Detalhes</th><th>Responsável</th></tr></thead><tbody>{data.audit.map((a) => <tr key={a.id}><td>{formatDateTime(a.createdAt)}</td><td>{a.action}</td><td>{a.entity}</td><td>{a.details}</td><td>{a.actor}</td></tr>)}</tbody></table></div>}</section></>;
}

function Settings({ data, setData, flash, audit }: CommonProps) {
  const [form, setForm] = useState(data.settings);
  function save(event: FormEvent) { event.preventDefault(); setData((c) => ({ ...c, settings: form })); audit("Alterou configurações", "Loja", form.name); flash("Configurações salvas."); }
  function reset() { if (!window.confirm("Apagar todos os dados locais desta instalação? Esta ação não pode ser desfeita.")) return; localStorage.removeItem(storageKey); setData(cloneEmptyData()); flash("Dados locais apagados."); }
  return <><section className="pageTitle"><div><span className="eyebrow">Identidade</span><h1>Configurações da loja</h1><p>Ao copiar o repositório para outra loja, altere estes dados e comece os cadastros com a base vazia.</p></div></section><section className="panel"><form className="formGrid" onSubmit={save}><Field label="Nome da loja"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="E-mail"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Telefone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field><Field label="Instagram"><input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></Field><Field label="Cor principal"><input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></Field><Field label="Cor secundária"><input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></Field><div className="formActions"><button className="primaryButton">Salvar configurações</button></div></form></section><section className="panel dangerPanel"><div><h2>Reiniciar instalação</h2><p>Remove produtos, estoque, vendas, despesas, usuários e auditoria salvos neste navegador.</p></div><button className="dangerButton" onClick={reset}>Apagar dados locais</button></section></>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
type CommonProps = { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; flash: (text: string) => void; audit: (action: string, entity: string, details: string, actor?: string) => void; };
