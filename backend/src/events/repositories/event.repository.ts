import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import { EVENT_REFS_INCLUDE, type Event, type EventWithRefs } from '../entities/event.entity';

@Injectable()
export class EventRepository extends BaseRepository<Event> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  protected getDelegate(): CrudDelegate<Event> {
    return this.prisma.event as unknown as CrudDelegate<Event>;
  }

  /** Ne retourne jamais un Event supprimé logiquement (deletedAt). */
  findByIdWithRefs(id: string): Promise<EventWithRefs | null> {
    return this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: EVENT_REFS_INCLUDE,
    });
  }

  createWithRefs(data: Prisma.EventUncheckedCreateInput): Promise<EventWithRefs> {
    return this.prisma.event.create({ data, include: EVENT_REFS_INCLUDE });
  }
}
