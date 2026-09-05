create extension if not exists pgcrypto;

create type app_role as enum ('admin', 'seller');
create type sale_status as enum ('pending', 'confirmed', 'paid', 'separating', 'shipped', 'delivered', 'cancelled', 'partially_exchanged', 'returned');
create type payment_status as enum ('pending', 'paid', 'refunded', 'partially_refunded');
create type stock_movement_type as enum ('entry', 'sale', 'manual_adjustment', 'reservation', 'reservation_cancelled', 'exchange', 'return', 'sale_cancelled', 'loss', 'damage');

-- Uma instalação = uma loja. Esta tabela possui apenas uma linha de configuração.
create table store_settings (
  id smallint primary key default 1 check (id = 1),
  name text not null default 'Sua Loja',
  legal_name text,
  logo_url text,
  favicon_url text,
  primary_color text not null default '#111827',
  secondary_color text not null default '#F3F4F6',
  currency text not null default 'BRL',
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Fortaleza',
  email text,
  phone text,
  whatsapp text,
  instagram text,
  address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_profiles (
  id uuid primary key,
  name text not null,
  email text not null unique,
  role app_role not null default 'seller',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expense_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purchase_date date not null,
  item_count integer not null check (item_count > 0),
  markup numeric(10,4) not null check (markup > 0),
  notes text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  expense_batch_id uuid not null references expense_batches(id) on delete cascade,
  description text not null,
  category text,
  expense_date date not null,
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  internal_code text unique,
  name text not null,
  model text,
  category text,
  brand text,
  description text,
  photo_url text,
  active boolean not null default true,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  expense_batch_id uuid references expense_batches(id),
  sku text not null unique,
  color text,
  size text,
  barcode text,
  cost_cents bigint not null default 0 check (cost_cents >= 0),
  sale_price_cents bigint not null default 0 check (sale_price_cents >= 0),
  promotional_price_cents bigint check (promotional_price_cents is null or promotional_price_cents >= 0),
  minimum_price_cents bigint not null default 0 check (minimum_price_cents >= 0),
  stock integer not null default 0,
  reserved_stock integer not null default 0 check (reserved_stock >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigserial unique,
  status sale_status not null default 'confirmed',
  channel text,
  customer_name text,
  gross_total_cents bigint not null default 0 check (gross_total_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  fees_cents bigint not null default 0 check (fees_cents >= 0),
  net_total_cents bigint not null default 0,
  sold_at timestamptz not null default now(),
  created_by uuid references user_profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_variant_id uuid not null references product_variants(id),
  sku_snapshot text not null,
  product_name_snapshot text not null,
  color_snapshot text,
  size_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  unit_cost_cents bigint not null default 0 check (unit_cost_cents >= 0),
  line_total_cents bigint not null check (line_total_cents >= 0)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  method text not null,
  installments integer not null default 1 check (installments > 0),
  amount_cents bigint not null check (amount_cents >= 0),
  fee_cents bigint not null default 0 check (fee_cents >= 0),
  status payment_status not null default 'paid',
  transaction_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references product_variants(id),
  sale_id uuid references sales(id),
  movement_type stock_movement_type not null,
  quantity integer not null check (quantity > 0),
  stock_before integer not null,
  stock_after integer not null,
  reason text,
  source text not null default 'web',
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now()
);

create table telegram_users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  user_profile_id uuid references user_profiles(id),
  display_name text,
  authorized boolean not null default true,
  created_at timestamptz not null default now()
);

create table telegram_updates (
  update_id bigint primary key,
  processed_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references user_profiles(id),
  actor_source text not null default 'web',
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_products_name on products (name);
create index idx_variants_product on product_variants (product_id);
create index idx_variants_stock on product_variants (stock, minimum_stock);
create index idx_expenses_batch on expenses (expense_batch_id);
create index idx_sales_sold_at on sales (sold_at desc);
create index idx_sale_items_sale on sale_items (sale_id);
create index idx_payments_sale on payments (sale_id);
create index idx_stock_movements_variant on stock_movements (product_variant_id, created_at desc);
create index idx_audit_logs_created_at on audit_logs (created_at desc);

-- A aplicação deve calcular preço mínimo usando:
-- despesa por peça + (custo da peça * markup)
-- onde despesa por peça = soma(expenses.amount_cents) / expense_batches.item_count.
-- O lote escolhido no cadastro permanece vinculado ao produto/variação para preservar histórico.
