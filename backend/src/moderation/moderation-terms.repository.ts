import { Injectable } from '@nestjs/common';
import { ModerationTermKind, type ModerationTerm } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';

/** Accès PostgreSQL du référentiel des termes de modération (Prisma confiné — ADR.02). */
@Injectable()
export class ModerationTermsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<ModerationTerm[]> {
    return this.prisma.moderationTerm.findMany({ orderBy: { term: 'asc' } });
  }

  /** Termes actifs uniquement (base des contrôles automatiques de soumission). */
  listActive(): Promise<ModerationTerm[]> {
    return this.prisma.moderationTerm.findMany({ where: { isActive: true } });
  }

  create(data: { term: string; kind: ModerationTermKind; isActive: boolean }): Promise<ModerationTerm> {
    return this.prisma.moderationTerm.create({ data });
  }

  update(
    id: string,
    data: Partial<{ term: string; kind: ModerationTermKind; isActive: boolean }>,
  ): Promise<ModerationTerm> {
    return this.prisma.moderationTerm.update({ where: { id }, data });
  }

  async delete(id: string): Promise<number> {
    const { count } = await this.prisma.moderationTerm.deleteMany({ where: { id } });
    return count;
  }
}
