export type Role = "admin" | "seller";

export type StoreConfig = {
  name: string;
  legalName?: string;
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

export type ExpenseBatch = {
  id: string;
  name: string;
  purchaseDate: string;
  itemCount: number;
  markup: number;
  expensesTotalCents: number;
};

export type ProductVariant = {
  id: string;
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
