import { Injectable, Logger } from '@nestjs/common';
import { RoleScope } from '@prisma/client';
import { IdentityUserNotFoundException } from '../exceptions/identity-user-not-found.exception';
import { OrganizationNotFoundException } from '../exceptions/organization-not-found.exception';
import { OrganizationSlugTakenException } from '../exceptions/organization-slug-taken.exception';
import { RoleNotFoundException } from '../exceptions/role-not-found.exception';
import { RoleScopeMismatchException } from '../exceptions/role-scope-mismatch.exception';
import { IdentityRepository, type OrganizationSummary } from '../repositories/identity.repository';

const DEFAULT_PLAN = 'FREE';

/**
 * Administration de l'identité (réservée à la permission `user.manage` — ADR.08) : affectation
 * des rôles plateforme et gestion des organisations et de leurs membres. Séparée du service
 * self-service pour distinguer clairement les responsabilités. Journalise les actions sensibles.
 */
@Injectable()
export class IdentityAdminService {
  private readonly logger = new Logger(IdentityAdminService.name);

  constructor(private readonly repository: IdentityRepository) {}

  /** Affecte un rôle PLATEFORME (Explorer, Operator, Finance…) à un utilisateur. */
  async assignPlatformRole(userId: string, roleName: string): Promise<void> {
    if (!(await this.repository.userExists(userId))) {
      throw new IdentityUserNotFoundException(userId);
    }
    const role = await this.repository.findRoleByName(roleName);
    if (!role) {
      throw new RoleNotFoundException(roleName);
    }
    if (role.scope !== RoleScope.PLATFORM) {
      throw new RoleScopeMismatchException(roleName, RoleScope.PLATFORM);
    }
    await this.repository.addPlatformRole(userId, role.id);
    this.logger.log(`RoleAssigned user=${userId} role=${roleName}`);
  }

  async revokePlatformRole(userId: string, roleName: string): Promise<void> {
    const role = await this.repository.findRoleByName(roleName);
    if (!role) {
      throw new RoleNotFoundException(roleName);
    }
    await this.repository.removePlatformRole(userId, role.id);
    this.logger.log(`RoleRevoked user=${userId} role=${roleName}`);
  }

  listOrganizations(): Promise<OrganizationSummary[]> {
    return this.repository.listOrganizations();
  }

  async createOrganization(name: string, slug: string): Promise<{ id: string }> {
    const planId = await this.repository.findSubscriptionPlanIdByKey(DEFAULT_PLAN);
    try {
      const created = await this.repository.createOrganization({
        name,
        slug,
        subscriptionPlanId: planId,
      });
      this.logger.log(`OrganizationCreated id=${created.id} slug=${slug}`);
      return created;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new OrganizationSlugTakenException(slug);
      }
      throw error;
    }
  }

  /** Ajoute un membre à une organisation avec un rôle d'ORGANISATION (ex. Organizer). */
  async addOrganizationMember(
    organizationId: string,
    userId: string,
    roleName: string,
  ): Promise<void> {
    if (!(await this.repository.organizationExists(organizationId))) {
      throw new OrganizationNotFoundException(organizationId);
    }
    if (!(await this.repository.userExists(userId))) {
      throw new IdentityUserNotFoundException(userId);
    }
    const role = await this.repository.findRoleByName(roleName);
    if (!role) {
      throw new RoleNotFoundException(roleName);
    }
    if (role.scope !== RoleScope.ORGANIZATION) {
      throw new RoleScopeMismatchException(roleName, RoleScope.ORGANIZATION);
    }
    const membershipId = await this.repository.ensureMembership(userId, organizationId);
    await this.repository.addMembershipRole(membershipId, role.id);
    this.logger.log(`MemberAdded org=${organizationId} user=${userId} role=${roleName}`);
  }
}
