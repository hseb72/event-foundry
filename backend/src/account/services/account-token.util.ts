import { createHash, randomBytes } from 'node:crypto';

/**
 * Fabrique des jetons de compte (IAM-005). Le jeton en clair (URL-safe, 256 bits) n'est remis qu'au
 * destinataire ; seule son empreinte SHA-256 est persistée. Utilisé par tous les flux à lien
 * (vérification d'e-mail, récupération de mot de passe, changement d'e-mail, invitations).
 */
export function generateAccountToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashAccountToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function accountTokenExpiry(hours: number): Date {
  return new Date(Date.now() + hours * 3600 * 1000);
}
