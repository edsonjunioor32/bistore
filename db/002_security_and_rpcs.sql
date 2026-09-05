-- Bistore: segurança e operações transacionais
-- Execute depois de db/schema.sql em um projeto Supabase novo.

alter table user_profiles
  add constraint user_profiles_auth_user_fk
  foreign key (id) references auth.users(id) on delete cascade;

create or replace function public.current_user_role()
returns app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from user_profiles where id = auth.uid() and active = true;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from user_profiles where id = auth.uid() and active = true);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from user_profiles where id = auth.uid() and active = true), false);
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table store_settings enable row level security;
alter table user_profiles enable row level security;
alter table expense_batches enable row level security;
alter table expenses enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table payments enable row level security;
alter table stock_movements enable row level security;
alter table telegram_users enable row level security;
alter table telegram_updates enable row level security;
alter table audit_logs enable row level security;

create policy store_settings_read on store_settings for select to authenticated using (is_active_user());
create policy store_settings_admin_write on store_settings for all to authenticated using (is_admin()) with check (is_admin());

create policy profiles_read on user_profiles for select to authenticated using (is_active_user());
create policy profiles_admin_insert on user_profiles for insert to authenticated with check (is_admin());
create policy profiles_admin_update on user_profiles for update to authenticated using (is_admin()) with check (is_admin());

create policy expense_batches_read on expense_batches for select to authenticated using (is_active_user());
create policy expense_batches_admin_write on expense_batches for all to authenticated using (is_admin()) with check (is_admin());
create policy expenses_read on expenses for select to authenticated using (is_active_user());
create policy expenses_admin_write on expenses for all to authenticated using (is_admin()) with check (is_admin());

create policy products_read on products for select to authenticated using (is_active_user());
create policy products_admin_write on products for all to authenticated using (is_admin()) with check (is_admin());
create policy variants_read on product_variants for select to authenticated using (is_active_user());
create policy variants_admin_write on product_variants for all to authenticated using (is_admin()) with check (is_admin());

create policy sales_read on sales for select to authenticated using (is_active_user());
create policy sale_items_read on sale_items for select to authenticated using (is_active_user());
create policy payments_read on payments for select to authenticated using (is_active_user());
create policy movements_read on stock_movements for select to authenticated using (is_active_user());

create policy telegram_users_admin on telegram_users for all to authenticated using (is_admin()) with check (is_admin());
create policy audit_read_admin on audit_logs for select to authenticated using (is_admin());

