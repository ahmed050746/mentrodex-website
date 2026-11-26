import { normalizePakPhone } from "@/lib/normalizePakPhone";
import {
  BUNNY_REF_MAX_LEN,
  DISPLAY_NAME_MAX_LEN,
  LOGIN_IDENTIFIER_MAX_LEN,
  PASSWORD_MAX_LEN,
  TITLE_MAX_LEN,
} from "./constants";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function clampOptionalString(
  value: unknown,
  maxLen: number,
): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (s.length > maxLen) return null;
  return s;
}

export function requireNonEmptyString(
  value: unknown,
  maxLen: number,
): string | null {
  const s = clampOptionalString(value, maxLen);
  return s;
}

export type ParsedLoginIdentifier =
  | { kind: "email"; email: string }
  | { kind: "phone"; phone_e164: string };

/**
 * Single login field: valid email, or PK phone normalized to E.164 (`+923…`).
 */
export function parseLoginIdentifier(raw: unknown): ParsedLoginIdentifier | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > LOGIN_IDENTIFIER_MAX_LEN) return null;

  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > LOGIN_IDENTIFIER_MAX_LEN) {
      return null;
    }
    return { kind: "email", email };
  }

  const pk = normalizePakPhone(trimmed);
  if (pk) {
    return { kind: "phone", phone_e164: `+${pk}` };
  }

  if (/^\+[1-9]\d{7,14}$/.test(trimmed.replace(/\s/g, ""))) {
    const phone_e164 = trimmed.replace(/\s/g, "");
    if (phone_e164.length > 20) return null;
    return { kind: "phone", phone_e164 };
  }

  return null;
}

export function validatePasswordInput(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw;
  if (s.length < 1 || s.length > PASSWORD_MAX_LEN) return null;
  return s;
}

export function validateTitle(raw: unknown): string | null {
  return requireNonEmptyString(raw, TITLE_MAX_LEN);
}

export function validateDisplayName(raw: unknown): string | null {
  return clampOptionalString(raw, DISPLAY_NAME_MAX_LEN);
}

export function validateBunnyRef(raw: unknown): string | null {
  return requireNonEmptyString(raw, BUNNY_REF_MAX_LEN);
}