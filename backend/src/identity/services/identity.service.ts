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
