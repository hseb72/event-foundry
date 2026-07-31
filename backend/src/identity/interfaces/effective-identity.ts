import type { Experience } from '@prisma/client';

/**
 * Identité effective d'un utilisateur à un instant donné, calculée à partir de ses rôles et de
 * son contexte actif (ADR.08/ADR.11). C'est la vue consommée par l'autorisation et encodée dans
 * le JWT d'accès. Les permissions sont l'union des permissions des rôles plateforme et des rôles
 * de l'organisation active — l'expérience active ne modifie jamais les permissions.
 */
export interface EffectiveIdentity {
  userId: string;
  email: string;
  displayName: string;
  /** Noms des rôles en vigueur (plateforme + organisation active). */
  roles: string[];
  /** Clés de permissions effectives (union, triées). */
  permissions: string[];
  /** Expériences disponibles, déduites de l'ensemble des rôles (tous contextes). */
  experiences: Experience[];
  /** Expérience active (contexte d'interface), jamais liée aux permissions. */
  activeExperience: Experience | null;
  /** Organisation active dans laquelle les rôles d'organisation s'appliquent. */
  activeOrganizationId: string | null;
  /** Clé de l'offre commerciale de l'organisation active (module le niveau de service). */
  subscription: string | null;
}
