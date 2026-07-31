import { Injectable, Logger } from '@nestjs/common';
import type { SecretCipher } from './secret-cipher';

const DEFAULT_DEV_KEY = 'ef-dev-stub-secret-key';

/**
 * BOUCHON de développement — chiffrement XOR + Base64. **NON cryptographique** : à ne jamais
 * utiliser en production. Il virtualise le moteur de chiffrement pour dérouler et tester toute la
 * mécanique des secrets (ADR.21) sans infrastructure. Remplacé en production par un moteur réel
 * (KMS/AES-GCM) ou un vault externe, sans changer le reste du domaine.
 *
 * Garde-fou : refuse de démarrer en production (`NODE_ENV=production`) — un vrai moteur doit y être
 * câblé, sinon les secrets ne seraient pas réellement protégés.
 */
@Injectable()
export class XorSecretCipher implements SecretCipher {
  private readonly logger = new Logger('XorSecretCipher');
  private readonly key: string;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'XorSecretCipher est un bouchon NON cryptographique et ne doit jamais être utilisé en ' +
          'production. Câblez un vrai moteur de chiffrement (SECRET_CIPHER) ou un vault externe.',
      );
    }
    // Clé de dev externalisée ; à défaut, une valeur locale (le XOR n'offre aucune protection réelle).
    const configured = process.env.SECRETS_STUB_KEY?.trim();
    if (!configured) {
      this.logger.warn(
        'SECRETS_STUB_KEY non défini : utilisation de la clé de dev par défaut (bouchon, non sécurisé).',
      );
    }
    this.key = configured || DEFAULT_DEV_KEY;
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
