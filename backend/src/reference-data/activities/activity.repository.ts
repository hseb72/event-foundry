import { Injectable } from '@nestjs/common';
import type { Activity } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

/** Activité + ses alias actifs (valeurs), pour une résolution alias-aware côté client. */
export type ActivityWithAliases = Activity & { aliases: { value: string }[] };

@Injectable()
export class ActivityRepository extends ReferentialRepository<Activity> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<Activity> {
    return this.prisma.activity as unknown as ReferentialDelegate<Activity>;
  }

  listByDomain(domainId: string, includeInactive: boolean): Promise<Activity[]> {
    return this.prisma.activity.findMany({
      where: { domainId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Liste les activités avec leurs alias actifs. Les alias sont exposés pour que le formulaire
   * reconnaisse un libellé extrait via un alias (apprentissage — Levier 2), pas seulement par nom.
   */
  listWithAliases(includeInactive: boolean, domainId?: string): Promise<ActivityWithAliases[]> {
    return this.prisma.activity.findMany({
      where: {
        ...(domainId ? { domainId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
      include: { aliases: { where: { isActive: true }, select: { value: true } } },
    });
  }
}
