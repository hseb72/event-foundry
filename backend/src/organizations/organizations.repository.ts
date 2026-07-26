import { Injectable } from '@nestjs/common';
import { Experience, RoleScope } from '@prisma/client';
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
        data: { name: input.name, slug: input.slug, subscriptionPlanId: input.subscriptionPlanId },
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
}
