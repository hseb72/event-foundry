import { Injectable } from '@nestjs/common';
import type { Experience } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { identityInclude, type IdentityGraph } from '../entities/identity-graph.entity';

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

  /** Ajoute un rôle plateforme à un utilisateur (idempotent). */
  async addPlatformRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }
}
