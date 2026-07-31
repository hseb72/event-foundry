import type { SecretScope, SecretStatus, SecretType } from '@prisma/client';

/** Jeton d'injection du gestionnaire de secrets (abstraction — ADR.21). */
export const SECRETS_PROVIDER = Symbol('SECRETS_PROVIDER');

/** Entrée de stockage d'un secret. Si `reference` est absente, elle est générée. */
export interface PutSecretInput {
  reference?: string;
  type: SecretType;
  scope: SecretScope;
  scopeId?: string | null;
  provider?: string | null;
  value: string;
}

/**
 * Métadonnées d'un secret (jamais la valeur — RG-SEC-01/03). `masked` est la seule représentation
 * affichable (`••••abcd`). Exposées aux interfaces d'administration.
 */
export interface SecretMetadata {
  reference: string;
  type: SecretType;
  scope: SecretScope;
  scopeId: string | null;
  provider: string | null;
  lastFour: string | null;
  masked: string;
  status: SecretStatus;
  createdAt: string;
  rotatedAt: string | null;
  expiresAt: string | null;
}

/**
 * Gestionnaire de secrets (ADR.21 / TSPEC.08). Le domaine ne manipule que des **références** ; la
 * valeur n'est résolue qu'au point d'usage (`resolve`). Portable : plusieurs backends possibles
 * (K8s, Vault, bouchon de dev). Toute rotation garde la même référence (RG-SEC-05).
 */
export interface SecretsProvider {
  /** Stocke (chiffré) un secret et retourne ses métadonnées masquées. */
  put(input: PutSecretInput): Promise<SecretMetadata>;
  /** Résout la valeur en clair — UNIQUEMENT au moment de l'usage (jamais journalisée). */
  resolve(reference: string): Promise<string>;
  /** Renouvelle la valeur ; la référence est inchangée. */
  rotate(reference: string, newValue: string): Promise<SecretMetadata>;
  /** Métadonnées masquées (ou null si inconnu). */
  describe(reference: string): Promise<SecretMetadata | null>;
  /** Met à jour le statut (ex. TESTED / FAILED après un test de connexion). */
  setStatus(reference: string, status: SecretStatus): Promise<SecretMetadata>;
  /** Révoque un secret : la valeur est supprimée, la référence marquée REVOKED. */
  revoke(reference: string): Promise<void>;
}
