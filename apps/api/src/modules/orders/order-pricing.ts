import {
  calculateAdvanceDepositRequirement,
  calculateDeliveryFee,
  type PricingTier,
} from "@solusation/shared-types";

export interface PricedProduct {
  cashPriceBdt: number;
  regularPriceBdt: number;
}

export interface PricedLine {
  product: PricedProduct;
  qty: number;
}

/** Every amount on an order comes from here, using database prices only. */
export function calculateOrderTotals(params: {
  lines: PricedLine[];
  district: string;
  paymentMethod: "COD" | "BKASH";
  pricingTier: PricingTier;
}) {
  const unitPrice = (product: PricedProduct) =>
    params.pricingTier === "REGULAR" ? product.regularPriceBdt : product.cashPriceBdt;

  const subtotalBdt = params.lines.reduce((sum, line) => sum + unitPrice(line.product) * line.qty, 0);
  const deliveryFeeBdt = calculateDeliveryFee(params.district);
  const totalPayableBdt = subtotalBdt + deliveryFeeBdt;

  const depositRequirement = calculateAdvanceDepositRequirement({
    district: params.district,
    totalBdt: totalPayableBdt,
    paymentMethod: params.paymentMethod,
  });

  // Nothing counts as paid at creation. COD is confirmed straight away unless a
  // deposit is owed, and bKash stays pending until the payment is proven.
  const orderStatus =
    params.paymentMethod === "COD" && !depositRequirement.requiresDeposit ? "CONFIRMED" : "PENDING";

  return { subtotalBdt, deliveryFeeBdt, totalPayableBdt, depositRequirement, orderStatus, unitPrice } as const;
}

/**
 * Applies a verified payment. A payment above the amount due is refused rather
 * than recorded, as it almost always means the wrong order or a mistyped amount.
 */
export function applyPayment(
  order: { totalPayableBdt: number; paidAmountBdt: number },
  amountBdt: number
): { paidAmountBdt: number; dueAmountBdt: number } | null {
  const due = order.totalPayableBdt - order.paidAmountBdt;
  if (!Number.isInteger(amountBdt) || amountBdt <= 0 || amountBdt > due) return null;
  const paidAmountBdt = order.paidAmountBdt + amountBdt;
  return { paidAmountBdt, dueAmountBdt: order.totalPayableBdt - paidAmountBdt };
}
