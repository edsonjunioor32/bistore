export type PricingInput = {
  costCents: number;
  expensesTotalCents: number;
  batchItemCount: number;
  markup: number;
};

export type PricingResult = {
  expensePerItemCents: number;
  minimumPriceCents: number;
};

/**
 * Regra consolidada do projeto original:
 * preço mínimo = despesa por peça + (custo da peça × markup)
 *
 * Valores monetários são inteiros em centavos.
 */
export function calculateMinimumPrice(input: PricingInput): PricingResult {
  if (input.costCents < 0) throw new Error("costCents must be >= 0");
  if (input.expensesTotalCents < 0) throw new Error("expensesTotalCents must be >= 0");
  if (!Number.isInteger(input.batchItemCount) || input.batchItemCount <= 0) {
    throw new Error("batchItemCount must be a positive integer");
  }
  if (!Number.isFinite(input.markup) || input.markup <= 0) {
    throw new Error("markup must be > 0");
  }

  const expensePerItemCents = Math.ceil(
    input.expensesTotalCents / input.batchItemCount,
  );

  const markedUpCostCents = Math.ceil(input.costCents * input.markup);

  return {
    expensePerItemCents,
    minimumPriceCents: expensePerItemCents + markedUpCostCents,
  };
}

export function formatMoney(cents: number, locale = "pt-BR", currency = "BRL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
