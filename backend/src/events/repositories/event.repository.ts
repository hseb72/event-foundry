import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import { EVENT_REFS_INCLUDE, type Event, type EventWithRefs } from '../entities/event.entity';

/** Filtres de recherche d'Events (FSPEC.04). Le Domain n'est jamais un filtre. */
export interface SearchEventsFilter {
  activityId?: string;
  eventTypeId?: string;
  eventFormatId?: string;
  organizerId?: string;
  venueId?: string;
  city?: string;
  text?: string;
  startsFrom?: Date;
  startsTo?: Date;
  skip: number;
  take: number;
}

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

  async searchPaginated(
    filter: SearchEventsFilter,
  ): Promise<{ items: EventWithRefs[]; total: number }> {
    const where = this.buildWhere(filter);
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: EVENT_REFS_INCLUDE,
        orderBy: { startsAt: 'asc' },
        skip: filter.skip,
        take: filter.take,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }

  private buildWhere(filter: SearchEventsFilter): Prisma.EventWhereInput {
    const startsAt: Prisma.DateTimeFilter = {};
    if (filter.startsFrom) {
      startsAt.gte = filter.startsFrom;
    }
    if (filter.startsTo) {
      startsAt.lte = filter.startsTo;
    }

    return {
      deletedAt: null,
      activityId: filter.activityId,
      eventTypeId: filter.eventTypeId,
      eventFormatId: filter.eventFormatId,
      organizerId: filter.organizerId,
      venueId: filter.venueId,
      ...(filter.startsFrom || filter.startsTo ? { startsAt } : {}),
      ...(filter.city
        ? { venue: { city: { contains: filter.city, mode: 'insensitive' } } }
        : {}),
      ...(filter.text
        ? {
            OR: [
              { title: { contains: filter.text, mode: 'insensitive' } },
              { description: { contains: filter.text, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }
}
