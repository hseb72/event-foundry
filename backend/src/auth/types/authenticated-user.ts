import type { Experience } from '@prisma/client';

/** Utilisateur authentifié, attaché à la requête par le JwtAuthGuard. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  /** Permissions effectives (Identity V2) — base du contrôle d'accès fin (ADR.08). */
  permissions: string[];
  /** Expérience active (contexte d'interface uniquement). */
  activeExperience: Experience | null;
  /** Organisation active dans laquelle les rôles d'organisation s'appliquent. */
  activeOrganizationId: string | null;
}

/** Charge utile signée dans le JWT d'accès (encode l'identité effective). */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  experience: Experience | null;
  organizationId: string | null;
}
