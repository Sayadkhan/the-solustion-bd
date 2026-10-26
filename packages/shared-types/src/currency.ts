/**
 * Bangladeshi Taka (BDT) Currency Utilities
 * Formats numbers using the South Asian (Lakh/Crore) numbering system (en-IN / bn-BD)
 * E.g., 145500 -> "৳1,45,500"
 */

export const BDT_SYMBOL = "৳";

export interface FormatBdtOptions {
  withSymbol?: boolean;
  inBengaliDigits?: boolean;
}

const BENGALI_DIGITS: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

/**
 * Formats integer amount in whole Taka.
 * Always rounds or truncates to whole integer (zero decimals).
 */
export function formatBdt(amount: number, options: FormatBdtOptions = {}): string {
  const { withSymbol = true, inBengaliDigits = false } = options;

  // Enforce whole integer for all BDT storage & calculations
  const integerAmount = Math.round(Number(amount) || 0);

  // en-IN uses South Asian numbering grouping: 1,00,000 (1 Lakh), 1,00,00,000 (1 Crore)
  const formattedEn = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(integerAmount);

  let finalNumber = formattedEn;

  if (inBengaliDigits) {
    finalNumber = formattedEn.replace(/\d/g, (d) => BENGALI_DIGITS[d] || d);
  }

  return withSymbol ? `${BDT_SYMBOL}${finalNumber}` : finalNumber;
}

/**
 * Parses a formatted BDT string into a clean integer number.
 */
export function parseBdt(formatted: string): number {
  if (!formatted) return 0;

  // Convert Bengali numerals to Western numerals if present
  let sanitized = formatted;
  for (const [en, bn] of Object.entries(BENGALI_DIGITS)) {
    sanitized = sanitized.split(bn).join(en);
  }

  // Remove BDT symbols, spaces, commas
  sanitized = sanitized.replace(/[^0-9-]/g, "");
  const parsed = parseInt(sanitized, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates standard EMI monthly installment
 * @param regularPriceBdt Full regular retail price
 * @param months Number of installment months (e.g., 3, 6, 9, 12)
 */
export function calculateEmiMonthlyBdt(regularPriceBdt: number, months: 3 | 6 | 9 | 12): number {
  const price = Math.round(regularPriceBdt || 0);
  return Math.ceil(price / months);
}
