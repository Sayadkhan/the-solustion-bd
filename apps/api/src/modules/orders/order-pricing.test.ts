import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyPayment, calculateOrderTotals } from "./order-pricing";

const cpu = { cashPriceBdt: 50_000, regularPriceBdt: 55_000 };
const cable = { cashPriceBdt: 300, regularPriceBdt: 350 };

describe("calculateOrderTotals", () => {
  it("adds the delivery fee to the total", () => {
    const inside = calculateOrderTotals({
      lines: [{ product: cable, qty: 2 }],
      district: "Dhaka",
      paymentMethod: "COD",
      pricingTier: "CASH",
    });
    assert.equal(inside.subtotalBdt, 600);
    assert.equal(inside.deliveryFeeBdt, 70);
    assert.equal(inside.totalPayableBdt, 670);

    const outside = calculateOrderTotals({
      lines: [{ product: cable, qty: 2 }],
      district: "Sylhet",
      paymentMethod: "COD",
      pricingTier: "CASH",
    });
    assert.equal(outside.deliveryFeeBdt, 140);
  });

  it("uses the regular price for the regular tier", () => {
    const totals = calculateOrderTotals({
      lines: [{ product: cpu, qty: 1 }],
      district: "Dhaka",
      paymentMethod: "BKASH",
      pricingTier: "REGULAR",
    });
    assert.equal(totals.subtotalBdt, 55_000);
  });

  it("confirms cash on delivery unless a deposit is owed", () => {
    const small = calculateOrderTotals({
      lines: [{ product: cable, qty: 1 }],
      district: "Sylhet",
      paymentMethod: "COD",
      pricingTier: "CASH",
    });
    assert.equal(small.orderStatus, "CONFIRMED");
    assert.equal(small.depositRequirement.requiresDeposit, false);

    const large = calculateOrderTotals({
      lines: [{ product: cpu, qty: 1 }],
      district: "Sylhet",
      paymentMethod: "COD",
      pricingTier: "CASH",
    });
    assert.equal(large.orderStatus, "PENDING");
    assert.equal(large.depositRequirement.requiresDeposit, true);
  });

  it("does not require a deposit inside Dhaka", () => {
    const totals = calculateOrderTotals({
      lines: [{ product: cpu, qty: 1 }],
      district: " dhaka ",
      paymentMethod: "COD",
      pricingTier: "CASH",
    });
    assert.equal(totals.depositRequirement.requiresDeposit, false);
    assert.equal(totals.deliveryFeeBdt, 70);
  });

  it("keeps a bKash order pending until its payment is proven", () => {
    const totals = calculateOrderTotals({
      lines: [{ product: cable, qty: 1 }],
      district: "Dhaka",
      paymentMethod: "BKASH",
      pricingTier: "CASH",
    });
    assert.equal(totals.orderStatus, "PENDING");
  });
});

describe("applyPayment", () => {
  const order = { totalPayableBdt: 10_140, paidAmountBdt: 0 };

  it("records a deposit against the amount due", () => {
    assert.deepEqual(applyPayment(order, 1_000), { paidAmountBdt: 1_000, dueAmountBdt: 9_140 });
  });

  it("adds to earlier payments and reaches zero due", () => {
    assert.deepEqual(applyPayment({ totalPayableBdt: 10_140, paidAmountBdt: 1_000 }, 9_140), {
      paidAmountBdt: 10_140,
      dueAmountBdt: 0,
    });
  });

  it("refuses overpayment and invalid amounts", () => {
    assert.equal(applyPayment(order, 10_141), null);
    assert.equal(applyPayment(order, 0), null);
    assert.equal(applyPayment(order, -5), null);
    assert.equal(applyPayment(order, 10.5), null);
    assert.equal(applyPayment(order, Number.NaN), null);
  });

  it("refuses any payment on a fully paid order", () => {
    assert.equal(applyPayment({ totalPayableBdt: 500, paidAmountBdt: 500 }, 1), null);
  });
});
