/**
 * Bangladesh Phone Number Validation and Normalization
 * Standard format: +8801XXXXXXXXX (14 characters total)
 */

export const BD_PHONE_REGEX = /^(?:\+88|88)?(01[3-9]\d{8})$/;

/**
 * Validates whether the given string is a valid Bangladeshi mobile number.
 * Accepts:
 *  - 01712345678
 *  - +8801712345678
 *  - 8801712345678
 */
export function isValidBdPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleanPhone = phone.trim().replace(/[\s-]/g, "");
  return BD_PHONE_REGEX.test(cleanPhone);
}

/**
 * Normalizes any valid Bangladeshi mobile number into the canonical database format:
 * `+8801XXXXXXXXX`
 * Throws an error or returns empty string if invalid.
 */
export function normalizeBdPhone(phone: string): string {
  if (!phone || typeof phone !== "string") return "";
  const cleanPhone = phone.trim().replace(/[\s-]/g, "");
  const match = cleanPhone.match(BD_PHONE_REGEX);
  if (!match || !match[1]) {
    return "";
  }
  return `+88${match[1]}`;
}

/**
 * Formats a normalized BD phone number for human-friendly display:
 * `+880 1712-345678`
 */
export function formatBdPhoneDisplay(phone: string): string {
  const normalized = normalizeBdPhone(phone);
  if (!normalized || normalized.length !== 14) return phone;
  // +88 01712 345678
  const operator = normalized.slice(3, 7); // 0171
  const rest = normalized.slice(7); // 2345678
  return `+880 ${operator.slice(1)}-${rest}`;
}
