import { randomInt } from 'crypto';

export const CUSTOMER_ID_PREFIX = 'A1C';
export const CUSTOMER_ID_DIGITS = 6;

/** A1C + 6 random digits, e.g. A1C482913 */
export function randomCustomerId(): string {
  let digits = '';
  for (let i = 0; i < CUSTOMER_ID_DIGITS; i++) digits += randomInt(0, 10).toString();
  return `${CUSTOMER_ID_PREFIX}${digits}`;
}

// No look-alike characters (0/O, 1/l/I) so it is easy to read out over a phone call.
const PW_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** 10-character temporary password containing upper, lower and a digit. */
export function generateTempPassword(length = 10): string {
  for (;;) {
    let pw = '';
    for (let i = 0; i < length; i++) pw += PW_CHARS[randomInt(0, PW_CHARS.length)];
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) return pw;
  }
}

export function randomInvoiceNo(): string {
  const d = new Date();
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
  return `INV-${ym}-${randomInt(10000, 99999)}`;
}

export function randomTicketNo(): string {
  return `TKT-${randomInt(100000, 999999)}`;
}

export function validatePassword(pw: unknown): string | null {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters long';
  if (pw.length > 72) return 'Password must be at most 72 characters long';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain at least one letter and one number';
  return null;
}
