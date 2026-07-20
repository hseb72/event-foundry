import { Injectable } from '@nestjs/common';
import type { SecretCipher } from './secret-cipher';

/**
 * BOUCHON de développement — chiffrement XOR + Base64. **NON cryptographique** : à ne jamais
 * utiliser en production. Il virtualise le moteur de chiffrement pour dérouler et tester toute la
 * mécanique des secrets (ADR.21) sans infrastructure. Remplacé en production par un moteur réel
 * (KMS/AES-GCM) ou un vault externe, sans changer le reste du domaine.
 */
@Injectable()
export class XorSecretCipher implements SecretCipher {
  private readonly key: string;

  constructor() {
    // Clé de dev externalisée (jamais versionnée en clair en production — RG-SEC-04).
    this.key = process.env.SECRETS_STUB_KEY || 'ef-dev-stub-secret-key';
  }

  encrypt(plaintext: string): string {
    return Buffer.from(this.xor(plaintext), 'binary').toString('base64');
  }

  decrypt(ciphertext: string): string {
    return this.xor(Buffer.from(ciphertext, 'base64').toString('binary'));
  }

  private xor(input: string): string {
    let out = '';
    for (let i = 0; i < input.length; i += 1) {
      out += String.fromCharCode(input.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
    }
    return out;
  }
}
