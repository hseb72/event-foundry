import { Injectable } from '@nestjs/common';
import type { EventFormat } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class EventFormatRepository extends ReferentialRepository<EventFormat> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<EventFormat> {
    return this.prisma.eventFormat as unknown as ReferentialDelegate<EventFormat>;
  }

  listByActivity(activityId: string, includeInactive: boolean): Promise<EventFormat[]> {
    return this.prisma.eventFormat.findMany({
      where: { activityId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { name: 'asc' },
    });
  }
}
