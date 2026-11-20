/** Pakistan MSISDN: 92 + 3 + 9 subscriber digits (e.g. 923321319363). */
export const PAK_PHONE_REGEX = /^923\d{9}$/;

/**
 * Normalize user-entered PK mobile to `923XXXXXXXXX` (digits only, no + / spaces / leading 0).
 * Returns null if the result does not match {@link PAK_PHONE_REGEX}.
 */
export function normalizePakPhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0092")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("03") && digits.length === 11) {
    digits = `92${digits.slice(1)}`;
  } else if (digits.startsWith("3") && digits.length === 10) {
    digits = `92${digits}`;
  }

  return PAK_PHONE_REGEX.test(digits) ? digits : null;
}