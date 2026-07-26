import { Injectable } from '@nestjs/common';
import { Experience, InvitationStatus, RoleScope, type OrganizationInvitation } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

/** Résumé d'une organisation vue par un membre (avec ses fonctions dans celle-ci). */
export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  functions: string[];
}

/** Un collaborateur d'une organisation et ses fonctions. */
export interface OrganizationMember {
  userId: string;
  displayName: string;
  email: string;
  functions: string[];
}

/**
 * Accès PostgreSQL du domaine Organisations (Prisma confiné — ADR.02). Gère organisations,
 * appartenances et fonctions (rôles d'organisation). Ne prend aucune décision : les règles
 * (dernier Owner, autorisations) vivent dans le Service.
 */
@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garantit l'existence d'un rôle d'ORGANISATION (fonction) et de ses permissions (idempotent).
   * Permet aux fonctions FSPEC.19 de fonctionner sans re-seed manuel.
   */
  async ensureFunctionRole(
    name: string,
    description: string,
    permissionKeys: string[],
  ): Promise<string> {
    const role = await this.prisma.role.upsert({
      where: { name },
      update: { description, scope: RoleScope.ORGANIZATION, experience: Experience.ORGANIZER },
      create: { name, description, scope: RoleScope.ORGANIZATION, experience: Experience.ORGANIZER },
    });
    const permissions = await this.prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });
    await this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
        skipDuplicates: true,
      });
    }
    return role.id;
  }

  slugExists(slug: string): Promise<boolean> {
    return this.prisma.organization
      .findUnique({ where: { slug }, select: { id: true } })
      .then((org) => org != null);
  }

  findDefaultPlanId(key: string): Promise<string | null> {
    return this.prisma.subscriptionPlan
      .findUnique({ where: { key }, select: { id: true } })
      .then((plan) => plan?.id ?? null);
  }

  /** Crée l'organisation et son unique membre-Owner (AC-ORG-001), en une transaction. */
  async createWithOwner(input: {
    userId: string;
    name: string;
    slug: string;
    ownerRoleId: string;
    subscriptionPlanId: string | null;
  }): Promise<{ id: string; name: string; slug: string }> {
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          subscriptionPlanId: input.subscriptionPlanId,
          createdById: input.userId,
        },
        select: { id: true, name: true, slug: true },
      });
      const membership = await tx.organizationMembership.create({
        data: { userId: input.userId, organizationId: org.id },
        select: { id: true },
      });
      await tx.membershipRole.create({ data: { membershipId: membership.id, roleId: input.ownerRoleId } });
      return org;
    });
  }

  async listForUser(userId: string): Promise<MyOrganization[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId },
      include: {
        organization: { select: { id: true, name: true, slug: true, isActive: true } },
        roles: { include: { role: { select: { name: true } } } },
      },
      orderBy: { organization: { name: 'asc' } },
    });
    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      isActive: m.organization.isActive,
      functions: m.roles.map((r) => r.role.name),
    }));
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        roles: { include: { role: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((m) => ({
      userId: m.user.id,
      displayName: m.user.displayName,
      email: m.user.email,
      functions: m.roles.map((r) => r.role.name),
    }));
  }

  /** Fonctions (noms de rôles) d'un utilisateur dans une organisation, ou null s'il n'est pas membre. */
  async memberFunctions(userId: string, organizationId: string): Promise<string[] | null> {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { roles: { include: { role: { select: { name: true } } } } },
    });
    return membership ? membership.roles.map((r) => r.role.name) : null;
  }

  organizationName(organizationId: string): Promise<string | null> {
    return this.prisma.organization
      .findUnique({ where: { id: organizationId }, select: { name: true } })
      .then((org) => org?.name ?? null);
  }

  /** Remplace l'unique fonction d'un membre (une fonction par appartenance — modèle simple FSPEC.19). */
  async setMemberFunction(userId: string, organizationId: string, roleId: string): Promise<void> {
    const membership = await this.prisma.organizationMembership.findUniqueOrThrow({
      where: { userId_organizationId: { userId, organizationId } },
      select: { id: true },
    });
    await this.prisma.$transaction([
      this.prisma.membershipRole.deleteMany({ where: { membershipId: membership.id } }),
      this.prisma.membershipRole.create({ data: { membershipId: membership.id, roleId } }),
    ]);
  }

  async removeMember(userId: string, organizationId: string): Promise<void> {
    await this.prisma.organizationMembership.deleteMany({ where: { userId, organizationId } });
  }

  /** Nombre de membres portant la fonction Owner (base de la règle « dernier Owner » — ORG-004). */
  countByFunction(organizationId: string, roleName: string): Promise<number> {
    return this.prisma.organizationMembership.count({
      where: { organizationId, roles: { some: { role: { name: roleName } } } },
    });
  }

  /** Rejoint (ou met à jour) une organisation avec une unique fonction. Idempotent. */
  async joinWithFunction(userId: string, organizationId: string, roleId: string): Promise<void> {
    const membership = await this.prisma.organizationMembership.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      update: {},
      create: { userId, organizationId },
      select: { id: true },
    });
    await this.prisma.$transaction([
      this.prisma.membershipRole.deleteMany({ where: { membershipId: membership.id } }),
      this.prisma.membershipRole.create({ data: { membershipId: membership.id, roleId } }),
    ]);
  }

  // --- Invitations (FSPEC.19 §6-8) ---

  createInvitation(input: {
    organizationId: string;
    email: string;
    function: string;
    tokenHash: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<OrganizationInvitation> {
    return this.prisma.organizationInvitation.create({ data: input });
  }

  listPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    return this.prisma.organizationInvitation.findMany({
      where: { organizationId, status: InvitationStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  findInvitationByToken(
    tokenHash: string,
  ): Promise<(OrganizationInvitation & { organization: { id: string; name: string } }) | null> {
    return this.prisma.organizationInvitation.findFirst({
      where: { tokenHash },
      include: { organization: { select: { id: true, name: true } } },
    });
  }

  findInvitation(id: string, organizationId: string): Promise<OrganizationInvitation | null> {
    return this.prisma.organizationInvitation.findFirst({ where: { id, organizationId } });
  }

  setInvitationStatus(id: string, status: InvitationStatus, acceptedAt?: Date): Promise<OrganizationInvitation> {
    return this.prisma.organizationInvitation.update({
      where: { id },
      data: { status, ...(acceptedAt ? { acceptedAt } : {}) },
    });
  }

  refreshInvitation(id: string, tokenHash: string, expiresAt: Date): Promise<OrganizationInvitation> {
    return this.prisma.organizationInvitation.update({
      where: { id },
      data: { tokenHash, expiresAt, status: InvitationStatus.PENDING },
    });
  }

  // --- Informations générales & activités couvertes (FSPEC.16) ---

  generalInfo(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true, name: true, slug: true, contactEmail: true, website: true, logoUrl: true,
        description: true, createdById: true, isActive: true,
        subscriptionPlan: { select: { key: true, name: true } },
        coveredActivities: { select: { activity: { select: { id: true, name: true } } } },
      },
    });
  }

  updateGeneralInfo(
    organizationId: string,
    data: { name?: string; contactEmail?: string | null; website?: string | null; logoUrl?: string | null; description?: string | null },
  ): Promise<unknown> {
    return this.prisma.organization.update({ where: { id: organizationId }, data });
  }

  /** Remplace l'ensemble des activités couvertes (validation explicite côté UI — FSPEC.16 §6). */
  async setCoveredActivities(organizationId: string, activityIds: string[]): Promise<void> {
    const unique = [...new Set(activityIds)];
    await this.prisma.$transaction([
      this.prisma.organizationActivity.deleteMany({ where: { organizationId } }),
      ...(unique.length
        ? [this.prisma.organizationActivity.createMany({
            data: unique.map((activityId) => ({ organizationId, activityId })),
            skipDuplicates: true,
          })]
        : []),
    ]);
  }

  /** Vrai si tous les identifiants correspondent à des activités actives (garde-fou d'intégrité). */
  async activitiesExist(activityIds: string[]): Promise<boolean> {
    if (activityIds.length === 0) {
      return true;
    }
    const count = await this.prisma.activity.count({
      where: { id: { in: [...new Set(activityIds)] }, isActive: true },
    });
    return count === new Set(activityIds).size;
  }
}
