export type Role = "super_admin" | "store_admin" | "seller";

export type StoreBranding = {
  name: string;
  slug: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  locale: string;
  timezone: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
};

export type Store = {
  id: string;
  active: boolean;
  branding: StoreBranding;
};

export type ExpenseBatch = {
  id: string;
  storeId: string;
  name: string;
  purchaseDate: string;
  itemCount: number;
  markup: number;
  expensesTotalCents: number;
};

export type ProductVariant = {
  id: string;
  storeId: string;
  productId: string;
  sku: string;
  color?: string;
  size?: string;
  costCents: number;
  salePriceCents: number;
  minimumPriceCents: number;
  stock: number;
  minimumStock: number;
  expenseBatchId?: string;
};
