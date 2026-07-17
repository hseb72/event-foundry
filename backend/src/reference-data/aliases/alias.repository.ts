import { Injectable } from '@nestjs/common';
import type { Alias } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class AliasRepository extends ReferentialRepository<Alias> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected orderBy: object = { value: 'asc' };

  protected get refDelegate(): ReferentialDelegate<Alias> {
    return this.prisma.alias as unknown as ReferentialDelegate<Alias>;
  }

  listByActivity(activityId: string, includeInactive: boolean): Promise<Alias[]> {
    return this.prisma.alias.findMany({
      where: { activityId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { value: 'asc' },
    });
  }
}
