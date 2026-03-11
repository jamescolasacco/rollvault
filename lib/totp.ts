import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;

function base32Encode(buffer: Buffer): string {
  let output = "";
  let value = 0;
  let bits = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(secret: string): Buffer {
  const normalized = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  if (!normalized) {
    throw new Error("Invalid TOTP secret.");
  }

  let value = 0;
  let bits = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid TOTP secret.");
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function generateTotpAt({
  secret,
  timestamp,
  periodSeconds = TOTP_PERIOD_SECONDS,
  digits = TOTP_DIGITS,
}: {
  secret: string;
  timestamp: number;
  periodSeconds?: number;
  digits?: number;
}): string {
  const counter = Math.floor(timestamp / 1000 / periodSeconds);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const key = base32Decode(secret);
  const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 10 ** digits).toString().padStart(digits, "0");
}

function secureCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(crypto.randomBytes(bytes));
}

export function verifyTotpCode({
  secret,
  code,
  window = 1,
}: {
  secret: string;
  code: string;
  window?: number;
}): boolean {
  const normalizedCode = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }

  const now = Date.now();
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = generateTotpAt({
      secret,
      timestamp: now + offset * TOTP_PERIOD_SECONDS * 1000,
    });
    if (secureCompare(candidate, normalizedCode)) {
      return true;
    }
  }

  return false;
}

export function buildTotpOtpauthUrl({
  accountName,
  secret,
  issuer = process.env.APP_NAME || "RollVault",
}: {
  accountName: string;
  secret: string;
  issuer?: string;
}): string {
  const label = `${issuer}:${accountName}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}
