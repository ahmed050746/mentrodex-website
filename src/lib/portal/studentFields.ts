import { normalizePakPhone } from "@/lib/normalizePakPhone";
import { LOGIN_IDENTIFIER_MAX_LEN } from "./constants";
import { clampOptionalString, validateDisplayName, validatePasswordInput } from "./validation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeStudentEmail(raw: unknown): string | null {
  const s = clampOptionalString(raw, LOGIN_IDENTIFIER_MAX_LEN);
  if (!s) return null;
  const email = s.toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export function normalizeStudentPhone(raw: unknown): string | null {
  const s = clampOptionalString(raw, LOGIN_IDENTIFIER_MAX_LEN);
  if (!s) return null;

  const pk = normalizePakPhone(s);
  if (pk) return `+${pk}`;

  const compact = s.replace(/\s/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact) && compact.length <= 20) {
    return compact;
  }
  return null;
}

export type ParsedStudentUpsert = {
  display_name?: string | null;
  email?: string | null;
  phone_e164?: string | null;
  password?: string;
  is_active?: boolean;
};

export function parseStudentCreateBody(
  body: Record<string, unknown>,
): { data: ParsedStudentUpsert & { password: string } } | { error: string } {
  const display_name = validateDisplayName(body.display_name);
  const email = normalizeStudentEmail(body.email);
  const phone_e164 = normalizeStudentPhone(body.phone);

  if (!email && !phone_e164) {
    return { error: "Enter a valid email or phone number." };
  }

  const password = validatePasswordInput(body.password);
  if (!password) {
    return { error: "Password is required (1–256 characters)." };
  }

  return {
    data: {
      display_name,
      email,
      phone_e164,
      password,
      is_active:
        body.is_active === undefined ? true : Boolean(body.is_active),
    },
  };
}

export function parseStudentPatchBody(
  body: Record<string, unknown>,
): { data: ParsedStudentUpsert } | { error: string } {
  const patch: ParsedStudentUpsert = {};

  if (body.display_name !== undefined) {
    patch.display_name = validateDisplayName(body.display_name);
  }
  if (body.email !== undefined) {
    const email = body.email === null || body.email === ""
      ? null
      : normalizeStudentEmail(body.email);
    if (body.email !== null && body.email !== "" && !email) {
      return { error: "Invalid email address." };
    }
    patch.email = email;
  }
  if (body.phone !== undefined || body.phone_e164 !== undefined) {
    const raw = body.phone ?? body.phone_e164;
    const phone_e164 =
      raw === null || raw === "" ? null : normalizeStudentPhone(raw);
    if (raw !== null && raw !== "" && !phone_e164) {
      return { error: "Invalid phone number." };
    }
    patch.phone_e164 = phone_e164;
  }
  if (body.is_active !== undefined) {
    patch.is_active = Boolean(body.is_active);
  }
  if (body.password !== undefined && body.password !== null && body.password !== "") {
    const password = validatePasswordInput(body.password);
    if (!password) {
      return { error: "Invalid password (1–256 characters)." };
    }
    patch.password = password;
  }

  if (
    patch.email === null &&
    patch.phone_e164 === null &&
    body.email !== undefined &&
    body.phone !== undefined
  ) {
    return { error: "Student must have an email or phone number." };
  }

  return { data: patch };
}