export type Role = "admin" | "seller";
export type Channel = "Loja física" | "Instagram" | "WhatsApp" | "Telegram" | "Site" | "Marketplace" | "Outro";
export type PaymentMethod = "Pix" | "Dinheiro" | "Cartão de crédito" | "Cartão de débito" | "Transferência" | "Boleto" | "Link de pagamento" | "Outro";
export type MovementType = "Entrada" | "Saída por venda" | "Ajuste" | "Troca" | "Devolução" | "Cancelamento de venda" | "Perda/Avaria";

export type StoreSettings = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  timezone: string;
  currency: string;
  locale: string;
};

export type Expense = { id: string; description: string; category: string; date: string; valueCents: number };
export type ExpenseBatch = { id: string; name: string; purchaseDate: string; itemCount: number; markup: number; expenses: Expense[]; createdAt: string };

export type Product = {
  id: string;
  internalCode: string;
  name: string;
  model: string;
  category: string;
  brand: string;
  description: string;
  sku: string;
  color: string;
  size: string;
  costCents: number;
  salePriceCents: number;
  promotionalPriceCents: number | null;
  minimumPriceCents: number;
  stock: number;
  reserved: number;
  minimumStock: number;
  barcode: string;
  expenseBatchId: string | null;
  active: boolean;
  createdAt: string;
};

export type StockMovement = {
  id: string;
  productId: string;
  sku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  saleId: string | null;
  createdAt: string;
};

export type SaleItem = { productId: string; sku: string; name: string; color: string; size: string; quantity: number; unitPriceCents: number; discountCents: number };
export type SalePayment = { method: PaymentMethod; valueCents: number; installments: number; operatorFeeCents: number };
export type Sale = {
  id: string;
  number: string;
  createdAt: string;
  channel: Channel;
  customer: string;
  items: SaleItem[];
  generalDiscountCents: number;
  freightCents: number;
  subtotalCents: number;
  totalCents: number;
  netCents: number;
  payments: SalePayment[];
  status: "Confirmada" | "Cancelada" | "Devolvida";
  seller: string;
};

export type AppUser = { id: string; name: string; email: string; role: Role; active: boolean; createdAt: string };
export type AuditEntry = { id: string; action: string; entity: string; details: string; actor: string; createdAt: string };

export type AppData = {
  settings: StoreSettings;
  expenseBatches: ExpenseBatch[];
  products: Product[];
  movements: StockMovement[];
  sales: Sale[];
  users: AppUser[];
  audit: AuditEntry[];
};

export const defaultSettings: StoreSettings = {
  name: "Minha Loja",
  primaryColor: "#111827",
  secondaryColor: "#f3f4f6",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  timezone: "America/Fortaleza",
  currency: "BRL",
  locale: "pt-BR",
};

export const emptyAppData: AppData = {
  settings: defaultSettings,
  expenseBatches: [],
  products: [],
  movements: [],
  sales: [],
  users: [],
  audit: [],
};

export const storageKey = "bistore.single-store.v1";

export function makeId(prefix: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${suffix}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function moneyToCents(value: string | number) {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized || 0);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Fortaleza" }).format(new Date(iso));
}
