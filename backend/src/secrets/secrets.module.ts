import { Global, Module } from '@nestjs/common';
import { SECRET_CIPHER } from './cipher/secret-cipher';
import { XorSecretCipher } from './cipher/xor-secret-cipher';
import { SECRETS_PROVIDER } from './ports/secrets-provider';
import { SecretMaterialRepository } from './repositories/secret-material.repository';
import { SecretRefRepository } from './repositories/secret-ref.repository';
import { StubSecretsProvider } from './services/stub-secrets-provider';

/**
 * Secrets Management (ADR.21). Global : tout domaine (AI, Config…) injecte `SECRETS_PROVIDER` sans
 * import explicite. Le moteur de chiffrement (`SECRET_CIPHER`) et le provider sont des abstractions
 * remplaçables — le bouchon XOR/local est monté ici, un vault externe le remplacerait en production.
 */
@Global()
@Module({
  providers: [
    SecretRefRepository,
    SecretMaterialRepository,
    { provide: SECRET_CIPHER, useClass: XorSecretCipher },
    { provide: SECRETS_PROVIDER, useClass: StubSecretsProvider },
  ],
  exports: [SECRETS_PROVIDER],
})
export class SecretsModule {}