-- Entrada/ajuste de estoque em transação única.
create or replace function public.stock_change(
  p_sku text,
  p_delta integer,
  p_reason text default null,
  p_source text default 'web'
)
returns table(variant_id uuid, previous_stock integer, new_stock integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant product_variants%rowtype;
  v_before integer;
  v_after integer;
begin
  if not is_active_user() then raise exception 'Usuário não autorizado'; end if;
  if p_delta = 0 then raise exception 'Quantidade deve ser diferente de zero'; end if;

  select * into v_variant from product_variants where sku = p_sku and active = true for update;
  if not found then raise exception 'SKU não encontrado'; end if;
  v_before := v_variant.stock;
  v_after := v_before + p_delta;
  if v_after < 0 then raise exception 'Estoque insuficiente'; end if;

  update product_variants set stock = v_after, updated_at = now() where id = v_variant.id;
  insert into stock_movements(product_variant_id, movement_type, quantity, stock_before, stock_after, reason, source, created_by)
  values(v_variant.id, case when p_delta > 0 then 'entry'::stock_movement_type else 'manual_adjustment'::stock_movement_type end, abs(p_delta), v_before, v_after, p_reason, p_source, auth.uid());
  insert into audit_logs(actor_user_id, actor_source, action, entity_type, entity_id, after_data)
  values(auth.uid(), p_source, 'stock_change', 'product_variant', v_variant.id::text, jsonb_build_object('sku', p_sku, 'before', v_before, 'after', v_after, 'reason', p_reason));
  return query select v_variant.id, v_before, v_after;
end;
$$;
grant execute on function public.stock_change(text, integer, text, text) to authenticated;

-- Registra uma venda de um SKU com pagamento único. A UI pode chamar várias vezes/usar uma futura RPC multi-itens;
-- o Telegram usa esta operação mínima e atômica.
create or replace function public.register_single_item_sale(
  p_sku text,
  p_quantity integer,
  p_unit_price_cents bigint,
  p_channel text,
  p_payment_method text,
  p_installments integer default 1,
  p_source text default 'web'
)
returns table(sale_id uuid, sale_number bigint, total_cents bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_variant product_variants%rowtype;
  v_product products%rowtype;
  v_sale_id uuid;
  v_sale_number bigint;
  v_total bigint;
  v_after integer;
begin
  if not is_active_user() then raise exception 'Usuário não autorizado'; end if;
  if p_quantity <= 0 then raise exception 'Quantidade inválida'; end if;
  if p_unit_price_cents < 0 then raise exception 'Preço inválido'; end if;

  select * into v_variant from product_variants where sku = p_sku and active = true for update;
  if not found then raise exception 'SKU não encontrado'; end if;
  if v_variant.stock < p_quantity then raise exception 'Estoque insuficiente'; end if;
  select * into v_product from products where id = v_variant.product_id;

  v_total := p_quantity * p_unit_price_cents;
  insert into sales(status, channel, gross_total_cents, net_total_cents, sold_at, created_by)
  values('confirmed', p_channel, v_total, v_total, now(), auth.uid())
  returning id, sales.sale_number into v_sale_id, v_sale_number;

  insert into sale_items(sale_id, product_variant_id, sku_snapshot, product_name_snapshot, color_snapshot, size_snapshot, quantity, unit_price_cents, unit_cost_cents, line_total_cents)
  values(v_sale_id, v_variant.id, v_variant.sku, v_product.name, v_variant.color, v_variant.size, p_quantity, p_unit_price_cents, v_variant.cost_cents, v_total);

  insert into payments(sale_id, method, installments, amount_cents, status, paid_at)
  values(v_sale_id, p_payment_method, greatest(p_installments, 1), v_total, 'paid', now());

  v_after := v_variant.stock - p_quantity;
  update product_variants set stock = v_after, updated_at = now() where id = v_variant.id;
  insert into stock_movements(product_variant_id, sale_id, movement_type, quantity, stock_before, stock_after, reason, source, created_by)
  values(v_variant.id, v_sale_id, 'sale', p_quantity, v_variant.stock, v_after, 'Venda ' || v_sale_number, p_source, auth.uid());

  insert into audit_logs(actor_user_id, actor_source, action, entity_type, entity_id, after_data)
  values(auth.uid(), p_source, 'sale_created', 'sale', v_sale_id::text, jsonb_build_object('sale_number', v_sale_number, 'sku', p_sku, 'quantity', p_quantity, 'total_cents', v_total));

  return query select v_sale_id, v_sale_number, v_total;
end;
$$;
grant execute on function public.register_single_item_sale(text, integer, bigint, text, text, integer, text) to authenticated;

create or replace function public.cancel_sale(p_sale_number bigint, p_source text default 'web')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales%rowtype;
  v_item sale_items%rowtype;
  v_before integer;
begin
  if not is_admin() then raise exception 'Somente administrador pode cancelar venda'; end if;
  select * into v_sale from sales where sale_number = p_sale_number for update;
  if not found then raise exception 'Venda não encontrada'; end if;
  if v_sale.status = 'cancelled' then return true; end if;

  for v_item in select * from sale_items where sale_id = v_sale.id loop
    select stock into v_before from product_variants where id = v_item.product_variant_id for update;
    update product_variants set stock = stock + v_item.quantity, updated_at = now() where id = v_item.product_variant_id;
    insert into stock_movements(product_variant_id, sale_id, movement_type, quantity, stock_before, stock_after, reason, source, created_by)
    values(v_item.product_variant_id, v_sale.id, 'sale_cancelled', v_item.quantity, v_before, v_before + v_item.quantity, 'Cancelamento venda ' || p_sale_number, p_source, auth.uid());
  end loop;

  update sales set status = 'cancelled', updated_at = now() where id = v_sale.id;
  insert into audit_logs(actor_user_id, actor_source, action, entity_type, entity_id, after_data)
  values(auth.uid(), p_source, 'sale_cancelled', 'sale', v_sale.id::text, jsonb_build_object('sale_number', p_sale_number));
  return true;
end;
$$;
grant execute on function public.cancel_sale(bigint, text) to authenticated;
