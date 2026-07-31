import { Injectable } from '@nestjs/common';
import type { EventType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { ReferentialDelegate, ReferentialRepository } from '../common/referential.repository';

@Injectable()
export class EventTypeRepository extends ReferentialRepository<EventType> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected get refDelegate(): ReferentialDelegate<EventType> {
    return this.prisma.eventType as unknown as ReferentialDelegate<EventType>;
  }
}
