import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * TOTP (RFC 6238, HMAC-SHA1, 6 chiffres, pas de 30 s) implémenté sans dépendance externe. Utilisé
 * pour l'authentification multifacteur (FSPEC.18 §MFA). La tolérance ±1 fenêtre absorbe la dérive
 * d'horloge. Compatible avec les applications d'authentification (Google Authenticator, etc.).
 */

const DIGITS = 6;
const PERIOD_SECONDS = 30;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Génère un secret TOTP aléatoire encodé en base32 (160 bits). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** URI d'approvisionnement `otpauth://` à saisir/scanner dans l'application d'authentification. */
export function totpAuthUri(secret: string, account: string, issuer = 'EventFoundry'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(PERIOD_SECONDS) });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Vérifie un code TOTP avec une tolérance de ±`window` fenêtres (défaut 1). */
export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const normalized = token.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  const counter = Math.floor(Date.now() / 1000 / PERIOD_SECONDS);
  const key = base32Decode(secret);
  for (let offset = -window; offset <= window; offset++) {
    if (constantTimeEqual(hotp(key, counter + offset), normalized)) {
      return true;
    }
  }
  return false;
}

/** HMAC-based OTP (RFC 4226) pour un compteur donné. */
function hotp(key: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  // Compteur 64 bits big-endian (les fenêtres TOTP restent bien dans 32 bits en pratique).
  buffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac('sha1', key).update(buffer).digest();
  const dynamicOffset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[dynamicOffset] & 0x7f) << 24) |
    ((digest[dynamicOffset + 1] & 0xff) << 16) |
    ((digest[dynamicOffset + 2] & 0xff) << 8) |
    (digest[dynamicOffset + 3] & 0xff);
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
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

function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      continue;
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
