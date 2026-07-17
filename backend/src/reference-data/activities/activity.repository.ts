import { Injectable } from '@nestjs/common';
import type { Activity } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

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
}
