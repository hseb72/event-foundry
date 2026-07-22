import { Injectable, Logger } from '@nestjs/common';
import { Experience } from '@prisma/client';
import type { IdentityGraph } from '../entities/identity-graph.entity';
import { ExperienceNotAvailableException } from '../exceptions/experience-not-available.exception';
import { OrganizationNotAccessibleException } from '../exceptions/organization-not-accessible.exception';
import type { EffectiveIdentity } from '../interfaces/effective-identity';
import type { IIdentityService } from '../interfaces/identity-service.interface';
import { IdentityRepository, type ProfileUpdate } from '../repositories/identity.repository';
import { availableExperiences, computeEffectiveIdentity } from './effective-identity.util';

const DEFAULT_ROLE = 'Explorer';

/**
 * Rôle plateforme « organisateur autonome » (mode individuel — STRAT / CLAUDE.md §11) : un Explorer
 * peut se déclarer organisateur sans appartenir à une organisation. Portée PLATEFORME (permissions
 * actives sans organisation active) ; débloque l'expérience Organizer. Les événements créés sont
 * rattachés à l'utilisateur (`createdById`), l'organisateur (référentiel) restant optionnel.
 */
const AUTONOMOUS_ORGANIZER_ROLE = 'Organisateur autonome';
const AUTONOMOUS_ORGANIZER_DESCRIPTION =
  'Organisateur individuel (mode autonome, sans organisation) : crée et publie ses propres événements.';
const AUTONOMOUS_ORGANIZER_PERMISSIONS = [
  'catalog.read',
  'event.read',
  'event.create',
  'event.update',
  'event.publish',
  'event.archive',
  'import.create',
  'import.execute',
  'dashboard.view',
  'statistics.view',
];

/**
 * Domaine Identity (TSPEC.06) : calcul de l'identité effective et gestion du contexte actif.
 * Orchestre le Repository (Prisma confiné) et la logique pure de `effective-identity.util`.
 * Journalise les opérations sensibles (changement d'expérience/d'organisation) — TSPEC.06.
 */
@Injectable()
export class IdentityService implements IIdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(private readonly repository: IdentityRepository) {}

  async getEffectiveIdentity(userId: string): Promise<EffectiveIdentity> {
    return computeEffectiveIdentity(await this.repository.loadGraphOrThrow(userId));
  }

  getIdentityGraph(userId: string): Promise<IdentityGraph> {
    return this.repository.loadGraphOrThrow(userId);
  }

  async changeActiveExperience(userId: string, experience: Experience): Promise<EffectiveIdentity> {
    const graph = await this.repository.loadGraphOrThrow(userId);
    if (!availableExperiences(graph).includes(experience)) {
      throw new ExperienceNotAvailableException(experience);
    }

    // Passer à l'expérience Organizer sans organisation active : sélectionner la première
    // appartenance pour que les rôles d'organisation s'appliquent (contexte cohérent).
    if (
      experience === Experience.ORGANIZER &&
      graph.activeOrganizationId == null &&
      graph.memberships.length > 0
    ) {
      await this.repository.setActiveOrganization(userId, graph.memberships[0].organizationId);
    }

    await this.repository.setActiveExperience(userId, experience);
    this.logger.log(`ExperienceChanged user=${userId} experience=${experience}`);
    return this.getEffectiveIdentity(userId);
  }

  async changeActiveOrganization(
    userId: string,
    organizationId: string | null,
  ): Promise<EffectiveIdentity> {
    if (organizationId != null) {
      const graph = await this.repository.loadGraphOrThrow(userId);
      const belongs = graph.memberships.some((m) => m.organizationId === organizationId);
      if (!belongs) {
        throw new OrganizationNotAccessibleException(organizationId);
      }
    }

    await this.repository.setActiveOrganization(userId, organizationId);
    this.logger.log(`OrganizationChanged user=${userId} organization=${organizationId ?? 'none'}`);
    return this.getEffectiveIdentity(userId);
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<EffectiveIdentity> {
    await this.repository.updateProfile(userId, update);
    return this.getEffectiveIdentity(userId);
  }

  /**
   * Active/désactive le mode **organisateur autonome** (self-service). À l'activation, l'utilisateur
   * reçoit le rôle plateforme correspondant (débloque l'expérience Organizer + son interface). À la
   * désactivation, le rôle est retiré et l'expérience active repli sur Explorer si besoin. Le rôle
   * est garanti à la volée (aucun re-seed requis). Renvoie l'identité effective réémise ensuite.
   */
  async setAutonomousOrganizer(userId: string, enabled: boolean): Promise<EffectiveIdentity> {
    const roleId = await this.repository.ensurePlatformRole(
      AUTONOMOUS_ORGANIZER_ROLE,
      AUTONOMOUS_ORGANIZER_DESCRIPTION,
      Experience.ORGANIZER,
      AUTONOMOUS_ORGANIZER_PERMISSIONS,
    );
    if (enabled) {
      await this.repository.addPlatformRole(userId, roleId);
      this.logger.log(`AutonomousOrganizerEnabled user=${userId}`);
    } else {
      await this.repository.removePlatformRole(userId, roleId);
      // Si l'expérience active était Organizer et n'est plus disponible, revenir à Explorer.
      const graph = await this.repository.loadGraphOrThrow(userId);
      if (
        graph.activeExperience === Experience.ORGANIZER &&
        !availableExperiences(graph).includes(Experience.ORGANIZER)
      ) {
        await this.repository.setActiveExperience(userId, Experience.EXPLORER);
      }
      this.logger.log(`AutonomousOrganizerDisabled user=${userId}`);
    }
    return this.getEffectiveIdentity(userId);
  }

  async assignDefaultExplorerRole(userId: string): Promise<void> {
    const roleId = await this.repository.findRoleIdByName(DEFAULT_ROLE);
    if (!roleId) {
      // Défensif : le seed n'a pas été exécuté. On ne bloque pas l'inscription.
      this.logger.warn(`Rôle par défaut « ${DEFAULT_ROLE} » introuvable — inscription sans rôle.`);
      return;
    }
    await this.repository.addPlatformRole(userId, roleId);
    await this.repository.setActiveExperience(userId, Experience.EXPLORER);
  }
}
