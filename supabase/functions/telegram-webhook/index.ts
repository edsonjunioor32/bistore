import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const menu = [
  "Comandos do Bistore:",
  "/estoque — listar estoque disponível",
  "/produto TERMO — consultar SKU/produto",
  "/entrada SKU QTD — registrar entrada",
  "/ajuste SKU NOVO_ESTOQUE — ajustar saldo",
  "/venda SKU QTD [PRECO] [PAGAMENTO] — registrar venda",
  "/cancelarvenda NUMERO — cancelar venda (admin)",
  "/vendas — últimas vendas",
  "/relatorio — resumo de hoje",
  "/ajuda — instruções",
].join("\n");

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

function cents(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

async function authorized(telegramUserId: number) {
  const { data } = await supabase
    .from("telegram_users")
    .select("telegram_user_id, display_name, authorized, user_profiles!inner(id,name,role,active)")
    .eq("telegram_user_id", telegramUserId)
    .eq("authorized", true)
    .eq("user_profiles.active", true)
    .maybeSingle();
  return data;
}

async function handleCommand(chatId: number, telegramUserId: number, text: string) {
  const [rawCommand, ...args] = text.trim().split(/\s+/);
  const command = rawCommand.toLowerCase().split("@")[0];

  if (command === "/start" || command === "/menu" || command === "/ajuda") {
    return sendMessage(chatId, menu);
  }

  const user = await authorized(telegramUserId);
  if (!user) return sendMessage(chatId, "Acesso não autorizado. Solicite ao administrador o cadastro do seu ID numérico do Telegram.");

  if (command === "/estoque") {
    const { data, error } = await supabase
      .from("product_variants")
      .select("sku,color,size,stock,products!inner(name)")
      .eq("active", true)
      .order("stock", { ascending: true })
      .limit(30);
    if (error) throw error;
    if (!data?.length) return sendMessage(chatId, "Nenhum produto cadastrado.");
    const lines = data.map((item: any) => `${item.sku} · ${item.products.name} · ${item.color ?? "-"}/${item.size ?? "-"} · estoque ${item.stock}`);
    return sendMessage(chatId, ["<b>Estoque</b>", ...lines].join("\n"));
  }

  if (command === "/produto") {
    const term = args.join(" ").trim();
    if (!term) return sendMessage(chatId, "Uso: /produto SKU");
    const { data, error } = await supabase
      .from("product_variants")
      .select("sku,color,size,stock,sale_price_cents,minimum_price_cents,products!inner(name,model,category)")
      .ilike("sku", `%${term}%`)
      .limit(10);
    if (error) throw error;
    if (!data?.length) return sendMessage(chatId, "Produto/SKU não encontrado.");
    const lines = data.map((item: any) => `${item.sku} · ${item.products.name} · ${item.color ?? "-"}/${item.size ?? "-"}\nEstoque: ${item.stock} · Venda: ${cents(item.sale_price_cents)}`);
    return sendMessage(chatId, lines.join("\n\n"));
  }

  if (command === "/entrada") {
    const [sku, quantityText] = args;
    const quantity = Number(quantityText);
    if (!sku || !Number.isInteger(quantity) || quantity <= 0) return sendMessage(chatId, "Uso: /entrada SKU QTD");
    const { data, error } = await supabase.rpc("telegram_stock_change", {
      p_telegram_user_id: telegramUserId,
      p_sku: sku.toUpperCase(),
      p_delta: quantity,
      p_reason: "Entrada via Telegram",
    });
    if (error) throw error;
    const result = data?.[0];
    return sendMessage(chatId, `Entrada registrada. ${sku.toUpperCase()}: ${result?.previous_stock ?? "?"} → ${result?.new_stock ?? "?"}.`);
  }

  if (command === "/ajuste") {
    const [sku, stockText] = args;
    const target = Number(stockText);
    if (!sku || !Number.isInteger(target) || target < 0) return sendMessage(chatId, "Uso: /ajuste SKU NOVO_ESTOQUE");
    const { data: variant, error: findError } = await supabase.from("product_variants").select("stock").eq("sku", sku.toUpperCase()).maybeSingle();
    if (findError) throw findError;
    if (!variant) return sendMessage(chatId, "SKU não encontrado.");
    const delta = target - variant.stock;
    if (delta === 0) return sendMessage(chatId, "O estoque já possui esse valor.");
    const { error } = await supabase.rpc("telegram_stock_change", {
      p_telegram_user_id: telegramUserId,
      p_sku: sku.toUpperCase(),
      p_delta: delta,
      p_reason: "Ajuste via Telegram",
    });
    if (error) throw error;
    return sendMessage(chatId, `Estoque de ${sku.toUpperCase()} ajustado para ${target}.`);
  }

  if (command === "/venda") {
    const [sku, quantityText, priceText, paymentText] = args;
    const quantity = Number(quantityText);
    if (!sku || !Number.isInteger(quantity) || quantity <= 0) return sendMessage(chatId, "Uso: /venda SKU QTD [PRECO] [PAGAMENTO]");
    const { data: variant, error: findError } = await supabase.from("product_variants").select("sale_price_cents,stock").eq("sku", sku.toUpperCase()).maybeSingle();
    if (findError) throw findError;
    if (!variant) return sendMessage(chatId, "SKU não encontrado.");
    const priceCents = priceText ? Math.round(Number(priceText.replace(",", ".")) * 100) : Number(variant.sale_price_cents);
    const method = paymentText ? paymentText.replace(/_/g, " ") : "Pix";
    const total = priceCents * quantity;
    await sendMessage(chatId, `Confirme a venda enviando novamente:\n/venda_confirmar ${sku.toUpperCase()} ${quantity} ${priceCents} ${method.replace(/ /g, "_")}\nTotal: ${cents(total)}`);
    return;
  }

  if (command === "/venda_confirmar") {
    const [sku, quantityText, priceCentsText, paymentText] = args;
    const quantity = Number(quantityText);
    const priceCents = Number(priceCentsText);
    if (!sku || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(priceCents)) return sendMessage(chatId, "Confirmação inválida. Inicie novamente com /venda.");
    const { data, error } = await supabase.rpc("telegram_register_single_item_sale", {
      p_telegram_user_id: telegramUserId,
      p_sku: sku.toUpperCase(),
      p_quantity: quantity,
      p_unit_price_cents: priceCents,
      p_channel: "Telegram",
      p_payment_method: (paymentText ?? "Pix").replace(/_/g, " "),
      p_installments: 1,
    });
    if (error) throw error;
    const sale = data?.[0];
    return sendMessage(chatId, `Venda ${sale?.sale_number ?? ""} registrada com sucesso. Total ${cents(Number(sale?.total_cents ?? 0))}.`);
  }

  if (command === "/cancelarvenda") {
    const saleNumber = Number(args[0]);
    if (!Number.isInteger(saleNumber) || saleNumber <= 0) return sendMessage(chatId, "Uso: /cancelarvenda NUMERO");
    await sendMessage(chatId, `Confirme o cancelamento enviando /cancelarvenda_confirmar ${saleNumber}`);
    return;
  }

  if (command === "/cancelarvenda_confirmar") {
    const saleNumber = Number(args[0]);
    const { error } = await supabase.rpc("telegram_cancel_sale", { p_telegram_user_id: telegramUserId, p_sale_number: saleNumber });
    if (error) throw error;
    return sendMessage(chatId, `Venda ${saleNumber} cancelada e estoque devolvido.`);
  }

  if (command === "/vendas") {
    const { data, error } = await supabase.from("sales").select("sale_number,status,channel,gross_total_cents,sold_at").order("sold_at", { ascending: false }).limit(10);
    if (error) throw error;
    if (!data?.length) return sendMessage(chatId, "Nenhuma venda registrada.");
    return sendMessage(chatId, ["<b>Últimas vendas</b>", ...data.map((sale: any) => `#${sale.sale_number} · ${sale.status} · ${sale.channel ?? "-"} · ${cents(sale.gross_total_cents)}`)].join("\n"));
  }

  if (command === "/relatorio") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const { data, error } = await supabase.from("sales").select("gross_total_cents,net_total_cents,status").gte("sold_at", start);
    if (error) throw error;
    const confirmed = (data ?? []).filter((sale: any) => !["cancelled", "returned"].includes(sale.status));
    const gross = confirmed.reduce((sum: number, sale: any) => sum + Number(sale.gross_total_cents), 0);
    const net = confirmed.reduce((sum: number, sale: any) => sum + Number(sale.net_total_cents), 0);
    return sendMessage(chatId, `<b>Resumo de hoje</b>\nVendas: ${confirmed.length}\nBruto: ${cents(gross)}\nLíquido: ${cents(net)}`);
  }

  return sendMessage(chatId, `Comando não reconhecido.\n\n${menu}`);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("ok");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !TELEGRAM_BOT_TOKEN) return new Response("missing env", { status: 500 });
  try {
    const update = await request.json();
    const updateId = Number(update.update_id);
    if (Number.isFinite(updateId)) {
      const { error: dedupeError } = await supabase.from("telegram_updates").insert({ update_id: updateId });
      if (dedupeError?.code === "23505") return new Response("duplicate", { status: 200 });
      if (dedupeError) throw dedupeError;
    }
    const message = update.message ?? update.callback_query?.message;
    const from = update.message?.from ?? update.callback_query?.from;
    const text = update.message?.text ?? "";
    if (message?.chat?.id && from?.id && text) await handleCommand(Number(message.chat.id), Number(from.id), text);
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("error", { status: 200 });
  }
});
