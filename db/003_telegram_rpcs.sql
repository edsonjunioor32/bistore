-- Operações chamadas exclusivamente pela Edge Function do Telegram usando service role.
-- A função valida o usuário Telegram e resolve o user_profile_id antes de qualquer escrita.

create or replace function public.telegram_stock_change(
  p_telegram_user_id bigint,
  p_sku text,
  p_delta integer,
  p_reason text default null
)
returns table(variant_id uuid, previous_stock integer, new_stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_profile_id uuid;
  v_variant product_variants%rowtype;
  v_before integer;
  v_after integer;
begin
  select user_profile_id into v_user_profile_id
  from telegram_users where telegram_user_id = p_telegram_user_id and authorized = true;
  if v_user_profile_id is null then raise exception 'Telegram não autorizado'; end if;
  if p_delta = 0 then raise exception 'Quantidade deve ser diferente de zero'; end if;

  select * into v_variant from product_variants where sku = p_sku and active = true for update;
  if not found then raise exception 'SKU não encontrado'; end if;
  v_before := v_variant.stock;
  v_after := v_before + p_delta;
  if v_after < 0 then raise exception 'Estoque insuficiente'; end if;

  update product_variants set stock = v_after, updated_at = now() where id = v_variant.id;
  insert into stock_movements(product_variant_id, movement_type, quantity, stock_before, stock_after, reason, source, created_by)
  values(v_variant.id, case when p_delta > 0 then 'entry'::stock_movement_type else 'manual_adjustment'::stock_movement_type end, abs(p_delta), v_before, v_after, p_reason, 'telegram', v_user_profile_id);
  insert into audit_logs(actor_user_id, actor_source, action, entity_type, entity_id, after_data)
  values(v_user_profile_id, 'telegram', 'stock_change', 'product_variant', v_variant.id::text, jsonb_build_object('sku', p_sku, 'before', v_before, 'after', v_after));
  return query select v_variant.id, v_before, v_after;
end;
$$;

create or replace function public.telegram_register_single_item_sale(
  p_telegram_user_id bigint,
  p_sku text,
  p_quantity integer,
  p_unit_price_cents bigint,
  p_channel text,
  p_payment_method text,
  p_installments integer default 1
)
returns table(sale_id uuid, sale_number bigint, total_cents bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_profile_id uuid;
  v_variant product_variants%rowtype;
  v_product products%rowtype;
  v_sale_id uuid;
  v_sale_number bigint;
  v_total bigint;
  v_after integer;
begin
  select user_profile_id into v_user_profile_id
  from telegram_users where telegram_user_id = p_telegram_user_id and authorized = true;
  if v_user_profile_id is null then raise exception 'Telegram não autorizado'; end if;
  if p_quantity <= 0 then raise exception 'Quantidade inválida'; end if;

  select * into v_variant from product_variants where sku = p_sku and active = true for update;
  if not found then raise exception 'SKU não encontrado'; end if;
  if v_variant.stock < p_quantity then raise exception 'Estoque insuficiente'; end if;
  select * into v_product from products where id = v_variant.product_id;

  v_total := p_quantity * p_unit_price_cents;
  insert into sales(status, channel, gross_total_cents, net_total_cents, sold_at, created_by)
  values('confirmed', p_channel, v_total, v_total, now(), v_user_profile_id)
  returning id, sales.sale_number into v_sale_id, v_sale_number;

  insert into sale_items(sale_id, product_variant_id, sku_snapshot, product_name_snapshot, color_snapshot, size_snapshot, quantity, unit_price_cents, unit_cost_cents, line_total_cents)
  values(v_sale_id, v_variant.id, v_variant.sku, v_product.name, v_variant.color, v_variant.size, p_quantity, p_unit_price_cents, v_variant.cost_cents, v_total);
  insert into payments(sale_id, method, installments, amount_cents, status, paid_at)
  values(v_sale_id, p_payment_method, greatest(p_installments, 1), v_total, 'paid', now());

  v_after := v_variant.stock - p_quantity;
  update product_variants set stock = v_after, updated_at = now() where id = v_variant.id;
  insert into stock_movements(product_variant_id, sale_id, movement_type, quantity, stock_before, stock_after, reason, source, created_by)
  values(v_variant.id, v_sale_id, 'sale', p_quantity, v_variant.stock, v_after, 'Venda Telegram ' || v_sale_number, 'telegram', v_user_profile_id);
  insert into audit_logs(actor_user_id, actor_source, action, entity_type, entity_id, after_data)
  values(v_user_profile_id, 'telegram', 'sale_created', 'sale', v_sale_id::text, jsonb_build_object('sale_number', v_sale_number, 'sku', p_sku, 'quantity', p_quantity, 'total_cents', v_total));

  return query select v_sale_id, v_sale_number, v_total;
end;
$$;
