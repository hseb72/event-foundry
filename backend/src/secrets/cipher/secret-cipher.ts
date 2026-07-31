/** Jeton d'injection du moteur de chiffrement des secrets (abstraction — remplaçable). */
export const SECRET_CIPHER = Symbol('SECRET_CIPHER');

/**
 * Moteur de chiffrement des secrets (ADR.21). Abstraction : le domaine ne connaît jamais
 * l'implémentation. En production, un module KMS/AES-GCM ou un vault externe le remplace.
 */
export interface SecretCipher {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}
