import { Injectable } from '@nestjs/common';
import type { Experience, Prisma, RoleScope } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { identityInclude, type IdentityGraph } from '../entities/identity-graph.entity';

/** Rôle résumé pour les validations de portée (assignation plateforme vs organisation). */
export interface RoleSummary {
  id: string;
  scope: RoleScope;
}

/** Organisation résumée pour l'administration (avec le nombre de membres). */
export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  subscription: string | null;
  memberCount: number;
}

/** Mise à jour de profil (self-service). Seuls les champs fournis sont modifiés. */
export interface ProfileUpdate {
  displayName?: string;
  preferences?: Record<string, unknown>;
}

/**
 * Seul point d'accès PostgreSQL du domaine Identity (encapsule Prisma — ADR.02/ADR.07).
 * Ne contient aucune logique métier : le calcul de l'identité effective est dans le Service.
 */
@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  loadGraph(userId: string): Promise<IdentityGraph | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, include: identityInclude });
  }

  loadGraphOrThrow(userId: string): Promise<IdentityGraph> {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: identityInclude });
  }

  setActiveExperience(userId: string, experience: Experience): Promise<void> {
    return this.prisma.user
      .update({ where: { id: userId }, data: { activeExperience: experience } })
      .then(() => undefined);
  }

  setActiveOrganization(userId: string, organizationId: string | null): Promise<void> {
    return this.prisma.user
      .update({ where: { id: userId }, data: { activeOrganizationId: organizationId } })
      .then(() => undefined);
  }

  findRoleIdByName(name: string): Promise<string | null> {
    return this.prisma.role
      .findUnique({ where: { name }, select: { id: true } })
      .then((role) => role?.id ?? null);
  }

  findRoleByName(name: string): Promise<RoleSummary | null> {
    return this.prisma.role.findUnique({ where: { name }, select: { id: true, scope: true } });
  }

  userExists(userId: string): Promise<boolean> {
    return this.prisma.user
      .findUnique({ where: { id: userId }, select: { id: true } })
      .then((user) => user != null);
  }

  /** Ajoute un rôle plateforme à un utilisateur (idempotent). */
  async addPlatformRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removePlatformRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<void> {
    const data: Prisma.UserUpdateInput = {};
    if (update.displayName !== undefined) data.displayName = update.displayName;
    if (update.preferences !== undefined) {
      data.preferences = update.preferences as Prisma.InputJsonValue;
    }
    await this.prisma.user.update({ where: { id: userId }, data });
  }

  findSubscriptionPlanIdByKey(key: string): Promise<string | null> {
    return this.prisma.subscriptionPlan
      .findUnique({ where: { key }, select: { id: true } })
      .then((plan) => plan?.id ?? null);
  }

  createOrganization(input: {
    name: string;
    slug: string;
    subscriptionPlanId: string | null;
  }): Promise<{ id: string }> {
    return this.prisma.organization.create({
      data: { name: input.name, slug: input.slug, subscriptionPlanId: input.subscriptionPlanId },
      select: { id: true },
    });
  }

  organizationExists(organizationId: string): Promise<boolean> {
    return this.prisma.organization
      .findUnique({ where: { id: organizationId }, select: { id: true } })
      .then((organization) => organization != null);
  }

  async listOrganizations(): Promise<OrganizationSummary[]> {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: { subscriptionPlan: { select: { key: true } }, _count: { select: { memberships: true } } },
    });
    return organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      isActive: organization.isActive,
      subscription: organization.subscriptionPlan?.key ?? null,
      memberCount: organization._count.memberships,
    }));
  }

  /** Ajoute une appartenance (idempotente) et retourne son identifiant. */
  async ensureMembership(userId: string, organizationId: string): Promise<string> {
    const membership = await this.prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      update: {},
      create: { userId, organizationId },
      select: { id: true },
    });
    return membership.id;
  }

  async addMembershipRole(membershipId: string, roleId: string): Promise<void> {
    await this.prisma.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId, roleId } },
      update: {},
      create: { membershipId, roleId },
    });
  }
}
