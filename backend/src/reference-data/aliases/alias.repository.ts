import { Injectable } from '@nestjs/common';
import type { Alias } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';
import { aliasData, aliasWhere, type AliasTarget } from './alias-target';

@Injectable()
export class AliasRepository extends ReferentialRepository<Alias> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected orderBy: object = { value: 'asc' };

  protected get refDelegate(): ReferentialDelegate<Alias> {
    return this.prisma.alias as unknown as ReferentialDelegate<Alias>;
  }

  /** Alias d'une entrée de référentiel, quel que soit le référentiel concerné. */
  listByTarget(target: AliasTarget, targetId: string, includeInactive: boolean): Promise<Alias[]> {
    return this.prisma.alias.findMany({
      where: { ...aliasWhere(target, targetId), ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { value: 'asc' },
    });
  }

  /** Tous les alias actifs, tous référentiels confondus — chargement en bloc par le Classifier. */
  listAllActive(): Promise<Alias[]> {
    return this.prisma.alias.findMany({ where: { isActive: true }, orderBy: { value: 'asc' } });
  }

  createForTarget(target: AliasTarget, targetId: string, value: string): Promise<Alias> {
    return this.prisma.alias.create({ data: aliasData(target, targetId, value) });
  }

  /**
   * Existence de l'entrée visée. Vérifiée ici, et non dans le Service, pour que l'accès Prisma
   * reste confiné à la couche Repository (ADR.02) — l'alias touchant cinq référentiels, injecter
   * cinq Repositories dans le Service aurait été le seul autre moyen.
   */
  async targetExists(target: AliasTarget, targetId: string): Promise<boolean> {
    const where = { id: targetId };
    const select = { id: true };
    const found = await (target === 'ACTIVITY'
      ? this.prisma.activity.findUnique({ where, select })
      : target === 'EVENT_TYPE'
        ? this.prisma.eventType.findUnique({ where, select })
        : target === 'SUBJECT'
          ? this.prisma.subject.findUnique({ where, select })
          : target === 'ORGANIZER'
            ? this.prisma.organizer.findUnique({ where, select })
            : this.prisma.venue.findUnique({ where, select }));
    return found !== null;
  }
}
