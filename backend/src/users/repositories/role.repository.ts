import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import type { Role } from '../entities/user.entity';

/**
 * Seul point d'accès PostgreSQL pour les rôles (encapsule Prisma — ADR.02).
 */
@Injectable()
export class RoleRepository extends BaseRepository<Role> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<Role> {
    return this.prisma.role as unknown as CrudDelegate<Role>;
  }

  findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }
}
