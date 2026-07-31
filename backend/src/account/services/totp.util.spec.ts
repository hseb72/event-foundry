import { createHmac } from 'node:crypto';
import { generateTotpSecret, totpAuthUri, verifyTotp } from './totp.util';

/** Recalcule le code courant à partir du secret pour tester verifyTotp de bout en bout. */
function currentCode(secret: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const c of secret.replace(/=+$/, '').toUpperCase()) {
    const idx = alphabet.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  const key = Buffer.from(bytes);
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(0, 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac('sha1', key).update(buf).digest();
  const off = digest[digest.length - 1] & 0x0f;
  const bin =
    ((digest[off] & 0x7f) << 24) |
    ((digest[off + 1] & 0xff) << 16) |
    ((digest[off + 2] & 0xff) << 8) |
    (digest[off + 3] & 0xff);
  return (bin % 1_000_000).toString().padStart(6, '0');
}

describe('totp.util (RFC 6238)', () => {
  it('génère un secret base32 et une URI otpauth valides', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    const uri = totpAuthUri(secret, 'user@b.c');
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(`secret=${secret}`);
  });

  it('vérifie le code courant et rejette un code erroné', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, currentCode(secret))) .toBe(true);
    expect(verifyTotp(secret, '000000')).toBe(false);
    expect(verifyTotp(secret, 'abc')).toBe(false);
  });
});
