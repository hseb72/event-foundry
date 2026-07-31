import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SecretStatus, type SecretRef } from '@prisma/client';
import { SECRET_CIPHER, type SecretCipher } from '../cipher/secret-cipher';
import type { PutSecretInput, SecretMetadata, SecretsProvider } from '../ports/secrets-provider';
import { SecretMaterialRepository } from '../repositories/secret-material.repository';
import { SecretRefRepository } from '../repositories/secret-ref.repository';

/**
 * Gestionnaire de secrets — implémentation de dev basée sur le backend local (métadonnées en base,
 * valeur chiffrée par le moteur bouchon). Applique les règles ADR.21 : références logiques, valeur
 * jamais renvoyée en clair sauf `resolve` au point d'usage, masquage, rotation, révocation,
 * journalisation **sans valeur**. Un backend de production (Vault) implémente le même port.
 */
@Injectable()
export class StubSecretsProvider implements SecretsProvider {
  private readonly logger = new Logger('SecretsProvider');

  constructor(
    private readonly refs: SecretRefRepository,
    private readonly material: SecretMaterialRepository,
    @Inject(SECRET_CIPHER) private readonly cipher: SecretCipher,
  ) {}

  async put(input: PutSecretInput): Promise<SecretMetadata> {
    const reference = input.reference ?? randomUUID();
    await this.material.put(reference, this.cipher.encrypt(input.value));
    const ref = await this.refs.upsert(reference, {
      reference,
      type: input.type,
      scope: input.scope,
      scopeId: input.scopeId ?? null,
      provider: input.provider ?? null,
      lastFour: lastFour(input.value),
      status: SecretStatus.CONFIGURED,
    });
    this.logAccess('put', reference, ref.type);
    return toMetadata(ref);
  }

  async resolve(reference: string): Promise<string> {
    const ref = await this.refs.findByReference(reference);
    if (!ref) {
      this.logAccess('resolve-denied', reference);
      throw new NotFoundException(`Secret introuvable : ${reference}`);
    }
    if (ref.status === SecretStatus.REVOKED || ref.status === SecretStatus.EXPIRED) {
      this.logAccess(`resolve-blocked(${ref.status})`, reference, ref.type);
      throw new NotFoundException(`Secret indisponible : ${reference}`);
    }
    const ciphertext = await this.material.getCiphertext(reference);
    if (ciphertext == null) {
      throw new NotFoundException(`Valeur de secret absente : ${reference}`);
    }
    this.logAccess('resolve', reference, ref.type);
    return this.cipher.decrypt(ciphertext);
  }

  async rotate(reference: string, newValue: string): Promise<SecretMetadata> {
    const existing = await this.refs.findByReference(reference);
    if (!existing) {
      throw new NotFoundException(`Secret introuvable : ${reference}`);
    }
    await this.material.put(reference, this.cipher.encrypt(newValue));
    const ref = await this.refs.markRotated(reference, lastFour(newValue) ?? '');
    this.logAccess('rotate', reference, ref.type);
    return toMetadata(ref);
  }

  async describe(reference: string): Promise<SecretMetadata | null> {
    const ref = await this.refs.findByReference(reference);
    return ref ? toMetadata(ref) : null;
  }

  async setStatus(reference: string, status: SecretStatus): Promise<SecretMetadata> {
    const ref = await this.refs.setStatus(reference, status);
    return toMetadata(ref);
  }

  async revoke(reference: string): Promise<void> {
    await this.material.delete(reference);
    await this.refs.setStatus(reference, SecretStatus.REVOKED);
    this.logAccess('revoke', reference);
  }

  /** Journalisation SANS valeur (RG-SEC-07) : date, opération, référence, type. */
  private logAccess(operation: string, reference: string, type?: string): void {
    this.logger.log(`secret ${operation} ref=${reference}${type ? ` type=${type}` : ''}`);
  }
}

/** 4 derniers caractères — seule fraction affichable (RG-SEC-03). */
function lastFour(value: string): string | null {
  return value.length >= 4 ? value.slice(-4) : null;
}

function toMetadata(ref: SecretRef): SecretMetadata {
  return {
    reference: ref.reference,
    type: ref.type,
    scope: ref.scope,
    scopeId: ref.scopeId,
    provider: ref.provider,
    lastFour: ref.lastFour,
    masked: ref.lastFour ? `••••${ref.lastFour}` : '••••',
    status: ref.status,
    createdAt: ref.createdAt.toISOString(),
    rotatedAt: ref.rotatedAt ? ref.rotatedAt.toISOString() : null,
    expiresAt: ref.expiresAt ? ref.expiresAt.toISOString() : null,
  };
}
