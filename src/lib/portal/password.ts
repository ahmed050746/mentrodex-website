import { scrypt, timingSafeEqual, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const SCRYPT_PREFIX = "scrypt";
const KEY_LEN = 64;

/**
 * Hash for `students.password_hash` (server-only). Uses Node scrypt — no extra npm deps in Step 1.
 */
export async function hashPortalPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${SCRYPT_PREFIX}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPortalPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  let derived: Buffer;
  try {
    derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  } catch {
    return false;
  }

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }

  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}