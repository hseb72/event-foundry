import { Injectable } from '@nestjs/common';
import { EventVisibility, Prisma, type EventStatus, type EventStatusEvent } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BaseRepository, CrudDelegate } from '../../infra/repositories/base.repository';
import {
  EVENT_REFS_INCLUDE,
  type Event,
  type EventWithRefs,
  type EventWithRefsAndParticipation,
} from '../entities/event.entity';

export type ParticipationScope = 'all' | 'mine' | 'none';

/** Filtres de recherche d'Events (FSPEC.04). Le Domain n'est jamais un filtre. */
export interface SearchEventsFilter {
  userId: string;
  activityId?: string;
  eventTypeId?: string;
  eventFormatId?: string;
  organizerId?: string;
  venueId?: string;
  categoryId?: string;
  municipalityId?: string;
  tagId?: string;
  createdById?: string;
  status?: Prisma.EventWhereInput['status'];
  sort?: 'upcoming' | 'newest' | 'title';
  city?: string;
  text?: string;
  participationScope?: ParticipationScope;
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

  /**
   * Met à jour les champs éditables d'un Event et remplace intégralement ses tags (sémantique PUT).
   * Le remplacement des tags et la mise à jour des champs sont atomiques (écriture imbriquée Prisma).
   * La provenance (source) et le statut ne sont jamais modifiés ici.
   */
  updateWithRefs(
    id: string,
    data: Prisma.EventUncheckedUpdateInput,
    tagIds: string[],
  ): Promise<EventWithRefs> {
    return this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
      },
      include: EVENT_REFS_INCLUDE,
    });
  }

  /** Journalise une transition de statut (audit). `from` null pour la création initiale. */
  async recordStatusEvent(
    eventId: string,
    fromStatus: EventStatus | null,
    toStatus: EventStatus,
    actorId: string | null,
  ): Promise<void> {
    await this.prisma.eventStatusEvent.create({ data: { eventId, fromStatus, toStatus, actorId } });
  }

  listStatusEvents(eventId: string): Promise<EventStatusEvent[]> {
    return this.prisma.eventStatusEvent.findMany({
      where: { eventId },
      orderBy: { occurredAt: 'asc' },
    });
  }

  /**
   * Applique une transition de statut de façon cohérente (écriture multi-cohérente, transaction) :
   * met à jour le statut (+ publishedAt à la publication) et journalise le passage d'état.
   */
  applyTransition(
    id: string,
    fromStatus: EventStatus,
    toStatus: EventStatus,
    actorId: string | null,
  ): Promise<EventWithRefs> {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id },
        data: {
          status: toStatus,
          // Invariant FSPEC.22 : une publication garantit la visibilité PUBLIC (un événement diffusé
          // n'est jamais privé).
          ...(toStatus === 'PUBLISHED'
            ? { publishedAt: new Date(), visibility: EventVisibility.PUBLIC }
            : {}),
        },
        include: EVENT_REFS_INCLUDE,
      });
      await tx.eventStatusEvent.create({ data: { eventId: id, fromStatus, toStatus, actorId } });
      return event;
    });
  }

  async searchPaginated(
    filter: SearchEventsFilter,
  ): Promise<{ items: EventWithRefsAndParticipation[]; total: number }> {
    const where = this.buildWhere(filter);
    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: { ...EVENT_REFS_INCLUDE, participations: { where: { userId: filter.userId } } },
        orderBy: this.buildOrderBy(filter.sort),
        skip: filter.skip,
        take: filter.take,
      }),
      this.prisma.event.count({ where }),
    ]);
    return { items, total };
  }

  /** Tri de la découverte : à venir (défaut), nouveautés, ordre alphabétique. */
  private buildOrderBy(sort: SearchEventsFilter['sort']): Prisma.EventOrderByWithRelationInput {
    switch (sort) {
      case 'newest':
        return { publishedAt: 'desc' };
      case 'title':
        return { title: 'asc' };
      default:
        return { startsAt: 'asc' };
    }
  }

  /**
   * Événements **privés** d'un créateur (FSPEC.22 §15) : ses événements personnels non diffusés.
   * L'état de participation de l'utilisateur est joint (le créateur peut y avoir une participation).
   */
  listPrivateForCreator(userId: string): Promise<EventWithRefsAndParticipation[]> {
    return this.prisma.event.findMany({
      where: { deletedAt: null, visibility: EventVisibility.PRIVATE, createdById: userId },
      include: { ...EVENT_REFS_INCLUDE, participations: { where: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Événements du calendrier personnel : ceux ayant une participation de l'utilisateur. */
  listCalendarForUser(
    userId: string,
    startsFrom?: Date,
    startsTo?: Date,
  ): Promise<EventWithRefsAndParticipation[]> {
    const startsAt = this.buildDateFilter(startsFrom, startsTo);
    return this.prisma.event.findMany({
      where: {
        deletedAt: null,
        participations: { some: { userId } },
        ...(startsAt ? { startsAt } : {}),
      },
      include: { ...EVENT_REFS_INCLUDE, participations: { where: { userId } } },
      orderBy: { startsAt: 'asc' },
    });
  }

  private buildDateFilter(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
    if (!from && !to) {
      return undefined;
    }
    const filter: Prisma.DateTimeFilter = {};
    if (from) {
      filter.gte = from;
    }
    if (to) {
      filter.lte = to;
    }
    return filter;
  }

  private buildWhere(filter: SearchEventsFilter): Prisma.EventWhereInput {
    const startsAt = this.buildDateFilter(filter.startsFrom, filter.startsTo);

    return {
      deletedAt: null,
      // Les événements privés (FSPEC.22) ne paraissent jamais dans le catalogue / la recherche, ni
      // dans l'espace Organizer : ils sont exposés via une surface dédiée « Mes événements privés ».
      visibility: EventVisibility.PUBLIC,
      activityId: filter.activityId,
      eventTypeId: filter.eventTypeId,
      eventFormatId: filter.eventFormatId,
      organizerId: filter.organizerId,
      venueId: filter.venueId,
      categoryId: filter.categoryId,
      municipalityId: filter.municipalityId,
      createdById: filter.createdById,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.tagId ? { tags: { some: { tagId: filter.tagId } } } : {}),
      ...(startsAt ? { startsAt } : {}),
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
      ...(filter.participationScope === 'mine'
        ? { participations: { some: { userId: filter.userId } } }
        : {}),
      ...(filter.participationScope === 'none'
        ? { participations: { none: { userId: filter.userId } } }
        : {}),
    };
  }
}
