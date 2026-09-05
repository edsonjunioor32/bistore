create extension if not exists pgcrypto;

create type app_role as enum ('super_admin', 'store_admin', 'seller');
create type sale_status as enum ('pending', 'confirmed', 'paid', 'separating', 'shipped', 'delivered', 'cancelled', 'partially_exchanged', 'returned');
create type payment_status as enum ('pending', 'paid', 'refunded', 'partially_refunded');
create type stock_movement_type as enum ('entry', 'sale', 'manual_adjustment', 'reservation', 'reservation_cancelled', 'exchange', 'return', 'sale_cancelled', 'loss', 'damage');

create table stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default true,
  primary_color text not null default '#111827',
  secondary_color text not null default '#F3F4F6',
  logo_url text,
  favicon_url text,
  currency text not null default 'BRL',
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Fortaleza',
  email text,
  phone text,
  whatsapp text,
  instagram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_profiles (
  id uuid primary key,
  name text not null,
  email text not null,
  platform_role app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table store_users (
  store_id uuid not null references stores(id) on delete cascade,
  user_id uuid not null references user_profiles(id) on delete cascade,
  role app_role not null check (role in ('store_admin', 'seller')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table expense_batches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  purchase_date date not null,
  item_count integer not null check (item_count > 0),
  markup numeric(10,4) not null check (markup > 0),
  locked_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  expense_batch_id uuid not null,
  description text not null,
  category text,
  amount_cents bigint not null check (amount_cents >= 0),
  expense_date date not null,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  foreign key (store_id, expense_batch_id) references expense_batches(store_id, id) on delete cascade
);

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  internal_code text,
  name text not null,
  model text,
  category text,
  brand text,
  description text,
  image_url text,
  active boolean not null default true,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, internal_code)
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  product_id uuid not null,
  expense_batch_id uuid,
  sku text not null,
  color text,
  size text,
  barcode text,
  cost_cents bigint not null check (cost_cents >= 0),
  sale_price_cents bigint not null check (sale_price_cents >= 0),
  promotional_price_cents bigint check (promotional_price_cents is null or promotional_price_cents >= 0),
  minimum_price_cents bigint not null check (minimum_price_cents >= 0),
  quantity_available integer not null default 0 check (quantity_available >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (store_id, product_id) references products(store_id, id) on delete cascade,
  foreign key (store_id, expense_batch_id) references expense_batches(store_id, id),
  unique (store_id, id),
  unique (store_id, sku)
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  sale_number bigint generated always as identity,
  sold_at timestamptz not null default now(),
  channel text not null default 'store',
  customer_name text,
  subtotal_cents bigint not null default 0,
  discount_cents bigint not null default 0,
  shipping_cents bigint not null default 0,
  total_cents bigint not null default 0,
  net_total_cents bigint not null default 0,
  status sale_status not null default 'pending',
  notes text,
  created_by uuid references user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, sale_number)
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  sale_id uuid not null,
  variant_id uuid not null,
  sku_snapshot text not null,
  product_name_snapshot text not null,
  color_snapshot text,
  size_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  discount_cents bigint not null default 0 check (discount_cents >= 0),
  line_total_cents bigint not null check (line_total_cents >= 0),
  foreign key (store_id, sale_id) references sales(store_id, id) on delete cascade,
  foreign key (store_id, variant_id) references product_variants(store_id, id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  sale_id uuid not null,
  method text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  installments integer not null default 1 check (installments > 0),
  fee_cents bigint not null default 0 check (fee_cents >= 0),
  net_amount_cents bigint not null check (net_amount_cents >= 0),
  status payment_status not null default 'pending',
  transaction_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (store_id, sale_id) references sales(store_id, id) on delete cascade
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  variant_id uuid not null,
  sale_id uuid,
  movement_type stock_movement_type not null,
  quantity integer not null check (quantity > 0),
  stock_before integer not null,
  stock_after integer not null check (stock_after >= 0),
  reason text,
  created_by uuid references user_profiles(id),
  telegram_user_id bigint,
  created_at timestamptz not null default now(),
  foreign key (store_id, variant_id) references product_variants(store_id, id),
  foreign key (store_id, sale_id) references sales(store_id, id)
);

create table telegram_configs (
  store_id uuid primary key references stores(id) on delete cascade,
  bot_username text,
  encrypted_bot_token text,
  webhook_secret text,
  notifications_enabled boolean not null default true,
  daily_summary_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table telegram_users (
  store_id uuid not null references stores(id) on delete cascade,
  telegram_user_id bigint not null,
  user_id uuid references user_profiles(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (store_id, telegram_user_id)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete cascade,
  user_id uuid references user_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  source text not null default 'web',
  created_at timestamptz not null default now()
);

create index idx_products_store on products(store_id);
create index idx_variants_store_sku on product_variants(store_id, sku);
create index idx_sales_store_date on sales(store_id, sold_at desc);
create index idx_stock_movements_store_date on stock_movements(store_id, created_at desc);
create index idx_expense_batches_store_date on expense_batches(store_id, purchase_date desc);
create index idx_audit_store_date on audit_logs(store_id, created_at desc);

-- IMPORTANTE:
-- Em produção, habilite Row Level Security e crie policies que validem a associação
-- do usuário ao store_id. A UI nunca deve ser a única barreira de isolamento entre lojas.
