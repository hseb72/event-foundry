import type { Experience } from '@prisma/client';
import type { IdentityGraph } from '../entities/identity-graph.entity';
import type { ProfileUpdate } from '../repositories/identity.repository';
import type { EffectiveIdentity } from './effective-identity';

/** Jeton d'injection : dépendre de l'abstraction, pas de l'implémentation (ADR.07). */
export const IDENTITY_SERVICE = Symbol('IDENTITY_SERVICE');

/**
 * Contrat public du domaine Identity (TSPEC.06). Point d'entrée des autres modules pour obtenir
 * l'identité effective, changer le contexte actif (expérience / organisation) et poser le rôle
 * par défaut à l'inscription. Aucune fuite de Prisma : les entrées/sorties sont des contrats.
 */
export interface IIdentityService {
  /** Identité effective (rôles, permissions, expériences, contexte) — throw si introuvable. */
  getEffectiveIdentity(userId: string): Promise<EffectiveIdentity>;
  /** Graphe complet (rôles + organisations) pour la vue `me`. */
  getIdentityGraph(userId: string): Promise<IdentityGraph>;
  /** Change l'expérience active si elle est disponible pour l'utilisateur. */
  changeActiveExperience(userId: string, experience: Experience): Promise<EffectiveIdentity>;
  /** Change l'organisation active parmi celles auxquelles l'utilisateur appartient (ou null). */
  changeActiveOrganization(userId: string, organizationId: string | null): Promise<EffectiveIdentity>;
  /** Met à jour le profil (nom affiché, préférences) de l'utilisateur courant. */
  updateProfile(userId: string, update: ProfileUpdate): Promise<EffectiveIdentity>;
  /** Pose le rôle Explorer par défaut (inscription) et l'expérience EXPLORER. Idempotent. */
  assignDefaultExplorerRole(userId: string): Promise<void>;
}
