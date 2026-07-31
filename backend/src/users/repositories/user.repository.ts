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

  /**
   * Active / suspend un compte, en gardant `status` synchronisé (FSPEC.18) : suspension → SUSPENDED ;
   * réactivation → ACTIVE si l'e-mail est vérifié, sinon retour à REGISTERED (IAM-003).
   */
  async setActive(id: string, isActive: boolean): Promise<UserWithRoles> {
    const current = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { emailVerifiedAt: true },
    });
    const status = !isActive ? 'SUSPENDED' : current.emailVerifiedAt ? 'ACTIVE' : 'REGISTERED';
    return this.prisma.user.update({
      where: { id },
      data: { isActive, status },
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
        // Nouveau compte : e-mail non encore vérifié (FSPEC.18 / IAM-003). La connexion reste
        // possible (fonctionnalités limitées) ; la vérification fait passer à ACTIVE.
        status: 'REGISTERED',
        roles: { create: [{ role: { connect: { id: input.roleId } } }] },
      },
      include: { roles: { include: { role: true } } },
    });
  }
}
