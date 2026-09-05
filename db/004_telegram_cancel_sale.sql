create or replace function public.telegram_cancel_sale(
  p_telegram_user_id bigint,
  p_sale_number bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_profile_id uuid;
  v_role app_role;
  v_sale sales%rowtype;
  v_item sale_items%rowtype;
  v_before integer;
begin
  select tu.user_profile_id, up.role into v_user_profile_id, v_role
  from telegram_users tu
  join user_profiles up on up.id = tu.user_profile_id
  where tu.telegram_user_id = p_telegram_user_id and tu.authorized = true and up.active = true;

  if v_user_profile_id is null then raise exception 'Telegram não autorizado'; end if;
  if v_role <> 'admin' then raise exception 'Somente administrador pode cancelar venda'; end if;

  select * into v_sale from sales where sale_number = p_sale_number for update;
  if not found then raise exception 'Venda não encontrada'; end if;
  if v_sale.status = 'cancelled' then return true; end if;

  for v_item in select * from sale_items where sale_id = v_sale.id loop
    select stock into v_before from product_variants where id = v_item.product_variant_id for update;
    update product_variants set stock = stock + v_item.quantity, updated_at = now() where id = v_item.product_variant_id;
    insert into stock_movements(product_variant_id, sale_id, movement_type, quantity, stock_before, stock_after, reason, source, created_by)
    values(v_item.product_variant_id, v_sale.id, 'sale_cancelled', v_item.quantity, v_before, v_before + v_item.quantity, 'Cancelamento Telegram ' || p_sale_number, 'telegram', v_user_profile_id);
  end loop;

  update sales set status = 'cancelled', updated_at = now() where id = v_sale.id;
  insert into audit_logs(actor_user_id, actor_source, action, entity_type, entity_id, after_data)
  values(v_user_profile_id, 'telegram', 'sale_cancelled', 'sale', v_sale.id::text, jsonb_build_object('sale_number', p_sale_number));
  return true;
end;
$$;
