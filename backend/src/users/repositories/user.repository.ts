import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import type { User, UserWithRoles } from '../entities/user.entity';

/**
 * Seul point d'accès PostgreSQL pour les utilisateurs (encapsule Prisma — ADR.02).
 */
@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<User> {
    return this.prisma.user as unknown as CrudDelegate<User>;
  }

  findByEmail(email: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  listWithRoles(): Promise<UserWithRoles[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: { roles: { include: { role: true } } },
    });
  }

  setActive(id: string, isActive: boolean): Promise<UserWithRoles> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: { roles: { include: { role: true } } },
    });
  }

  /** Remplace l'ensemble des rôles d'un utilisateur (écriture multi-cohérente, transaction). */
  replaceRoles(userId: string, roleIds: string[]): Promise<UserWithRoles> {
    return this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId, roleId })),
      });
      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      });
    });
  }

  createWithRole(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    roleId: string;
  }): Promise<UserWithRoles> {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        roles: { create: [{ role: { connect: { id: input.roleId } } }] },
      },
      include: { roles: { include: { role: true } } },
    });
  }
}
