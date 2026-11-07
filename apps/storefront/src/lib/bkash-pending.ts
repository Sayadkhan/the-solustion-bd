/**
 * Remembers which order is being paid while the customer is on bKash's site, so
 * a cancelled payment can offer a retry instead of a dead end.
 */
const KEY = "solutions_pending_bkash_invoice";

export function savePendingBkashInvoice(invoiceNo: string) {
  try {
    sessionStorage.setItem(KEY, invoiceNo);
  } catch {
    // Without storage the customer can still track the order by invoice number.
  }
}

export function readPendingBkashInvoice(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingBkashInvoice() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
